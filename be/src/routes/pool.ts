import { Router, type Request, type Response } from "express";
import { getPoolStats } from "../services/chain.js";

export const poolRouter = Router();

// ─── GET /api/pool/stats ──────────────────────────────────────────────────────

poolRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getPoolStats();

    const totalDepositsUsdc = Number(stats.totalDeposits) / 1e6;
    const premiumsCollectedUsdc = Number(stats.premiumsCollected) / 1e6;
    const claimsPaidUsdc = Number(stats.claimsPaid) / 1e6;
    const availableUsdc = Number(stats.available) / 1e6;
    const utilizationBps = Number(stats.utilizationBps);

    // APY estimate: annualize premium yield over deposits
    // Annual yield = (premiumsCollected / totalDeposits) * 12 (assuming 30-day policy periods)
    const apyPct =
      totalDepositsUsdc > 0
        ? ((premiumsCollectedUsdc / totalDepositsUsdc) * 12 * 100).toFixed(2)
        : "0.00";

    res.json({
      // Raw bigint values (as strings) for precision
      totalDeposits: stats.totalDeposits.toString(),
      premiumsCollected: stats.premiumsCollected.toString(),
      claimsPaid: stats.claimsPaid.toString(),
      available: stats.available.toString(),
      utilizationBps: stats.utilizationBps.toString(),

      // Human-readable USDC amounts
      totalDepositsUsdc: totalDepositsUsdc.toFixed(6),
      premiumsCollectedUsdc: premiumsCollectedUsdc.toFixed(6),
      claimsPaidUsdc: claimsPaidUsdc.toFixed(6),
      availableUsdc: availableUsdc.toFixed(6),

      // Derived metrics
      utilizationPct: (utilizationBps / 100).toFixed(2),
      estimatedApyPct: apyPct,
      tvlUsdc: totalDepositsUsdc.toFixed(6),
    });
  } catch (err) {
    console.error("[pool] getPoolStats failed:", err);
    res.status(500).json({
      error: "Failed to fetch pool stats from chain",
      detail: (err as Error).message,
    });
  }
});
