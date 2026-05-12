// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/mocks/DemoUSDC.sol";
import "../src/StrategyRegistry.sol";
import "../src/InsurancePool.sol";
import "../src/PolicyManager.sol";

contract MockTeeVerifier is ITEEVerifier {
    bool public shouldVerify = true;
    bytes32 public lastProofHash;
    bytes32 public lastTeeAttestationId;
    bytes32 public lastStorageRoot;
    uint256 public lastExecutionTimestamp;
    bytes public expectedProof;

    function setShouldVerify(bool value) external {
        shouldVerify = value;
    }

    function setExpectedProof(bytes calldata proof) external {
        expectedProof = proof;
    }

    function verify(
        bytes32 proofHash,
        bytes32 teeAttestationId,
        bytes32 storageRoot,
        uint256 executionTimestamp,
        bytes calldata proof
    ) external override returns (bool valid) {
        lastProofHash = proofHash;
        lastTeeAttestationId = teeAttestationId;
        lastStorageRoot = storageRoot;
        lastExecutionTimestamp = executionTimestamp;

        return shouldVerify && keccak256(proof) == keccak256(expectedProof);
    }
}

contract ProtocolTest is Test {
    DemoUSDC usdc;
    StrategyRegistry registry;
    InsurancePool pool;
    PolicyManager policyManager;

    address provider = makeAddr("provider");
    address copier = makeAddr("copier");
    address copierTwo = makeAddr("copierTwo");
    address underwriter = makeAddr("underwriter");

    uint256 constant STRATEGY_ID = 1;
    uint256 constant SUBSCRIPTION_FEE = 10e6; // 10 USDC
    uint256 constant COVERAGE = 1000e6; // 1000 USDC
    uint256 constant THRESHOLD = 2000; // 20%
    bytes32 constant STRATEGY_STORAGE_ROOT = keccak256("0g-strategy-config-root-001");
    bytes32 constant STRATEGY_CONFIG_HASH = keccak256("strategy-config-001");

    function _recordAttestation(
        uint256 strategyId,
        bytes32 proofHash,
        bytes32 teeAttestationId,
        bytes32 storageRoot,
        int256 tradeReturn
    ) internal {
        registry.recordAttestation(
            strategyId, proofHash, teeAttestationId, storageRoot, tradeReturn, block.timestamp, ""
        );
    }

    function _recordAttestationAt(
        uint256 strategyId,
        bytes32 proofHash,
        bytes32 teeAttestationId,
        bytes32 storageRoot,
        int256 tradeReturn,
        uint256 executionTimestamp
    ) internal {
        registry.recordAttestation(
            strategyId, proofHash, teeAttestationId, storageRoot, tradeReturn, executionTimestamp, ""
        );
    }

    function setUp() public {
        usdc = new DemoUSDC();
        registry = new StrategyRegistry(address(usdc));
        pool = new InsurancePool(address(usdc));
        policyManager = new PolicyManager(address(usdc), address(registry), address(pool));

        pool.setPolicyManager(address(policyManager));

        usdc.mint(copier, 10_000e6);
        usdc.mint(copierTwo, 10_000e6);
        usdc.mint(underwriter, 100_000e6);
        usdc.mint(provider, 1_000e6);
    }

    function _registerStrategy() internal returns (uint256 strategyId) {
        vm.prank(provider);
        strategyId = registry.registerStrategy(
            "Alpha Momentum",
            "Trend-following AI strategy on BTC/ETH",
            SUBSCRIPTION_FEE,
            40,
            keccak256("tee-agent-001"),
            STRATEGY_STORAGE_ROOT,
            STRATEGY_CONFIG_HASH
        );
    }

    function _fundPool() internal {
        vm.startPrank(underwriter);
        usdc.approve(address(pool), 50_000e6);
        pool.deposit(50_000e6);
        vm.stopPrank();
    }

    function _subscribe(uint256 strategyId) internal {
        vm.startPrank(copier);
        usdc.approve(address(registry), SUBSCRIPTION_FEE);
        registry.subscribe(strategyId);
        vm.stopPrank();
    }

    // --- StrategyRegistry ---

    function test_RegisterStrategy() public {
        uint256 id = _registerStrategy();
        StrategyRegistry.Strategy memory s = registry.getStrategy(id);

        assertEq(s.id, 1);
        assertEq(s.provider, provider);
        assertEq(s.name, "Alpha Momentum");
        assertEq(s.riskScore, 40);
        assertEq(s.strategyStorageRoot, STRATEGY_STORAGE_ROOT);
        assertEq(s.strategyConfigHash, STRATEGY_CONFIG_HASH);
        assertTrue(s.isActive);
    }

    function test_Subscribe() public {
        uint256 id = _registerStrategy();
        _subscribe(id);

        assertTrue(registry.isActiveSubscriber(id, copier));
        assertEq(registry.pendingFees(id), SUBSCRIPTION_FEE);
    }

    function test_ProviderClaimsFees() public {
        uint256 id = _registerStrategy();
        _subscribe(id);

        uint256 balanceBefore = usdc.balanceOf(provider);
        vm.prank(provider);
        registry.claimFees(id);

        assertEq(usdc.balanceOf(provider), balanceBefore + SUBSCRIPTION_FEE);
        assertEq(registry.pendingFees(id), 0);
    }

    function test_RecordAttestation() public {
        uint256 id = _registerStrategy();
        bytes32 hash = keccak256("attestation-001");
        bytes32 teeId = keccak256("tee-attestation-001");
        bytes32 storageRoot = keccak256("0g-storage-001");
        uint256 executionTimestamp = block.timestamp;

        vm.prank(provider);
        _recordAttestation(id, hash, teeId, storageRoot, -1500); // -15% return

        StrategyRegistry.Attestation[] memory atts = registry.getAttestations(id);
        assertEq(atts.length, 1);
        assertEq(atts[0].proofHash, hash);
        assertEq(atts[0].teeAttestationId, teeId);
        assertEq(atts[0].storageRoot, storageRoot);
        assertEq(atts[0].tradeReturn, -1500);
        assertEq(atts[0].executionTimestamp, executionTimestamp);
        assertEq(atts[0].recordedAt, block.timestamp);
        assertTrue(registry.usedAttestations(hash));
    }

    function test_RecordAttestationUsesConfiguredVerifier() public {
        uint256 id = _registerStrategy();
        MockTeeVerifier verifier = new MockTeeVerifier();
        bytes memory teeProof = hex"123456";
        verifier.setExpectedProof(teeProof);
        registry.setTeeVerifier(address(verifier));

        bytes32 hash = keccak256("verified-attestation");
        bytes32 teeId = keccak256("verified-tee");
        bytes32 storageRoot = keccak256("verified-storage");
        uint256 executionTimestamp = block.timestamp;

        vm.prank(provider);
        registry.recordAttestation(id, hash, teeId, storageRoot, -2500, executionTimestamp, teeProof);

        assertTrue(registry.usedAttestations(hash));
        assertEq(verifier.lastProofHash(), hash);
        assertEq(verifier.lastTeeAttestationId(), teeId);
        assertEq(verifier.lastStorageRoot(), storageRoot);
        assertEq(verifier.lastExecutionTimestamp(), executionTimestamp);
    }

    function test_CannotRecordAttestationWhenVerifierRejects() public {
        uint256 id = _registerStrategy();
        MockTeeVerifier verifier = new MockTeeVerifier();
        verifier.setExpectedProof(hex"abcd");
        registry.setTeeVerifier(address(verifier));

        vm.prank(provider);
        vm.expectRevert("TEE verification failed");
        registry.recordAttestation(
            id,
            keccak256("rejected-attestation"),
            keccak256("rejected-tee"),
            keccak256("rejected-storage"),
            -2500,
            block.timestamp,
            hex"1234"
        );
    }

    function test_CannotRecordFutureExecutionTimestamp() public {
        uint256 id = _registerStrategy();

        vm.prank(provider);
        vm.expectRevert("Execution timestamp in future");
        registry.recordAttestation(
            id,
            keccak256("future-attestation"),
            keccak256("future-tee"),
            keccak256("future-storage"),
            -2500,
            block.timestamp + 1,
            ""
        );
    }

    function test_CannotRecordAttestationForMissingStrategy() public {
        vm.expectRevert("Strategy not found");
        registry.recordAttestation(
            999,
            keccak256("missing-attestation"),
            keccak256("tee-missing"),
            keccak256("0g-missing-storage"),
            -3000,
            block.timestamp,
            ""
        );
    }

    function test_CannotRecordAttestationForInactiveStrategy() public {
        uint256 id = _registerStrategy();

        vm.prank(provider);
        registry.deactivateStrategy(id);

        vm.prank(provider);
        vm.expectRevert("Strategy not active");
        _recordAttestation(
            id, keccak256("inactive-attestation"), keccak256("tee-inactive"), keccak256("0g-inactive-storage"), -3000
        );
    }

    function test_AuthorizedAttestorCanRecordAttestation() public {
        uint256 id = _registerStrategy();
        address relayer = makeAddr("relayer");
        bytes32 hash = keccak256("relayer-attestation");

        registry.setAuthorizedAttestor(relayer, true);

        vm.prank(relayer);
        _recordAttestation(id, hash, keccak256("tee-relayer"), keccak256("0g-relayer-storage"), -3000);

        assertTrue(registry.usedAttestations(hash));
    }

    // --- InsurancePool ---

    function test_UnderwriterDeposit() public {
        _fundPool();

        assertEq(pool.totalDeposits(), 50_000e6);
        assertEq(pool.shares(underwriter), 50_000e6);
    }

    function test_CannotResetPolicyManager() public {
        vm.expectRevert("PolicyManager already set");
        pool.setPolicyManager(makeAddr("otherPolicyManager"));
    }

    function test_UnderwriterWithdraw() public {
        _fundPool();

        uint256 balanceBefore = usdc.balanceOf(underwriter);
        vm.prank(underwriter);
        pool.withdraw(25_000e6);

        assertEq(usdc.balanceOf(underwriter), balanceBefore + 25_000e6);
        assertEq(pool.totalDeposits(), 25_000e6);
    }

    function test_FaucetCanBeClaimedOnce() public {
        address judge = makeAddr("judge");

        vm.prank(judge);
        usdc.claimDemoUsdc();

        assertEq(usdc.balanceOf(judge), usdc.FAUCET_AMOUNT());
        assertTrue(usdc.hasClaimedFaucet(judge));

        vm.prank(judge);
        vm.expectRevert("Faucet already claimed");
        usdc.claimDemoUsdc();
    }

    function test_OnlyOwnerCanMintDemoUSDC() public {
        address judge = makeAddr("judge");

        vm.prank(judge);
        vm.expectRevert();
        usdc.mint(judge, 1e6);
    }

    function test_CannotWithdrawReserved() public {
        _fundPool();

        // Simulate a reserve being placed
        vm.prank(address(policyManager));
        pool.reserveCoverage(50_000e6);

        vm.prank(underwriter);
        vm.expectRevert("Insufficient available liquidity");
        pool.withdraw(1e6);
    }

    // --- PolicyManager ---

    function test_CreatePolicy() public {
        uint256 id = _registerStrategy();
        _fundPool();
        _subscribe(id);

        uint256 premium = policyManager.calculatePremium(id, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyId = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        PolicyManager.Policy memory p = policyManager.getPolicy(policyId);
        assertEq(p.copier, copier);
        assertEq(p.coverageAmount, COVERAGE);
        assertEq(p.lossThreshold, THRESHOLD);
        assertEq(uint8(p.status), uint8(PolicyManager.PolicyStatus.Active));
    }

    function test_TriggerClaimAndPayout() public {
        uint256 id = _registerStrategy();
        _fundPool();
        _subscribe(id);

        uint256 premium = policyManager.calculatePremium(id, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyId = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        // Provider records a losing trade attestation
        bytes32 attHash = keccak256("loss-attestation-001");
        vm.prank(provider);
        _recordAttestation(id, attHash, keccak256("tee-loss-attestation-001"), keccak256("0g-loss-storage-001"), -3000);

        uint256 copierBalanceBefore = usdc.balanceOf(copier);

        // Anyone can trigger the auto-claim; payout still goes to the policy owner.
        address keeper = makeAddr("keeper");
        vm.prank(keeper);
        policyManager.triggerClaim(policyId, attHash); // 30% loss, above 20% threshold

        PolicyManager.Policy memory p = policyManager.getPolicy(policyId);
        assertEq(uint8(p.status), uint8(PolicyManager.PolicyStatus.Claimed));
        assertEq(p.claimProofHash, attHash);
        assertEq(usdc.balanceOf(copier), copierBalanceBefore + COVERAGE);
    }

    function test_SameAttestationCanClaimMultipleActivePolicies() public {
        uint256 id = _registerStrategy();
        _fundPool();
        _subscribe(id);

        vm.startPrank(copierTwo);
        usdc.approve(address(registry), SUBSCRIPTION_FEE);
        registry.subscribe(id);
        vm.stopPrank();

        uint256 premium = policyManager.calculatePremium(id, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyIdOne = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        vm.startPrank(copierTwo);
        usdc.approve(address(policyManager), premium);
        uint256 policyIdTwo = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        bytes32 attHash = keccak256("shared-loss-attestation-001");
        vm.prank(provider);
        _recordAttestation(
            id, attHash, keccak256("tee-shared-loss-attestation-001"), keccak256("0g-shared-loss-storage-001"), -3000
        );

        uint256 copierBalanceBefore = usdc.balanceOf(copier);
        uint256 copierTwoBalanceBefore = usdc.balanceOf(copierTwo);

        policyManager.triggerClaim(policyIdOne, attHash);
        policyManager.triggerClaim(policyIdTwo, attHash);

        assertEq(usdc.balanceOf(copier), copierBalanceBefore + COVERAGE);
        assertEq(usdc.balanceOf(copierTwo), copierTwoBalanceBefore + COVERAGE);
    }

    function test_CannotClaimBelowThreshold() public {
        uint256 id = _registerStrategy();
        _fundPool();
        _subscribe(id);

        uint256 premium = policyManager.calculatePremium(id, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyId = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        bytes32 attHash = keccak256("small-loss-001");
        vm.prank(provider);
        _recordAttestation(id, attHash, keccak256("tee-small-loss-001"), keccak256("0g-small-loss-storage-001"), -1000); // only -10% loss

        vm.prank(copier);
        vm.expectRevert("Loss below threshold");
        policyManager.triggerClaim(policyId, attHash);
    }

    function test_CannotClaimWithExecutionTimestampBeforePolicyStart() public {
        vm.warp(1 days);
        uint256 id = _registerStrategy();
        _fundPool();
        _subscribe(id);

        uint256 premium = policyManager.calculatePremium(id, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyId = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        PolicyManager.Policy memory policy = policyManager.getPolicy(policyId);
        bytes32 attHash = keccak256("pre-policy-loss-001");

        vm.prank(provider);
        _recordAttestationAt(
            id,
            attHash,
            keccak256("tee-pre-policy-001"),
            keccak256("0g-pre-policy-storage-001"),
            -3000,
            policy.startTime - 1
        );

        vm.expectRevert("Attestation predates policy");
        policyManager.triggerClaim(policyId, attHash);
    }

    function test_CannotClaimWithAttestationFromDifferentStrategy() public {
        uint256 coveredStrategyId = _registerStrategy();
        _fundPool();
        _subscribe(coveredStrategyId);

        vm.prank(provider);
        uint256 otherStrategyId = registry.registerStrategy(
            "Beta Mean Reversion",
            "Different AI strategy",
            SUBSCRIPTION_FEE,
            80,
            keccak256("tee-agent-002"),
            keccak256("0g-strategy-config-root-002"),
            keccak256("strategy-config-002")
        );

        uint256 premium = policyManager.calculatePremium(coveredStrategyId, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyId = policyManager.createPolicy(coveredStrategyId, COVERAGE, THRESHOLD);
        vm.stopPrank();

        bytes32 attHash = keccak256("wrong-strategy-loss-001");
        vm.prank(provider);
        _recordAttestation(
            otherStrategyId,
            attHash,
            keccak256("tee-wrong-strategy-001"),
            keccak256("0g-wrong-strategy-storage-001"),
            -4000
        );

        vm.expectRevert("Attestation strategy mismatch");
        policyManager.triggerClaim(policyId, attHash);
    }

    function test_PolicyExpiry() public {
        uint256 id = _registerStrategy();
        _fundPool();
        _subscribe(id);

        uint256 premium = policyManager.calculatePremium(id, COVERAGE, THRESHOLD);

        vm.startPrank(copier);
        usdc.approve(address(policyManager), premium);
        uint256 policyId = policyManager.createPolicy(id, COVERAGE, THRESHOLD);
        vm.stopPrank();

        vm.warp(block.timestamp + 31 days);
        policyManager.expirePolicy(policyId);

        PolicyManager.Policy memory p = policyManager.getPolicy(policyId);
        assertEq(uint8(p.status), uint8(PolicyManager.PolicyStatus.Expired));
    }
}
