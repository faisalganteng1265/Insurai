import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { createEthersWallet } from "../lib/ethersWallet.js";
import { config } from "../config.js";

export interface MarketData {
  source: "binance+alternative.me" | "simulated";
  symbol: string;
  candleInterval: string;
  candleLimit: number;
  priceProvider: string;
  sentimentProvider: string;
  btcPrice: number;
  volume24h: number;
  rsi: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  bollingerUpper: number;
  bollingerLower: number;
  fearGreedIndex: number;
  candleOpenTime: string;
  candleCloseTime: string;
  fetchedAt: string;
  timestamp: string;
}

export interface StrategyResult {
  tradeReturn: number;
  action: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  teeAttestationId: string;
  teeVerified: boolean;
  teeSignerAcknowledged: boolean;
  teeSignerAddress: string;
  marketData: MarketData;
  rawCompletion: string;
}

// ─── Technical indicator helpers ──────────────────────────────────────────────

/**
 * EMA using the standard multiplier k = 2/(period+1).
 * Seeds with the SMA of the first `period` values.
 * Returns an array of length (values.length - period + 1).
 */
function computeEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const emas: number[] = [seed];
  for (let i = period; i < values.length; i++) {
    emas.push(values[i]! * k + emas[emas.length - 1]! * (1 - k));
  }
  return emas;
}

/**
 * RSI(14) using Wilder's smoothing.
 * Needs at least 15 close prices.
 */
function computeRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  const changes = closes.slice(1).map((c, i) => c - closes[i]!);

  // Seed with simple average
  let avgGain =
    changes.slice(0, period).filter((c) => c > 0).reduce((a, b) => a + b, 0) / period;
  let avgLoss =
    changes.slice(0, period).filter((c) => c < 0).map((c) => -c).reduce((a, b) => a + b, 0) / period;

  // Wilder's smoothing
  for (const change of changes.slice(period)) {
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
  }

  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/**
 * MACD(12, 26, 9).
 * Aligns EMA12 and EMA26 by skipping the first 14 entries of EMA12
 * so both start at the same close price (index 25).
 */
function computeMACD(closes: number[]): {
  macdLine: number;
  signalLine: number;
  histogram: number;
} {
  const ema12 = computeEMA(closes, 12); // ema12[i] → closes[i + 11]
  const ema26 = computeEMA(closes, 26); // ema26[i] → closes[i + 25]

  if (ema12.length < 15 || ema26.length === 0) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  // ema12[i + 14] and ema26[i] both correspond to closes[i + 25]
  const macdValues = ema26.map((e26, i) => ema12[i + 14]! - e26);
  const signal = computeEMA(macdValues, 9);

  const last = macdValues[macdValues.length - 1] ?? 0;
  const lastSig = signal[signal.length - 1] ?? 0;
  return { macdLine: last, signalLine: lastSig, histogram: last - lastSig };
}

/**
 * Bollinger Bands(20, 2).
 * Returns upper and lower bands based on the last 20 closes.
 */
function computeBollinger(closes: number[], period: number = 20): {
  upper: number;
  lower: number;
} {
  const slice = closes.slice(-period);
  if (slice.length < period) return { upper: closes[closes.length - 1]!, lower: closes[closes.length - 1]! };

  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, c) => acc + (c - sma) ** 2, 0) / period;
  const stddev = Math.sqrt(variance);
  return { upper: sma + 2 * stddev, lower: sma - 2 * stddev };
}

// ─── Real market data fetch ────────────────────────────────────────────────────

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface BinanceTicker {
  lastPrice: string;
  volume: string;         // base asset volume
  quoteVolume: string;   // quote asset (USDT) volume
}

interface FearGreedResponse {
  data: Array<{ value: string }>;
}

