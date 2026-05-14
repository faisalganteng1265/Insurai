import { Router, type Request, type Response } from "express";
import {
  getSchedulerStatus,
  getFeed,
  startSchedule,
  stopSchedule,
  runNow,
} from "../services/scheduler.js";

export const copyTradeRouter = Router();

// ─── GET /api/copy-trade/status ───────────────────────────────────────────────

copyTradeRouter.get("/status", (_req: Request, res: Response) => {
  res.json({ schedulers: getSchedulerStatus() });
});

// ─── GET /api/copy-trade/feed ─────────────────────────────────────────────────

copyTradeRouter.get("/feed", (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query["limit"] ?? "50"), 10) || 50));
  res.json({ feed: getFeed(limit) });
});

// ─── POST /api/copy-trade/start ───────────────────────────────────────────────

copyTradeRouter.post("/start", (req: Request, res: Response) => {
  const { strategyId, strategyName, intervalMs } = req.body as {
    strategyId?: number;
    strategyName?: string;
    intervalMs?: number;
  };

  if (strategyId === undefined || strategyId === null || !Number.isInteger(strategyId) || strategyId < 1) {
    res.status(400).json({ error: "strategyId must be a positive integer" });
    return;
  }
  if (!strategyName || typeof strategyName !== "string") {
    res.status(400).json({ error: "strategyName is required" });
    return;
  }

  const resolvedInterval =
    intervalMs && Number.isInteger(intervalMs) && intervalMs >= 60_000
      ? intervalMs
      : 60 * 60 * 1000;

  const info = startSchedule(strategyId, strategyName, resolvedInterval);
  res.json({ status: "started", scheduler: info });
});

// ─── POST /api/copy-trade/stop ────────────────────────────────────────────────

copyTradeRouter.post("/stop", (req: Request, res: Response) => {
  const { strategyId } = req.body as { strategyId?: number };

  if (strategyId === undefined || !Number.isInteger(strategyId) || strategyId < 1) {
    res.status(400).json({ error: "strategyId must be a positive integer" });
    return;
  }

  const stopped = stopSchedule(strategyId);
  if (!stopped) {
    res.status(404).json({ error: `Strategy ${strategyId} is not scheduled` });
    return;
  }
  res.json({ status: "stopped", strategyId });
});

// ─── POST /api/copy-trade/run-now ─────────────────────────────────────────────

copyTradeRouter.post("/run-now", async (req: Request, res: Response) => {
  const { strategyId, strategyName } = req.body as {
    strategyId?: number;
    strategyName?: string;
  };

  if (strategyId === undefined || !Number.isInteger(strategyId) || strategyId < 1) {
    res.status(400).json({ error: "strategyId must be a positive integer" });
    return;
  }
  if (!strategyName || typeof strategyName !== "string") {
    res.status(400).json({ error: "strategyName is required" });
    return;
  }

  try {
    const entry = await runNow(strategyId, strategyName);
    res.json({ status: "ok", entry });
  } catch (err) {
    res.status(500).json({ error: "Run failed", detail: (err as Error).message });
  }
});
