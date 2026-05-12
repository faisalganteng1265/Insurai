import { Router, type Request, type Response } from "express";
import { getAccount } from "../contracts/client.js";
import { config } from "../config.js";
import {
  authorizeAttestor,
  buildProofHash,
  depositPoolFromRelayer,
  getDemoUsdcBalance,
  getPoolStats,
  getStrategy,
  mintDemoUsdc,
  recordAttestation,
} from "../services/chain.js";
import { keccak256, stringToBytes, toHex } from "viem";

export const demoRouter = Router();

function parseUsdcAmount(value: unknown, fallback: bigint): bigint {
  if (value === undefined || value === null || value === "") return fallback;
  const text = String(value);
  if (!/^\d+(\.\d{1,6})?$/.test(text)) {
    throw new Error("Amount must be a positive decimal with up to 6 decimals");
  }
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

function parseAddress(value: unknown): `0x${string}` {
  const address = String(value ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("Invalid EVM address");
  }
  return address as `0x${string}`;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (text === "true") return true;
  if (text === "false") return false;
  throw new Error("Boolean value must be true or false");
}

demoRouter.get("/status", async (_req: Request, res: Response) => {
  try {
    const account = getAccount().address;
    const [balance, poolStats] = await Promise.all([
      getDemoUsdcBalance(account),
      getPoolStats(),
    ]);

    res.json({
      chainId: config.zgChainId,
      chainName: config.zgChainName,
      relayer: account,
      contracts: {
        demoUsdc: config.usdcAddress,
        strategyRegistry: config.strategyRegistryAddress,
        policyManager: config.policyManagerAddress,
        insurancePool: config.insurancePoolAddress,
      },
      relayerDemoUsdcBalance: balance.toString(),
      pool: {
        totalDeposits: poolStats.totalDeposits.toString(),
        available: poolStats.available.toString(),
        utilizationBps: poolStats.utilizationBps.toString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to read demo status", detail: (err as Error).message });
  }
});

demoRouter.post("/mint", async (req: Request, res: Response) => {
  try {
    const to = parseAddress(req.body?.to);
    const amount = parseUsdcAmount(req.body?.amount, 10_000_000_000n);
    const txHash = await mintDemoUsdc(to, amount);
    res.json({ to, amount: amount.toString(), txHash });
  } catch (err) {
    res.status(400).json({ error: "Failed to mint DemoUSDC", detail: (err as Error).message });
  }
});

demoRouter.post("/authorize-attestor", async (req: Request, res: Response) => {
  try {
    const attestor = parseAddress(req.body?.attestor ?? getAccount().address);
    const authorized = parseBoolean(req.body?.authorized, true);
    const txHash = await authorizeAttestor(attestor, authorized);
    res.json({ attestor, authorized, txHash });
  } catch (err) {
    res.status(400).json({ error: "Failed to set attestor authorization", detail: (err as Error).message });
  }
});

demoRouter.post("/pool/deposit-relayer", async (req: Request, res: Response) => {
  try {
    const amount = parseUsdcAmount(req.body?.amount, 50_000_000_000n);
    const result = await depositPoolFromRelayer(amount);
    res.json({ amount: amount.toString(), ...result });
  } catch (err) {
    res.status(400).json({ error: "Failed to deposit relayer liquidity", detail: (err as Error).message });
  }
});

demoRouter.get("/strategies/:id/ready", async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(req.params["id"] ?? "", 10);
    if (!Number.isInteger(strategyId) || strategyId < 1) {
      res.status(400).json({ error: "strategyId must be a positive integer" });
      return;
    }

    const strategy = await getStrategy(strategyId);
    res.json({
      strategyId,
      exists: strategy.id !== 0n,
      active: strategy.isActive,
      name: strategy.name,
      provider: strategy.provider,
      riskScore: strategy.riskScore.toString(),
      subscriptionFee: strategy.subscriptionFee.toString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to read strategy readiness", detail: (err as Error).message });
  }
});

demoRouter.post("/force-loss-attestation", async (req: Request, res: Response) => {
  try {
    const strategyId = parseInt(String(req.body?.strategyId ?? "1"), 10);
    const tradeReturn = parseInt(String(req.body?.tradeReturn ?? "-3000"), 10);

    if (!Number.isInteger(strategyId) || strategyId < 1) {
      res.status(400).json({ error: "strategyId must be a positive integer" });
      return;
    }
    if (!Number.isInteger(tradeReturn) || tradeReturn >= 0) {
      res.status(400).json({ error: "tradeReturn must be a negative integer in basis points" });
      return;
    }

    const strategy = await getStrategy(strategyId);
    if (strategy.id === 0n || !strategy.isActive) {
      res.status(400).json({ error: "Strategy not found or inactive" });
      return;
    }

    const executionTimestamp = Math.floor(Date.now() / 1000);
    const teeAttestationId = `TEE-0G-DEMO-FORCE-${strategyId}-${executionTimestamp}`;
    const storageRoot = keccak256(
      toHex(stringToBytes(JSON.stringify({
        strategyId,
        tradeReturn,
        executionTimestamp,
        mode: "demo-force-loss",
      })))
    );
    const marketDataHash = keccak256(toHex(stringToBytes("demo-force-loss-market-data")));
    const rawCompletionHash = keccak256(toHex(stringToBytes(`demo-force-loss-${tradeReturn}`)));

    const proofHash = buildProofHash({
      strategyId,
      teeAttestationId,
      tradeReturn,
      timestamp: executionTimestamp,
      storageRoot,
      strategyStorageRoot: strategy.strategyStorageRoot as `0x${string}`,
      strategyConfigHash: strategy.strategyConfigHash as `0x${string}`,
      teeSignerAddress: "0x0000000000000000000000000000000000000000",
      marketDataHash,
      rawCompletionHash,
    });

    const chainResult = await recordAttestation({
      strategyId,
      proofHash,
      teeAttestationId,
      storageRoot,
      tradeReturn,
      executionTimestamp,
    });

    res.json({
      strategyId,
      tradeReturn,
      teeAttestationId,
      storageRoot,
      proofHash,
      executionTimestamp,
      executionTimestampIso: new Date(executionTimestamp * 1000).toISOString(),
      ...chainResult,
    });
  } catch (err) {
    res.status(400).json({ error: "Failed to force loss attestation", detail: (err as Error).message });
  }
});
