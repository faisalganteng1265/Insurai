import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const input = process.argv[2] ?? "../sc/deployments/latest.json";
const path = resolve(process.cwd(), input);
const deployment = JSON.parse(readFileSync(path, "utf8"));

const entries = {
  USDC_ADDRESS: deployment.demoUsdc,
  STRATEGY_REGISTRY_ADDRESS: deployment.strategyRegistry,
  INSURANCE_POOL_ADDRESS: deployment.insurancePool,
  POLICY_MANAGER_ADDRESS: deployment.policyManager,
  DEMO_STABLECARE_ALPHA_STRATEGY_ID: deployment.stablecareAlphaStrategyId,
  DEMO_PULSE_MOMENTUM_STRATEGY_ID: deployment.pulseMomentumStrategyId,
  DEMO_LIQUID_WELLNESS_STRATEGY_ID: deployment.liquidWellnessStrategyId,
};

for (const [key, value] of Object.entries(entries)) {
  if (value !== undefined && value !== null) {
    console.log(`${key}=${value}`);
  }
}
