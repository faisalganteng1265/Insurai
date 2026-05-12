// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStrategyRegistry {
    struct Strategy {
        uint256 id;
        address provider;
        string name;
        string description;
        uint256 subscriptionFee;
        uint256 riskScore;
        bool isActive;
        uint256 totalCopiers;
        uint256 createdAt;
        bytes32 teeAgentId;
        bytes32 strategyStorageRoot;
        bytes32 strategyConfigHash;
    }

    function getStrategy(uint256 strategyId) external view returns (Strategy memory);
    function isActiveSubscriber(uint256 strategyId, address copier) external view returns (bool);
    function usedAttestations(bytes32 proofHash) external view returns (bool);
    function getAttestation(bytes32 proofHash)
        external
        view
        returns (
            uint256 strategyId,
            bytes32 teeAttestationId,
            bytes32 storageRoot,
            int256 tradeReturn,
            uint256 executionTimestamp,
            uint256 recordedAt
        );
}

interface IInsurancePool {
    function receivePremium(uint256 policyId, uint256 amount) external;
    function reserveCoverage(uint256 amount) external;
    function releaseReserve(uint256 amount) external;
    function payClaim(uint256 policyId, address claimant, uint256 amount) external;
    function availableLiquidity() external view returns (uint256);
}

/// @notice Manages insurance policies for copy trading on 0G.
///         Copiers create policies by paying a premium; claims are verified via TEE attestations.
///         Premium formula: coverage × base_rate × risk_multiplier × threshold_discount.
contract PolicyManager is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum PolicyStatus {
        Active,
        Claimed,
        Expired,
        Cancelled
    }

    struct Policy {
        uint256 id;
        address copier;
        uint256 strategyId;
        uint256 coverageAmount; // max USDC payout
        uint256 premium; // USDC paid upfront
        uint256 lossThreshold; // bps — loss must exceed this to claim (e.g. 2000 = 20%)
        uint256 startTime;
        uint256 endTime;
        PolicyStatus status;
        bytes32 claimProofHash;
        bytes32 claimTeeAttestationId;
        bytes32 claimStorageRoot;
    }

    IERC20 public immutable usdc;
    IStrategyRegistry public immutable registry;
    IInsurancePool public pool;

    uint256 public policyCount;

    // base annual premium rate = 5% (500 bps), charged for 30 days = 500/12 ≈ 41 bps
    uint256 public constant BASE_RATE_BPS = 41;
    uint256 public constant COVERAGE_DURATION = 30 days;
    uint256 public constant MIN_THRESHOLD_BPS = 500; // 5%
    uint256 public constant MAX_THRESHOLD_BPS = 5000; // 50%

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public copierPolicies;
    mapping(uint256 => uint256[]) public strategyPolicies;
    mapping(uint256 => mapping(bytes32 => bool)) public usedPolicyClaimAttestations;

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed copier,
        uint256 indexed strategyId,
        uint256 coverageAmount,
        uint256 premium,
        uint256 lossThreshold
    );
    event ClaimTriggered(
        uint256 indexed policyId,
        address indexed copier,
        bytes32 indexed proofHash,
        uint256 lossBps,
        bytes32 teeAttestationId,
        bytes32 storageRoot
    );
    event ClaimApproved(uint256 indexed policyId, address indexed copier, uint256 payout);
    event PolicyExpired(uint256 indexed policyId);
    event PolicyCancelled(uint256 indexed policyId);

    constructor(address _usdc, address _registry, address _pool) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        registry = IStrategyRegistry(_registry);
        pool = IInsurancePool(_pool);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setPool(address _pool) external onlyOwner {
        pool = IInsurancePool(_pool);
    }

    // ─── Core ───────────────────────────────────────────────────────────────────

    /// @notice Calculates premium for a given coverage and threshold.
    ///         Higher risk score → higher premium. Higher threshold → lower premium (user absorbs more loss first).
    function calculatePremium(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold)
        public
        view
        returns (uint256 premium)
    {
        IStrategyRegistry.Strategy memory strategy = registry.getStrategy(strategyId);
        require(strategy.isActive, "Strategy not active");
        require(lossThreshold >= MIN_THRESHOLD_BPS && lossThreshold <= MAX_THRESHOLD_BPS, "Threshold must be 5%-50%");

        // riskMultiplier: 100–200 scaled by riskScore (1–100)
        uint256 riskMultiplier = 100 + strategy.riskScore;

        // thresholdDiscount: higher threshold = bigger discount (user takes on more first-loss)
        // threshold 5% → 0% discount; threshold 50% → 45% discount
        uint256 discountBps = (lossThreshold - MIN_THRESHOLD_BPS) * 10_000 / (MAX_THRESHOLD_BPS - MIN_THRESHOLD_BPS);
        uint256 thresholdFactor = 10_000 - (discountBps * 45 / 100); // max 45% discount

        premium = (coverageAmount * BASE_RATE_BPS * riskMultiplier * thresholdFactor) / (10_000 * 100 * 10_000);

        if (premium < 1e6) premium = 1e6; // minimum 1 USDC
    }

    function createPolicy(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 policyId)
    {
        require(registry.isActiveSubscriber(strategyId, msg.sender), "Must be active subscriber");
        require(coverageAmount > 0, "Coverage must be > 0");
        require(lossThreshold >= MIN_THRESHOLD_BPS && lossThreshold <= MAX_THRESHOLD_BPS, "Threshold must be 5%-50%");
        require(pool.availableLiquidity() >= coverageAmount, "Pool has insufficient liquidity");

        uint256 premium = calculatePremium(strategyId, coverageAmount, lossThreshold);

        policyId = ++policyCount;
        policies[policyId] = Policy({
            id: policyId,
            copier: msg.sender,
            strategyId: strategyId,
            coverageAmount: coverageAmount,
            premium: premium,
            lossThreshold: lossThreshold,
            startTime: block.timestamp,
            endTime: block.timestamp + COVERAGE_DURATION,
            status: PolicyStatus.Active,
            claimProofHash: bytes32(0),
            claimTeeAttestationId: bytes32(0),
            claimStorageRoot: bytes32(0)
        });

        copierPolicies[msg.sender].push(policyId);
        strategyPolicies[strategyId].push(policyId);

        // Pull premium from copier → forward to pool
        usdc.safeTransferFrom(msg.sender, address(pool), premium);
        pool.receivePremium(policyId, premium);

        // Lock coverage in pool
        pool.reserveCoverage(coverageAmount);

        emit PolicyCreated(policyId, msg.sender, strategyId, coverageAmount, premium, lossThreshold);
    }

    /// @notice Executes an auto-claim using a TEE proof recorded on StrategyRegistry.
    ///         Anyone can trigger it; payout always goes to the policy owner.
    ///         The attestation timestamp must fall within the policy coverage window
    ///         to prevent claims based on stale pre- or post-period trade data.
    function triggerClaim(uint256 policyId, bytes32 proofHash) external nonReentrant whenNotPaused {
        Policy storage policy = policies[policyId];

        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(!usedPolicyClaimAttestations[policyId][proofHash], "Attestation already used for policy");
        require(registry.usedAttestations(proofHash), "Attestation not registered on-chain");

        (
            uint256 attestationStrategyId,
            bytes32 teeAttestationId,
            bytes32 storageRoot,
            int256 tradeReturn,
            uint256 executionTimestamp,
        ) = registry.getAttestation(proofHash);

        require(attestationStrategyId == policy.strategyId, "Attestation strategy mismatch");
        require(tradeReturn < 0, "No loss reported");
        require(tradeReturn > type(int256).min, "Invalid loss value");

        // Attestation must be from within the active policy window.
        require(executionTimestamp >= policy.startTime, "Attestation predates policy");
        require(executionTimestamp <= policy.endTime, "Attestation outside policy period");

        // Safe after the bounds checks above: tradeReturn is negative but not int256 minimum.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint256 lossBps = uint256(-tradeReturn);
        require(lossBps >= policy.lossThreshold, "Loss below threshold");

        usedPolicyClaimAttestations[policyId][proofHash] = true;
        policy.claimProofHash = proofHash;
        policy.claimTeeAttestationId = teeAttestationId;
        policy.claimStorageRoot = storageRoot;
        policy.status = PolicyStatus.Claimed;

        emit ClaimTriggered(policyId, policy.copier, proofHash, lossBps, teeAttestationId, storageRoot);

        // Payout: full coverageAmount when threshold is breached
        uint256 payout = policy.coverageAmount;

        pool.payClaim(policyId, policy.copier, payout);

        emit ClaimApproved(policyId, policy.copier, payout);
    }

    function cancelPolicy(uint256 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.copier == msg.sender, "Not policy owner");
        require(policy.status == PolicyStatus.Active, "Policy not active");

        policy.status = PolicyStatus.Cancelled;
        pool.releaseReserve(policy.coverageAmount);

        emit PolicyCancelled(policyId);
    }

    /// @notice Anyone can expire a policy that has passed its end time.
    function expirePolicy(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(block.timestamp > policy.endTime, "Policy still active");

        policy.status = PolicyStatus.Expired;
        pool.releaseReserve(policy.coverageAmount);

        emit PolicyExpired(policyId);
    }

    // ─── Views ──────────────────────────────────────────────────────────────────

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function getCopierPolicies(address copier) external view returns (uint256[] memory) {
        return copierPolicies[copier];
    }

    function getStrategyPolicies(uint256 strategyId) external view returns (uint256[] memory) {
        return strategyPolicies[strategyId];
    }
}
