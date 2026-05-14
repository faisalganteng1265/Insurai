import { keccak256, toHex, stringToBytes } from "viem";
import type { MarketData } from "./zgCompute.js";
import { fetchMarketData, generateMarketData, runStrategyWithLLM } from "./zgCompute.js";
import { uploadAttestationToStorage } from "./zgStorage.js";
import { recordAttestation, getStrategy, buildProofHash } from "./chain.js";
import { config } from "../config.js";

export interface ScheduledStrategy {
  strategyId: number;
  strategyName: string;
  intervalMs: number;
  isRunning: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
  lastReturn: number | null;
  lastAction: "buy" | "sell" | "hold" | null;
  lastError: string | null;
}

export interface CopyTradeFeedEntry {
  strategyId: number;
  strategyName: string;
  action: "buy" | "sell" | "hold";
  tradeReturn: number;
  confidence: number;
  reasoning: string;
  teeAttestationId: string;
  proofHash: string;
  txHash: string | null;
  timestamp: string;
}

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const schedules = new Map<number, {
  info: ScheduledStrategy;
  timer: ReturnType<typeof setInterval> | null;
}>();

const feed: CopyTradeFeedEntry[] = [];

export function getSchedulerStatus(): ScheduledStrategy[] {
  return Array.from(schedules.values()).map(({ info }) => ({ ...info }));
}

export function getFeed(limit = 50): CopyTradeFeedEntry[] {
  return feed.slice(0, limit);
}

async function executeRun(strategyId: number, strategyName: string): Promise<CopyTradeFeedEntry | null> {
  const slot = schedules.get(strategyId);
  if (!slot) return null;

  let marketData: MarketData;
  try {
    marketData = await fetchMarketData();
  } catch (err) {
    if (!config.demoMode) {
      slot.info.lastError = `Market data: ${(err as Error).message}`;
      slot.info.runCount += 1;
      slot.info.lastRunAt = new Date().toISOString();
      if (slot.info.isRunning) {
        slot.info.nextRunAt = new Date(Date.now() + slot.info.intervalMs).toISOString();
      }
      return null;
    }
    marketData = generateMarketData();
  }

  let entry: CopyTradeFeedEntry | null = null;

  try {
    const strategy = await getStrategy(strategyId);

    const llmResult = await runStrategyWithLLM(strategyName, marketData);
    const { tradeReturn, action, confidence, reasoning, teeAttestationId, rawCompletion } = llmResult;

    const executionTimestamp = Math.floor(Date.now() / 1000);
    const executionTimestampIso = new Date(executionTimestamp * 1000).toISOString();
    const marketDataHash = keccak256(toHex(stringToBytes(JSON.stringify(marketData))));
    const rawCompletionHash = keccak256(toHex(stringToBytes(rawCompletion)));

    const storageResult = await uploadAttestationToStorage({
      strategyId,
      strategyName,
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
    });

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

    let txHash: string | null = null;
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
    } catch (chainErr) {
      console.error(`[scheduler] Chain submission failed for ${strategyName}:`, chainErr);
    }

    entry = {
      strategyId,
      strategyName,
      action,
      tradeReturn,
      confidence,
      reasoning,
      teeAttestationId,
      proofHash,
      txHash,
      timestamp: executionTimestampIso,
    };

    feed.unshift(entry);
    if (feed.length > 200) feed.pop();

    slot.info.lastReturn = tradeReturn;
    slot.info.lastAction = action;
    slot.info.lastError = null;

    console.log(`[scheduler] ${strategyName} — action=${action} return=${tradeReturn}bps tx=${txHash ?? "none"}`);
  } catch (err) {
    slot.info.lastError = (err as Error).message;
    console.error(`[scheduler] Strategy ${strategyId} (${strategyName}) failed:`, err);
  }

  slot.info.runCount += 1;
  slot.info.lastRunAt = new Date().toISOString();
  if (slot.info.isRunning) {
    slot.info.nextRunAt = new Date(Date.now() + slot.info.intervalMs).toISOString();
  }

  return entry;
}

export function startSchedule(
  strategyId: number,
  strategyName: string,
  intervalMs = DEFAULT_INTERVAL_MS
): ScheduledStrategy {
  const existing = schedules.get(strategyId);
  if (existing?.timer) clearInterval(existing.timer);

  const info: ScheduledStrategy = {
    strategyId,
    strategyName,
    intervalMs,
    isRunning: true,
    lastRunAt: existing?.info.lastRunAt ?? null,
    nextRunAt: new Date(Date.now() + intervalMs).toISOString(),
    runCount: existing?.info.runCount ?? 0,
    lastReturn: existing?.info.lastReturn ?? null,
    lastAction: existing?.info.lastAction ?? null,
    lastError: null,
  };

  const timer = setInterval(() => {
    executeRun(strategyId, strategyName).catch(err =>
      console.error(`[scheduler] Unhandled error in strategy ${strategyId}:`, err)
    );
  }, intervalMs);

  schedules.set(strategyId, { info, timer });
  console.log(`[scheduler] Started ${strategyName} (id=${strategyId}) every ${intervalMs / 60000}min`);
  return { ...info };
}

export function stopSchedule(strategyId: number): boolean {
  const slot = schedules.get(strategyId);
  if (!slot) return false;
  if (slot.timer) clearInterval(slot.timer);
  slot.timer = null;
  slot.info.isRunning = false;
  slot.info.nextRunAt = null;
  console.log(`[scheduler] Stopped strategy ${strategyId}`);
  return true;
}

export async function runNow(strategyId: number, strategyName: string): Promise<CopyTradeFeedEntry | null> {
  const hadSlot = schedules.has(strategyId);
  if (!hadSlot) {
    schedules.set(strategyId, {
      info: {
        strategyId,
        strategyName,
        intervalMs: DEFAULT_INTERVAL_MS,
        isRunning: false,
        lastRunAt: null,
        nextRunAt: null,
        runCount: 0,
        lastReturn: null,
        lastAction: null,
        lastError: null,
      },
      timer: null,
    });
  }
  try {
    return await executeRun(strategyId, strategyName);
  } finally {
    if (!hadSlot) schedules.delete(strategyId);
  }
}
