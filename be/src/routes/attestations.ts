import { Router, type Request, type Response } from "express";
import { getAttestations, serializeBigInt } from "../services/chain.js";

export const attestationsRouter = Router();

// ─── GET /api/attestations/:strategyId ────────────────────────────────────────

attestationsRouter.get("/:strategyId", async (req: Request, res: Response) => {
  const strategyId = parseInt(req.params["strategyId"] ?? "", 10);

  if (isNaN(strategyId) || strategyId < 1) {
    res.status(400).json({ error: "strategyId must be a positive integer" });
    return;
  }

  try {
    const attestations = await getAttestations(strategyId);

    const formatted = attestations.map((a) => ({
      proofHash: a.proofHash,
      teeAttestationId: a.teeAttestationId,
      storageRoot: a.storageRoot,
      tradeReturn: a.tradeReturn.toString(),
      tradeReturnPct: (Number(a.tradeReturn) / 100).toFixed(2) + "%",
      executionTimestamp: a.executionTimestamp.toString(),
      executionTimestampIso: new Date(Number(a.executionTimestamp) * 1000).toISOString(),
      recordedAt: a.recordedAt.toString(),
      recordedAtIso: new Date(Number(a.recordedAt) * 1000).toISOString(),
      outcome: a.tradeReturn >= 0n ? "gain" : "loss",
    }));

    res.json({
      strategyId,
      count: formatted.length,
      attestations: formatted,
    });
  } catch (err) {
    console.error(`[attestations] getAttestations(${strategyId}) failed:`, err);
    res.status(500).json({
      error: "Failed to fetch attestations from chain",
      detail: (err as Error).message,
    });
  }
});
