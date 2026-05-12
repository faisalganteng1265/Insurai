// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/mocks/DemoUSDC.sol";
import "../src/StrategyRegistry.sol";
import "../src/InsurancePool.sol";
import "../src/PolicyManager.sol";

contract DemoFlow is Script {
    function run() external {
        _fundDemoActors();
        _depositUnderwriterLiquidity();
        uint256 policyId = _subscribeAndCreatePolicy();
        bytes32 proofHash = _recordLossAttestation();
        _triggerClaim(policyId, proofHash);

        console.log("Demo owner:", vm.addr(vm.envUint("PRIVATE_KEY")));
        console.log("Demo copier:", vm.addr(vm.envUint("COPIER_PRIVATE_KEY")));
        console.log("Demo underwriter:", vm.addr(vm.envUint("UNDERWRITER_PRIVATE_KEY")));
        console.log("Policy ID:", policyId);
        console.log("Proof hash:");
        console.logBytes32(proofHash);
        console.log("Copier dUSDC balance:", _usdc().balanceOf(vm.addr(vm.envUint("COPIER_PRIVATE_KEY"))));
    }

    function _fundDemoActors() internal {
        uint256 ownerKey = vm.envUint("PRIVATE_KEY");
        uint256 copierKey = vm.envUint("COPIER_PRIVATE_KEY");
        uint256 underwriterKey = vm.envUint("UNDERWRITER_PRIVATE_KEY");
        uint256 poolDeposit = vm.envOr("DEMO_POOL_DEPOSIT", uint256(50_000e6));

        vm.startBroadcast(ownerKey);
        _usdc().mint(vm.addr(copierKey), 10_000e6);
        _usdc().mint(vm.addr(underwriterKey), poolDeposit);
        _registry().setAuthorizedAttestor(vm.addr(ownerKey), true);
        vm.stopBroadcast();
    }

    function _depositUnderwriterLiquidity() internal {
        uint256 underwriterKey = vm.envUint("UNDERWRITER_PRIVATE_KEY");
        uint256 poolDeposit = vm.envOr("DEMO_POOL_DEPOSIT", uint256(50_000e6));

        vm.startBroadcast(underwriterKey);
        _usdc().approve(address(_pool()), poolDeposit);
        _pool().deposit(poolDeposit);
        vm.stopBroadcast();
    }

    function _subscribeAndCreatePolicy() internal returns (uint256 policyId) {
        uint256 copierKey = vm.envUint("COPIER_PRIVATE_KEY");
        uint256 strategyId = vm.envOr("DEMO_STRATEGY_ID", uint256(2));
        uint256 subscriptionFee = vm.envOr("DEMO_SUBSCRIPTION_FEE", uint256(10e6));
        uint256 coverage = vm.envOr("DEMO_COVERAGE", uint256(1_000e6));
        uint256 threshold = vm.envOr("DEMO_THRESHOLD_BPS", uint256(2_000));

        vm.startBroadcast(copierKey);
        _usdc().approve(address(_registry()), subscriptionFee);
        _registry().subscribe(strategyId);
        uint256 premium = _policyManager().calculatePremium(strategyId, coverage, threshold);
        _usdc().approve(address(_policyManager()), premium);
        policyId = _policyManager().createPolicy(strategyId, coverage, threshold);
        vm.stopBroadcast();
    }

    function _recordLossAttestation() internal returns (bytes32 proofHash) {
        uint256 ownerKey = vm.envUint("PRIVATE_KEY");
        uint256 strategyId = vm.envOr("DEMO_STRATEGY_ID", uint256(2));
        int256 tradeReturn = -int256(vm.envOr("DEMO_LOSS_BPS", uint256(3_000)));

        proofHash = keccak256(abi.encode(strategyId, "demo-attestation", tradeReturn, block.timestamp));

        vm.startBroadcast(ownerKey);
        _registry()
            .recordAttestation(
                strategyId,
                proofHash,
                keccak256("TEE-0G-DEMO"),
                keccak256("0G-STORAGE-DEMO"),
                tradeReturn,
                block.timestamp,
                ""
            );
        vm.stopBroadcast();
    }

    function _triggerClaim(uint256 policyId, bytes32 proofHash) internal {
        uint256 ownerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(ownerKey);
        _policyManager().triggerClaim(policyId, proofHash);
        vm.stopBroadcast();
    }

    function _usdc() internal view returns (DemoUSDC) {
        return DemoUSDC(vm.envAddress("DEMO_USDC_ADDRESS"));
    }

    function _registry() internal view returns (StrategyRegistry) {
        return StrategyRegistry(vm.envAddress("STRATEGY_REGISTRY_ADDRESS"));
    }

    function _pool() internal view returns (InsurancePool) {
        return InsurancePool(vm.envAddress("INSURANCE_POOL_ADDRESS"));
    }

    function _policyManager() internal view returns (PolicyManager) {
        return PolicyManager(vm.envAddress("POLICY_MANAGER_ADDRESS"));
    }
}
