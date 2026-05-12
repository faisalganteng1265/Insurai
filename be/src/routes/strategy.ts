import { Router, type Request, type Response } from "express";
import { keccak256, toHex, stringToBytes } from "viem";
import { fetchMarketData, generateMarketData, runStrategyWithLLM } from "../services/zgCompute.js";
import { uploadAttestationToStorage } from "../services/zgStorage.js";
import {
  recordAttestation,
  getStrategy,
  buildProofHash,
  serializeBigInt,
} from "../services/chain.js";
import { config } from "../config.js";

export const strategyRouter = Router();

// ─── POST /api/run-strategy ────────────────────────────────────────────────────

strategyRouter.post("/run-strategy", async (req: Request, res: Response) => {
  const { strategyId, strategyName } = req.body as {
    strategyId?: number;
    strategyName?: string;
  };

  if (strategyId === undefined || strategyId === null) {
    res.status(400).json({ error: "strategyId is required" });
    return;
  }
  if (!strategyName || typeof strategyName !== "string") {
    res.status(400).json({ error: "strategyName is required" });
    return;
  }

  try {
    const strategy = await getStrategy(strategyId);
    if (strategy.id === 0n || !strategy.isActive) {
      res.status(400).json({ error: "Strategy not found or inactive" });
      return;
    }

    const onChainStrategyName = strategy.name || strategyName;

    // 1. Fetch live market data from configured providers.
    // Random fallback is explicitly demo-only because market data drives claim eligibility.
    let marketData;
    try {
      marketData = await fetchMarketData();
      console.log(`[strategy] Live market data fetched: BTC=$${marketData.btcPrice}, RSI=${marketData.rsi}`);
    } catch (mktErr) {
      if (!config.demoMode) {
        res.status(503).json({
          error: "Live market data fetch failed",
          detail: (mktErr as Error).message,
          retryable: true,
        });
        return;
      }
      console.warn("[strategy] Live market data fetch failed, using DEMO_MODE simulated fallback:", (mktErr as Error).message);
      marketData = generateMarketData();
    }
    console.log(`[strategy] Running strategy ${strategyId} (${onChainStrategyName})`);

    // 2. Call 0G Compute LLM inside TEE
    let llmResult;
    try {
      llmResult = await runStrategyWithLLM(onChainStrategyName, marketData);
    } catch (llmErr) {
      res.status(502).json({
        error: "0G Compute LLM call failed",
        detail: (llmErr as Error).message,
      });
      return;
    }

    const { tradeReturn, action, confidence, reasoning, teeAttestationId, rawCompletion } = llmResult;
    console.log(`[strategy] LLM result: action=${action}, tradeReturn=${tradeReturn}bps, confidence=${confidence}%`);
    console.log(`[strategy] TEE attestation ID: ${teeAttestationId}`);

    // 3. Use one execution timestamp across storage, proof hash, and chain metadata
    const executionTimestamp = Math.floor(Date.now() / 1000);
    const executionTimestampIso = new Date(executionTimestamp * 1000).toISOString();

    // 4. Compute content hashes that will be bound into the proof hash
    const marketDataHash = keccak256(toHex(stringToBytes(JSON.stringify(marketData))));
    const rawCompletionHash = keccak256(toHex(stringToBytes(rawCompletion)));

    // 5. Store attestation to 0G Storage — must happen before proof hash so storageRoot is known
    const attestationPayload = {
      strategyId,
      strategyName: onChainStrategyName,
      strategyStorageRoot: strategy.strategyStorageRoot,
      strategyConfigHash: strategy.strategyConfigHash,
      teeAttestationId,
      teeVerified: llmResult.teeVerified,
      teeSignerAcknowledged: llmResult.teeSignerAcknowledged,
      teeSignerAddress: llmResult.teeSignerAddress,
      tradeReturn,
      action,
      confidence,
      reasoning,
      marketData: marketData as unknown as Record<string, unknown>,
      marketDataHash,
      rawCompletionHash,
      executionTimestamp,
      executionTimestampIso,
      timestamp: executionTimestampIso,
      version: "2.0.0",
    };

    const storageResult = await uploadAttestationToStorage(attestationPayload);
    console.log(`[strategy] Storage result: method=${storageResult.method}, root=${storageResult.storageRoot}`);

    // 6. Build proof hash — commits to all material fields including storageRoot
    const proofHash = buildProofHash({
      strategyId,
      teeAttestationId,
      tradeReturn,
      timestamp: executionTimestamp,
      storageRoot: storageResult.storageRoot,
      strategyStorageRoot: strategy.strategyStorageRoot as `0x${string}`,
      strategyConfigHash: strategy.strategyConfigHash as `0x${string}`,
      teeSignerAddress: llmResult.teeSignerAddress,
      marketDataHash,
      rawCompletionHash,
    });

    // 7. Submit recordAttestation on-chain
    let txHash: string;
    let claimsTriggered: number;
    let claimTxHashes: string[];

    try {
      const chainResult = await recordAttestation({
        strategyId,
        proofHash,
        teeAttestationId,
        storageRoot: storageResult.storageRoot,
        tradeReturn,
        executionTimestamp,
      });
      txHash = chainResult.txHash;
      claimsTriggered = chainResult.claimsTriggered;
      claimTxHashes = chainResult.claimTxHashes;
      console.log(`[strategy] On-chain tx: ${txHash}, claims triggered: ${claimsTriggered}`);
    } catch (chainErr) {
      // Return partial result if chain submission fails (LLM + storage output preserved)
      console.error("[strategy] Chain submission failed:", chainErr);
      res.status(207).json({
        strategyId,
        tradeReturn,
        action,
        confidence,
        reasoning,
        teeAttestationId,
        storageRoot: storageResult.storageRoot,
        storageMethod: storageResult.method,
        storageUploadId: storageResult.uploadId,
        storageRawRootHash: storageResult.rawRootHash,
        marketDataHash,
        rawCompletionHash,
        strategyStorageRoot: strategy.strategyStorageRoot,
        strategyConfigHash: strategy.strategyConfigHash,
        executionTimestamp,
        executionTimestampIso,
        proofHash,
        txHash: null,
        claimsTriggered: 0,
        claimTxHashes: [],
        warning: "On-chain submission failed",
        chainError: (chainErr as Error).message,
      });
      return;
    }

    // 8. Return full result
    res.json({
      strategyId,
      tradeReturn,
      action,
      confidence,
      reasoning,
      teeAttestationId,
      teeVerified: llmResult.teeVerified,
      teeSignerAcknowledged: llmResult.teeSignerAcknowledged,
      teeSignerAddress: llmResult.teeSignerAddress,
      storageRoot: storageResult.storageRoot,
      storageMethod: storageResult.method,
      storageUploadId: storageResult.uploadId,
      storageRawRootHash: storageResult.rawRootHash,
      marketDataHash,
      rawCompletionHash,
      strategyStorageRoot: strategy.strategyStorageRoot,
      strategyConfigHash: strategy.strategyConfigHash,
      executionTimestamp,
      executionTimestampIso,
      proofHash,
      txHash,
      claimsTriggered,
      claimTxHashes,
      marketData,
    });
  } catch (err) {
    console.error("[strategy] Unexpected error in run-strategy:", err);
    res.status(500).json({
      error: "Internal server error",
      detail: (err as Error).message,
    });
  }
});

// ─── GET /api/strategies/:id ───────────────────────────────────────────────────

strategyRouter.get("/strategies/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] ?? "", 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: "strategyId must be a positive integer" });
    return;
  }

  try {
    const strategy = await getStrategy(id);

    const formatted = serializeBigInt(strategy) as Record<string, unknown>;

    const riskScore = Number(strategy.riskScore);
    const riskLabel =
      riskScore <= 33 ? "Low" : riskScore <= 66 ? "Medium" : "High";

    res.json({
      ...formatted,
      riskLabel,
      subscriptionFeeUsdc: (Number(strategy.subscriptionFee) / 1e6).toFixed(2),
      createdAtIso: new Date(Number(strategy.createdAt) * 1000).toISOString(),
    });
  } catch (err) {
    console.error(`[strategy] getStrategy(${id}) failed:`, err);
    res.status(500).json({
      error: "Failed to fetch strategy from chain",
      detail: (err as Error).message,
    });
  }
});
