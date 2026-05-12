// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/mocks/DemoUSDC.sol";
import "../src/StrategyRegistry.sol";
import "../src/InsurancePool.sol";
import "../src/PolicyManager.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        string memory outputPath = vm.envOr("DEPLOY_OUTPUT", string("deployments/latest.json"));
        vm.startBroadcast(deployerKey);

        DemoUSDC usdc = new DemoUSDC();
        console.log("DemoUSDC:", address(usdc));

        StrategyRegistry registry = new StrategyRegistry(address(usdc));
        console.log("StrategyRegistry:", address(registry));

        InsurancePool pool = new InsurancePool(address(usdc));
        console.log("InsurancePool:", address(pool));

        PolicyManager policyManager = new PolicyManager(address(usdc), address(registry), address(pool));
        console.log("PolicyManager:", address(policyManager));

        pool.setPolicyManager(address(policyManager));
        console.log("PolicyManager set on InsurancePool");

        uint256 stablecareId = registry.registerStrategy(
            "Stablecare Alpha",
            "Low-volatility yield agent for stablecoin rotation",
            10e6,
            20,
            keccak256("tee-agent-stable-v3"),
            keccak256("0g-storage-strategy-stablecare-alpha-v1"),
            keccak256("strategy-config-stablecare-alpha-v1")
        );
        console.log("Stablecare Alpha strategyId:", stablecareId);

        uint256 pulseId = registry.registerStrategy(
            "Pulse Momentum",
            "Adaptive momentum agent for BTC and ETH regimes",
            10e6,
            40,
            keccak256("tee-agent-pulse-v2"),
            keccak256("0g-storage-strategy-pulse-momentum-v1"),
            keccak256("strategy-config-pulse-momentum-v1")
        );
        console.log("Pulse Momentum strategyId:", pulseId);

        uint256 liquidId = registry.registerStrategy(
            "Liquid Wellness",
            "Liquidity routing agent with claim-aware risk limits",
            10e6,
            25,
            keccak256("tee-agent-liquid-v1"),
            keccak256("0g-storage-strategy-liquid-wellness-v1"),
            keccak256("strategy-config-liquid-wellness-v1")
        );
        console.log("Liquid Wellness strategyId:", liquidId);

        address judgeWallet = vm.envOr("JUDGE_WALLET", address(0));
        if (judgeWallet != address(0)) {
            usdc.mint(judgeWallet, 10_000e6);
            console.log("Minted 10,000 dUSDC to judge:", judgeWallet);
        }

        uint256 seedPoolAmount = vm.envOr("SEED_POOL_AMOUNT", uint256(0));
        if (seedPoolAmount > 0) {
            usdc.approve(address(pool), seedPoolAmount);
            pool.deposit(seedPoolAmount);
            console.log("Seeded pool from deployer:", seedPoolAmount);
        }

        console.log("Deployer:", deployer);

        vm.stopBroadcast();

        string memory json = "deployment";
        vm.serializeAddress(json, "deployer", deployer);
        vm.serializeAddress(json, "demoUsdc", address(usdc));
        vm.serializeAddress(json, "strategyRegistry", address(registry));
        vm.serializeAddress(json, "insurancePool", address(pool));
        vm.serializeAddress(json, "policyManager", address(policyManager));
        vm.serializeUint(json, "stablecareAlphaStrategyId", stablecareId);
        vm.serializeUint(json, "pulseMomentumStrategyId", pulseId);
        string memory finalJson = vm.serializeUint(json, "liquidWellnessStrategyId", liquidId);
        vm.writeJson(finalJson, outputPath);
        console.log("Deployment JSON:", outputPath);
    }
}
