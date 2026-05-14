import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { strategyRouter } from "./routes/strategy.js";
import { attestationsRouter } from "./routes/attestations.js";
import { poolRouter } from "./routes/pool.js";
import { demoRouter } from "./routes/demo.js";
import { copyTradeRouter } from "./routes/copyTrade.js";
import { getStrategyCount, getStrategy } from "./services/chain.js";
import { startSchedule } from "./services/scheduler.js";

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CareGuard Finance Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    config: {
      zgRpcUrl: config.zgRpcUrl,
      zgChainId: config.zgChainId,
      zgChainName: config.zgChainName,
      strategyRegistryAddress: config.strategyRegistryAddress,
      policyManagerAddress: config.policyManagerAddress,
      insurancePoolAddress: config.insurancePoolAddress,
      zgComputeProviderAddress: config.zgComputeProviderAddress,
      zgComputeModel: config.zgComputeModel,
    },
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────

app.use("/api", strategyRouter);
app.use("/api/attestations", attestationsRouter);
app.use("/api/pool", poolRouter);
app.use("/api/demo", demoRouter);
app.use("/api/copy-trade", copyTradeRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    detail: err instanceof Error ? err.message : String(err),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function autoStartSchedulers() {
  try {
    const count = await getStrategyCount();
    console.log(`[scheduler] Found ${count} strategies on chain, auto-starting...`);
    for (let i = 1; i <= Number(count); i++) {
      try {
        const strategy = await getStrategy(i);
        if (strategy.isActive) {
          startSchedule(Number(strategy.id), strategy.name);
        }
      } catch (err) {
        console.warn(`[scheduler] Skipped strategy ${i}:`, (err as Error).message);
      }
    }
  } catch (err) {
    console.warn("[scheduler] Auto-start failed (chain unreachable?):", (err as Error).message);
  }
}

app.listen(config.port, () => {
  console.log(`\n  CareGuard Finance Backend`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Listening on http://localhost:${config.port}`);
  console.log(`  0G Chain:   ${config.zgChainName} (${config.zgChainId})`);
  console.log(`  0G RPC:     ${config.zgRpcUrl}`);
  console.log(`  0G Compute: ${config.zgComputeProviderAddress}`);
  console.log(`  Registry:   ${config.strategyRegistryAddress}`);
  console.log(`  Pool:       ${config.insurancePoolAddress}`);
  console.log(`  ─────────────────────────────────────────\n`);
  autoStartSchedulers();
});

export default app;