async function fetchWithTimeout(url: string, timeoutMs = config.marketDataTimeoutMs): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchBinanceKlines(symbol = "BTCUSDT", interval = "1h", limit = 60): Promise<BinanceKline[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Binance klines ${res.status}: ${await res.text()}`);

  const raw = (await res.json()) as Array<[number, string, string, string, string, string, ...unknown[]]>;
  return raw.map(([openTime, open, high, low, close, volume]) => ({
    openTime,
    open,
    high,
    low,
    close,
    volume,
  }));
}

async function fetchBinanceTicker(symbol = "BTCUSDT"): Promise<BinanceTicker> {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Binance ticker ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BinanceTicker>;
}

async function fetchFearGreed(): Promise<number> {
  const res = await fetchWithTimeout("https://api.alternative.me/fng/?limit=1");
  if (!res.ok) throw new Error(`Fear & Greed ${res.status}`);
  const body = (await res.json()) as FearGreedResponse;
  const value = parseInt(body.data[0]?.value ?? "50", 10);
  return isNaN(value) ? 50 : Math.min(100, Math.max(0, value));
}

/**
 * Fetch live BTC market data from Binance + Alternative.me.
 * Computes RSI, MACD, EMA20/50, and Bollinger Bands from 60 hourly candles.
 * Throws on any network or parsing failure; production callers should fail closed.
 */
export async function fetchMarketData(): Promise<MarketData> {
  const symbol = config.marketDataSymbol;
  const interval = config.marketDataInterval;
  const limit = config.marketDataCandleLimit;

  const [klines, ticker, fearGreedIndex] = await Promise.all([
    fetchBinanceKlines(symbol, interval, limit),
    fetchBinanceTicker(symbol),
    fetchFearGreed(),
  ]);

  if (klines.length < 30) {
    throw new Error(`Not enough candles: got ${klines.length}, need ≥30`);
  }

  const closes = klines.map((k) => parseFloat(k.close));
  const btcPrice = parseFloat(ticker.lastPrice);
  const volume24h = parseFloat(ticker.quoteVolume); // USDT volume

  const rsi = computeRSI(closes);
  const { macdLine, signalLine: macdSignal, histogram: macdHistogram } = computeMACD(closes);
  const [ema20Last] = computeEMA(closes, 20).slice(-1);
  const [ema50Last] = computeEMA(closes, 50).slice(-1);
  const { upper: bollingerUpper, lower: bollingerLower } = computeBollinger(closes);
  const firstCandle = klines[0]!;
  const lastCandle = klines[klines.length - 1]!;
  const fetchedAt = new Date().toISOString();

  return {
    source: "binance+alternative.me",
    symbol,
    candleInterval: interval,
    candleLimit: limit,
    priceProvider: "binance",
    sentimentProvider: "alternative.me",
    btcPrice: parseFloat(btcPrice.toFixed(2)),
    volume24h: parseFloat(volume24h.toFixed(0)),
    rsi: parseFloat(rsi.toFixed(2)),
    macdLine: parseFloat(macdLine.toFixed(4)),
    macdSignal: parseFloat(macdSignal.toFixed(4)),
    macdHistogram: parseFloat(macdHistogram.toFixed(4)),
    ema20: parseFloat((ema20Last ?? btcPrice).toFixed(2)),
    ema50: parseFloat((ema50Last ?? btcPrice).toFixed(2)),
    bollingerUpper: parseFloat(bollingerUpper.toFixed(2)),
    bollingerLower: parseFloat(bollingerLower.toFixed(2)),
    fearGreedIndex,
    candleOpenTime: new Date(firstCandle.openTime).toISOString(),
    candleCloseTime: new Date(lastCandle.openTime).toISOString(),
    fetchedAt,
    timestamp: fetchedAt,
  };
}

/**
 * Simulated market data — used as demo fallback when live fetch fails.
 * Values are random but plausible; technical indicators are rule-based approximations.
 */
export function generateMarketData(): MarketData {
  const btcPrice = 42000 + (Math.random() - 0.5) * 12000;
  const rsi = 30 + Math.random() * 40;
  const macdLine = (Math.random() - 0.5) * 200;
  const macdSignal = macdLine + (Math.random() - 0.5) * 50;

  const generatedAt = new Date().toISOString();

  return {
    source: "simulated",
    symbol: config.marketDataSymbol,
    candleInterval: config.marketDataInterval,
    candleLimit: config.marketDataCandleLimit,
    priceProvider: "simulated",
    sentimentProvider: "simulated",
    btcPrice: parseFloat(btcPrice.toFixed(2)),
    volume24h: parseFloat((15e9 + Math.random() * 20e9).toFixed(0)),
    rsi: parseFloat(rsi.toFixed(2)),
    macdLine: parseFloat(macdLine.toFixed(4)),
    macdSignal: parseFloat(macdSignal.toFixed(4)),
    macdHistogram: parseFloat((macdLine - macdSignal).toFixed(4)),
    ema20: parseFloat((btcPrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
    ema50: parseFloat((btcPrice * (1 + (Math.random() - 0.5) * 0.04)).toFixed(2)),
    bollingerUpper: parseFloat((btcPrice * 1.04).toFixed(2)),
    bollingerLower: parseFloat((btcPrice * 0.96).toFixed(2)),
    fearGreedIndex: Math.floor(20 + Math.random() * 60),
    candleOpenTime: generatedAt,
    candleCloseTime: generatedAt,
    fetchedAt: generatedAt,
    timestamp: generatedAt,
  };
}

// ─── LLM prompt builders ──────────────────────────────────────────────────────

function buildSystemPrompt(strategyName: string): string {
  return `You are an AI trading strategy engine called "${strategyName}" running inside a 0G Compute TEE (Trusted Execution Environment).
Analyze real-time market data and output a deterministic trading decision in JSON format.
Your output is cryptographically attested and stored on-chain for insurance claim verification.
CRITICAL: Respond with ONLY valid JSON matching the exact schema below. No markdown, no extra text.`;
}

function buildUserPrompt(marketData: MarketData): string {
  return `Market Data:
- BTC Price: $${marketData.btcPrice.toLocaleString()}
- 24h Volume: $${(marketData.volume24h / 1e9).toFixed(2)}B
- RSI (14): ${marketData.rsi}
- MACD: Line ${marketData.macdLine} | Signal ${marketData.macdSignal} | Histogram ${marketData.macdHistogram}
- EMA20: $${marketData.ema20} | EMA50: $${marketData.ema50}
- Bollinger: Upper $${marketData.bollingerUpper} / Lower $${marketData.bollingerLower}
- Fear & Greed: ${marketData.fearGreedIndex}/100

Output JSON:
{
  "tradeReturn": <integer basis points, e.g. 350 for +3.5% or -2000 for -20%>,
  "action": "<buy|sell|hold>",
  "confidence": <integer 0-100>,
  "reasoning": "<2-3 sentence explanation>"
}`;
}

export async function runStrategyWithLLM(
  strategyName: string,
  marketData: MarketData
): Promise<StrategyResult> {
  const providerAddress = config.zgComputeProviderAddress;
  const providerLooksConfigured = /^0x[0-9a-fA-F]{40}$/.test(providerAddress);

  if (config.demoMode && !providerLooksConfigured) {
    const parsed = buildFallbackDecision(marketData);
    return {
      ...parsed,
      teeAttestationId: `TEE-0G-DEMO-${Date.now().toString(16).toUpperCase()}`,
      teeVerified: false,
      teeSignerAcknowledged: false,
      teeSignerAddress: "0x0000000000000000000000000000000000000000",
      marketData,
      rawCompletion: JSON.stringify(parsed),
    };
  }

  if (!providerAddress || providerAddress === "0x") {
    throw new Error("ZG_COMPUTE_PROVIDER_ADDRESS is not configured");
  }

  const wallet = createEthersWallet();
  const broker = await createZGComputeNetworkBroker(wallet);

  const signerStatus = await broker.inference.checkProviderSignerStatus(providerAddress);
  if (config.zgComputeRequireTeeAck && !signerStatus.isAcknowledged) {
    throw new Error(
      `0G Compute provider TEE signer is not acknowledged: ${signerStatus.teeSignerAddress}`
    );
  }

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  const messages = [
    { role: "system", content: buildSystemPrompt(strategyName) },
    { role: "user", content: buildUserPrompt(marketData) },
  ];

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      model: model ?? config.zgComputeModel,
      messages,
      temperature: 0.3,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`0G Compute returned ${response.status}: ${text}`);
  }

  const chatID = response.headers.get("ZG-Res-Key") ?? response.headers.get("zg-res-key") ?? "";
  const teeAttestationId = `TEE-0G-${chatID || Date.now().toString(16).toUpperCase()}`;

  let teeVerified = false;
  if (chatID) {
    try {
      teeVerified = (await broker.inference.processResponse(providerAddress, chatID)) === true;
    } catch (verifyErr) {
      console.warn("[zgCompute] TEE verification failed (non-fatal):", (verifyErr as Error).message);
    }
  }

  if (config.zgComputeRequireTeeResponse && !teeVerified) {
    throw new Error("0G Compute response TEE verification failed");
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const rawCompletion = data.choices[0]?.message?.content ?? "";
  const parsed = parseLLMResponse(rawCompletion, marketData);

  return {
    ...parsed,
    teeAttestationId,
    teeVerified,
    teeSignerAcknowledged: signerStatus.isAcknowledged,
    teeSignerAddress: signerStatus.teeSignerAddress,
    marketData,
    rawCompletion,
  };
}

function parseLLMResponse(
  raw: string,
  marketData: MarketData
): Pick<StrategyResult, "tradeReturn" | "action" | "confidence" | "reasoning"> {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.warn("[zgCompute] No JSON found in LLM response, using rule-based fallback");
    return buildFallbackDecision(marketData);
  }

  try {
    const obj = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const tradeReturn = clampTradeReturn(parseInt(String(obj["tradeReturn"] ?? "0"), 10));
    const rawAction = String(obj["action"] ?? "hold").toLowerCase();
    const action = (["buy", "sell", "hold"].includes(rawAction) ? rawAction : "hold") as "buy" | "sell" | "hold";
    const confidence = Math.min(100, Math.max(0, parseInt(String(obj["confidence"] ?? "50"), 10)));
    const reasoning = String(obj["reasoning"] ?? "No reasoning provided.");
    return { tradeReturn, action, confidence, reasoning };
  } catch {
    console.warn("[zgCompute] JSON parse error, using rule-based fallback");
    return buildFallbackDecision(marketData);
  }
}

function clampTradeReturn(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(10_000, Math.max(-10_000, Math.trunc(value)));
}

function buildFallbackDecision(
  marketData: MarketData
): Pick<StrategyResult, "tradeReturn" | "action" | "confidence" | "reasoning"> {
  const { rsi, macdHistogram, fearGreedIndex } = marketData;

  if (rsi < 35 && macdHistogram > 0 && fearGreedIndex < 40) {
    return {
      action: "buy",
      tradeReturn: Math.floor(150 + Math.random() * 400),
      confidence: 65,
      reasoning: "Oversold RSI with positive MACD crossover and extreme fear suggest a mean-reversion opportunity.",
    };
  }
  if (rsi > 65 && macdHistogram < 0 && fearGreedIndex > 60) {
    return {
      action: "sell",
      tradeReturn: -Math.floor(150 + Math.random() * 400),
      confidence: 68,
      reasoning: "Overbought RSI with negative MACD and greed sentiment indicates elevated risk; reducing exposure.",
    };
  }
  return {
    action: "hold",
    tradeReturn: 0,
    confidence: 50,
    reasoning: "No clear directional signal; maintaining current position.",
  };
}
