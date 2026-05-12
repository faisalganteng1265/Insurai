// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Optional plug-in interface for on-chain TEE proof verification.
///         Deploy a concrete verifier and call setTeeVerifier() to upgrade trust model.
interface ITEEVerifier {
    /// @return valid true if the proof is cryptographically valid
    function verify(
        bytes32 proofHash,
        bytes32 teeAttestationId,
        bytes32 storageRoot,
        uint256 executionTimestamp,
        bytes calldata proof
    ) external returns (bool valid);
}

/// @notice Registry for AI trading strategies deployed on 0G Compute (TEE-sealed).
///         Strategy providers register strategies; copiers subscribe and pay monthly fees.
///         TEE attestations record verifiable trade execution proofs on-chain.
contract StrategyRegistry is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Strategy {
        uint256 id;
        address provider;
        string name;
        string description;
        uint256 subscriptionFee; // USDC per month (6 decimals)
        uint256 riskScore; // 1–100, higher = riskier
        bool isActive;
        uint256 totalCopiers;
        uint256 createdAt;
        bytes32 teeAgentId; // 0G TEE compute agent identifier
        bytes32 strategyStorageRoot; // 0G Storage root for encrypted/sealed strategy config
        bytes32 strategyConfigHash; // Hash of the canonical strategy config
    }

    struct Attestation {
        bytes32 proofHash; // TEE-signed proof hash
        bytes32 teeAttestationId; // keccak256 of the 0G TEE attestation ID string
        bytes32 storageRoot; // 0G Storage record/root for the execution trace
        int256 tradeReturn; // basis points, negative = loss
        uint256 executionTimestamp;
        uint256 recordedAt;
    }

    IERC20 public immutable usdc;

    /// @notice Optional on-chain TEE verifier. Zero address = disabled (trust relayer model).
    ITEEVerifier public teeVerifier;

    uint256 public strategyCount;

    mapping(uint256 => Strategy) public strategies;
    mapping(uint256 => mapping(address => uint256)) public subscriptionExpiry;
    mapping(uint256 => Attestation[]) public attestations;
    mapping(bytes32 => Attestation) private attestationsByProofHash;
    mapping(bytes32 => uint256) public attestationStrategy;
    mapping(uint256 => uint256) public pendingFees;
    mapping(address => uint256[]) public providerStrategies;
    mapping(bytes32 => bool) public usedAttestations;
    mapping(address => bool) public authorizedAttestors;

    event StrategyRegistered(
        uint256 indexed strategyId,
        address indexed provider,
        string name,
        uint256 riskScore,
        bytes32 strategyStorageRoot,
        bytes32 strategyConfigHash
    );
    event Subscribed(uint256 indexed strategyId, address indexed copier, uint256 expiry);
    event AttestationRecorded(
        uint256 indexed strategyId,
        bytes32 indexed proofHash,
        bytes32 teeAttestationId,
        bytes32 storageRoot,
        int256 tradeReturn,
        uint256 executionTimestamp
    );
    event FeesClaimed(uint256 indexed strategyId, address indexed provider, uint256 amount);
    event StrategyDeactivated(uint256 indexed strategyId);
    event AttestorAuthorizationSet(address indexed attestor, bool authorized);
    event TeeVerifierSet(address indexed verifier);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Set (or clear) the optional on-chain TEE verifier.
    ///         Pass address(0) to revert to the relayer-trust model.
    function setTeeVerifier(address verifier) external onlyOwner {
        teeVerifier = ITEEVerifier(verifier);
        emit TeeVerifierSet(verifier);
    }

    function setAuthorizedAttestor(address attestor, bool authorized) external onlyOwner {
        require(attestor != address(0), "Invalid attestor");
        authorizedAttestors[attestor] = authorized;
        emit AttestorAuthorizationSet(attestor, authorized);
    }

    // ─── Core ───────────────────────────────────────────────────────────────────

    function registerStrategy(
        string calldata name,
        string calldata description,
        uint256 subscriptionFee,
        uint256 riskScore,
        bytes32 teeAgentId,
        bytes32 strategyStorageRoot,
        bytes32 strategyConfigHash
    ) external returns (uint256 strategyId) {
        require(riskScore >= 1 && riskScore <= 100, "Risk score must be 1-100");
        require(strategyConfigHash != bytes32(0), "Strategy config hash required");

        strategyId = ++strategyCount;
        strategies[strategyId] = Strategy({
            id: strategyId,
            provider: msg.sender,
            name: name,
            description: description,
            subscriptionFee: subscriptionFee,
            riskScore: riskScore,
            isActive: true,
            totalCopiers: 0,
            createdAt: block.timestamp,
            teeAgentId: teeAgentId,
            strategyStorageRoot: strategyStorageRoot,
            strategyConfigHash: strategyConfigHash
        });

        providerStrategies[msg.sender].push(strategyId);

        emit StrategyRegistered(strategyId, msg.sender, name, riskScore, strategyStorageRoot, strategyConfigHash);
    }

    function subscribe(uint256 strategyId) external nonReentrant whenNotPaused {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.isActive, "Strategy not active");
        require(strategy.provider != msg.sender, "Provider cannot subscribe to own strategy");

        if (strategy.subscriptionFee > 0) {
            usdc.safeTransferFrom(msg.sender, address(this), strategy.subscriptionFee);
            pendingFees[strategyId] += strategy.subscriptionFee;
        }

        uint256 currentExpiry = subscriptionExpiry[strategyId][msg.sender];
        uint256 base = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;

        if (currentExpiry == 0) {
            strategy.totalCopiers++;
        }

        subscriptionExpiry[strategyId][msg.sender] = base + 30 days;

        emit Subscribed(strategyId, msg.sender, base + 30 days);
    }

    /// @notice Records a TEE-signed attestation for a trade execution.
    ///         Called by the strategy provider (or a trusted relayer).
    ///         If a teeVerifier is configured, the proof is verified on-chain before recording.
    ///
    ///         teeAttestationId is expected to be keccak256(original TEE attestation ID string),
    ///         consistent with how the backend builds the proofHash.
    function recordAttestation(
        uint256 strategyId,
        bytes32 proofHash,
        bytes32 teeAttestationId,
        bytes32 storageRoot,
        int256 tradeReturn,
        uint256 executionTimestamp,
        bytes calldata teeProof
    ) external whenNotPaused {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.id != 0, "Strategy not found");
        require(strategy.isActive, "Strategy not active");
        require(
            strategy.provider == msg.sender || owner() == msg.sender || authorizedAttestors[msg.sender],
            "Not authorized"
        );
        require(!usedAttestations[proofHash], "Attestation already recorded");
        require(executionTimestamp <= block.timestamp, "Execution timestamp in future");

        // If a verifier is wired in, the proof must pass before we store anything.
        if (address(teeVerifier) != address(0)) {
            require(
                teeVerifier.verify(proofHash, teeAttestationId, storageRoot, executionTimestamp, teeProof),
                "TEE verification failed"
            );
        }

        usedAttestations[proofHash] = true;

        Attestation memory attestation = Attestation({
            proofHash: proofHash,
            teeAttestationId: teeAttestationId,
            storageRoot: storageRoot,
            tradeReturn: tradeReturn,
            executionTimestamp: executionTimestamp,
            recordedAt: block.timestamp
        });

        attestations[strategyId].push(attestation);
        attestationsByProofHash[proofHash] = attestation;
        attestationStrategy[proofHash] = strategyId;

        emit AttestationRecorded(strategyId, proofHash, teeAttestationId, storageRoot, tradeReturn, executionTimestamp);
    }

    function claimFees(uint256 strategyId) external nonReentrant {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.provider == msg.sender, "Not strategy provider");

        uint256 amount = pendingFees[strategyId];
        require(amount > 0, "No pending fees");

        pendingFees[strategyId] = 0;
        usdc.safeTransfer(msg.sender, amount);

        emit FeesClaimed(strategyId, msg.sender, amount);
    }

    function deactivateStrategy(uint256 strategyId) external {
        require(strategies[strategyId].provider == msg.sender, "Not strategy provider");
        strategies[strategyId].isActive = false;
        emit StrategyDeactivated(strategyId);
    }

    // ─── Views ──────────────────────────────────────────────────────────────────

    function isActiveSubscriber(uint256 strategyId, address copier) external view returns (bool) {
        return subscriptionExpiry[strategyId][copier] > block.timestamp;
    }

    function getStrategy(uint256 strategyId) external view returns (Strategy memory) {
        return strategies[strategyId];
    }

    function getAttestations(uint256 strategyId) external view returns (Attestation[] memory) {
        return attestations[strategyId];
    }

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
        )
    {
        require(usedAttestations[proofHash], "Attestation not registered");

        Attestation memory attestation = attestationsByProofHash[proofHash];
        return (
            attestationStrategy[proofHash],
            attestation.teeAttestationId,
            attestation.storageRoot,
            attestation.tradeReturn,
            attestation.executionTimestamp,
            attestation.recordedAt
        );
    }

    function getProviderStrategies(address provider) external view returns (uint256[] memory) {
        return providerStrategies[provider];
    }
}
