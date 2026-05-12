import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined || val === "") {
    console.warn(`[config] WARNING: ${name} is not set`);
    return "";
  }
  return val;
}

export const config = {
  port: parseInt(process.env["PORT"] ?? "3001", 10),
  demoMode: (process.env["DEMO_MODE"] ?? "false").toLowerCase() === "true",

  // 0G Chain
  zgChainId: parseInt(process.env["ZG_CHAIN_ID"] ?? "16661", 10),
  zgChainName: requireEnv("ZG_CHAIN_NAME", "0G Mainnet"),
  zgRpcUrl: requireEnv("ZG_RPC_URL", "https://evmrpc.0g.ai"),
  providerPrivateKey: requireEnv("PROVIDER_PRIVATE_KEY"),

  // Contract addresses
  strategyRegistryAddress: requireEnv("STRATEGY_REGISTRY_ADDRESS", "0x0000000000000000000000000000000000000000") as `0x${string}`,
  policyManagerAddress: requireEnv("POLICY_MANAGER_ADDRESS", "0x0000000000000000000000000000000000000000") as `0x${string}`,
  insurancePoolAddress: requireEnv("INSURANCE_POOL_ADDRESS", "0x0000000000000000000000000000000000000000") as `0x${string}`,
  usdcAddress: requireEnv("USDC_ADDRESS", "0x0000000000000000000000000000000000000000") as `0x${string}`,
  maxClaimsPerAttestation: parseInt(process.env["MAX_CLAIMS_PER_ATTESTATION"] ?? "25", 10),

  // Market data
  marketDataSymbol: requireEnv("MARKET_DATA_SYMBOL", "BTCUSDT"),
  marketDataInterval: requireEnv("MARKET_DATA_INTERVAL", "1h"),
  marketDataCandleLimit: parseInt(process.env["MARKET_DATA_CANDLE_LIMIT"] ?? "60", 10),
  marketDataTimeoutMs: parseInt(process.env["MARKET_DATA_TIMEOUT_MS"] ?? "5000", 10),

  // 0G Compute
  zgComputeProviderAddress: requireEnv("ZG_COMPUTE_PROVIDER_ADDRESS") as `0x${string}`,
  zgComputeModel: requireEnv("ZG_COMPUTE_MODEL", "Qwen/Qwen2.5-7B-Instruct"),
  zgComputeRequireTeeAck: (process.env["ZG_COMPUTE_REQUIRE_TEE_ACK"] ?? "true").toLowerCase() !== "false",
  zgComputeRequireTeeResponse: (process.env["ZG_COMPUTE_REQUIRE_TEE_RESPONSE"] ?? "true").toLowerCase() !== "false",

  // 0G Storage
  zgStorageRpc: requireEnv("ZG_STORAGE_RPC", "https://rpc-storage.0g.ai"),
  zgStorageIndexerRpc: requireEnv("ZG_STORAGE_INDEXER_RPC", "https://indexer-storage-turbo.0g.ai"),
} as const;
