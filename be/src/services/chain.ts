import {
  keccak256,
  toHex,
  stringToBytes,
  encodeAbiParameters,
  type Hex,
} from "viem";
import { publicClient, walletClient, getAccount, zgChain } from "../contracts/client.js";
import {
  strategyRegistryAbi,
  policyManagerAbi,
  insurancePoolAbi,
  demoUsdcAbi,
} from "../contracts/abis.js";
import { config } from "../config.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnChainStrategy {
  id: bigint;
  provider: string;
  name: string;
  description: string;
  subscriptionFee: bigint;
  riskScore: bigint;
  isActive: boolean;
  totalCopiers: bigint;
  createdAt: bigint;
  teeAgentId: string;
  strategyStorageRoot: string;
  strategyConfigHash: string;
}

export interface OnChainAttestation {
  proofHash: string;
  teeAttestationId: string;
  storageRoot: string;
  tradeReturn: bigint;
  executionTimestamp: bigint;
  recordedAt: bigint;
}

export interface PoolStats {
  totalDeposits: bigint;
  premiumsCollected: bigint;
  claimsPaid: bigint;
  available: bigint;
  utilizationBps: bigint;
}

export interface RecordAttestationParams {
  strategyId: number;
  proofHash: Hex;
  teeAttestationId: string;
  storageRoot: Hex;
  tradeReturn: number;
  executionTimestamp: number;
  teeProof?: Hex;
}

export interface RecordAttestationResult {
  txHash: Hex;
  claimsTriggered: number;
  claimTxHashes: Hex[];
}

type StrategyTuple = readonly [
  bigint,
  `0x${string}`,
  string,
  string,
  bigint,
  bigint,
  boolean,
  bigint,
  bigint,
  `0x${string}`,
  `0x${string}`,
  `0x${string}`,
];

type AttestationTuple = readonly [
  `0x${string}`,
  `0x${string}`,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
];

type PolicyTuple = readonly [
  bigint,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  number,
  `0x${string}`,
  `0x${string}`,
  `0x${string}`,
];

interface PolicyStruct {
  id: bigint;
  copier: `0x${string}`;
  strategyId: bigint;
  coverageAmount: bigint;
  premium: bigint;
  lossThreshold: bigint;
  startTime: bigint;
  endTime: bigint;
  status: number;
  claimProofHash: `0x${string}`;
  claimTeeAttestationId: `0x${string}`;
  claimStorageRoot: `0x${string}`;
}

async function waitForReceipt(hash: Hex) {
  try {
    return await publicClient.waitForTransactionReceipt({
      hash,
      pollingInterval: 1_000,
      timeout: 60_000,
    });
  } catch (err) {
    console.warn(`[chain] waitForTransactionReceipt(${hash}) failed, retrying direct receipt lookup:`, (err as Error).message);
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        return await publicClient.getTransactionReceipt({ hash });
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
    throw err;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate and normalise a 32-byte hex string */
function hexToBytes32(hex: string): Hex {
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]{64}$/.test(stripped)) {
    throw new Error(`Expected bytes32 hex, got: ${hex}`);
  }
  return `0x${stripped}` as Hex;
}

/**
 * Derive a stable bytes32 key from a TEE attestation ID string.
 * Using keccak256 instead of string truncation prevents silent data loss
 * when IDs exceed 32 bytes, while keeping the on-chain value deterministic.
 */
export function teeIdToBytes32(id: string): Hex {
  return keccak256(toHex(stringToBytes(id)));
}

/**
 * Build a deterministic, domain-separated proof hash that commits to all
 * material fields of an attestation.
 *
 * Inputs bound in the hash:
 *   DOMAIN         – prevents cross-chain proof replay
 *   strategyId     – which strategy ran
 *   teeIdHash      – keccak256(teeAttestationId), preserves full-length ID
 *   tradeReturn    – the reported trade result
 *   timestamp      – wall-clock time of the execution
 *   storageRoot    – 0G Storage content root of the full execution trace
 *   strategyRoot   – 0G Storage root of the sealed strategy config
 *   configHash     – canonical hash of the strategy config committed on-chain
 *   teeSignerAddr  – TEE signer that produced the response
 *   marketDataHash – keccak256(JSON(marketData)), binds all input prices
 *   rawCompHash    – keccak256(rawCompletion), binds the raw LLM output
 */
export function buildProofHash(params: {
  strategyId: number;
  teeAttestationId: string;
  tradeReturn: number;
  timestamp: number;
  storageRoot: Hex;
  strategyStorageRoot: Hex;
  strategyConfigHash: Hex;
  teeSignerAddress: string;
  marketDataHash: Hex;
  rawCompletionHash: Hex;
}): Hex {
  const {
    strategyId,
    teeAttestationId,
    tradeReturn,
    timestamp,
    storageRoot,
    strategyStorageRoot,
    strategyConfigHash,
    teeSignerAddress,
    marketDataHash,
    rawCompletionHash,
  } = params;

  // Domain separator: keccak256("0G-INSURANCE-PROTOCOL-v1")
  const DOMAIN = keccak256(toHex(stringToBytes("0G-INSURANCE-PROTOCOL-v1")));
  const teeIdHash = teeIdToBytes32(teeAttestationId);

  // Normalize signer address: use zero address as fallback for unverified/missing TEE signer
  const signerAddr = /^0x[0-9a-fA-F]{40}$/.test(teeSignerAddress)
    ? (teeSignerAddress as `0x${string}`)
    : ("0x0000000000000000000000000000000000000000" as `0x${string}`);

  const encoded = encodeAbiParameters(
    [
      { type: "bytes32" }, // DOMAIN
      { type: "uint256" }, // strategyId
      { type: "bytes32" }, // teeIdHash
      { type: "int256" },  // tradeReturn
      { type: "uint256" }, // timestamp
      { type: "bytes32" }, // storageRoot
      { type: "bytes32" }, // strategyStorageRoot
      { type: "bytes32" }, // strategyConfigHash
      { type: "address" }, // teeSignerAddr
      { type: "bytes32" }, // marketDataHash
      { type: "bytes32" }, // rawCompletionHash
    ],
    [
      DOMAIN,
      BigInt(strategyId),
      teeIdHash,
      BigInt(tradeReturn),
      BigInt(timestamp),
      storageRoot,
      strategyStorageRoot,
      strategyConfigHash,
      signerAddr,
      marketDataHash,
      rawCompletionHash,
    ]
  );
  return keccak256(encoded);
}

// ─── StrategyRegistry ─────────────────────────────────────────────────────────

export async function recordAttestation(
  params: RecordAttestationParams
): Promise<RecordAttestationResult> {
  const { strategyId, proofHash, teeAttestationId, storageRoot, tradeReturn, executionTimestamp } = params;
  const teeProof = params.teeProof ?? "0x";

  // Use keccak256 hash of the original ID string — consistent with buildProofHash
  const teeAttestationIdBytes32 = teeIdToBytes32(teeAttestationId);
  const storageRootBytes32 = hexToBytes32(storageRoot);
  const proofHashBytes32 = hexToBytes32(proofHash);

  const account = getAccount();

  const txHash = await walletClient.writeContract({
    account,
    chain: zgChain,
    address: config.strategyRegistryAddress,
    abi: strategyRegistryAbi,
    functionName: "recordAttestation",
    args: [
      BigInt(strategyId),
      proofHashBytes32,
      teeAttestationIdBytes32,
      storageRootBytes32,
      BigInt(tradeReturn),
      BigInt(executionTimestamp),
      teeProof,
    ],
  });

  await waitForReceipt(txHash);

  const claimTxHashes = await triggerEligibleClaims(strategyId, proofHashBytes32, tradeReturn);

  return { txHash, claimsTriggered: claimTxHashes.length, claimTxHashes };
}

export async function getStrategy(strategyId: number): Promise<OnChainStrategy> {
  const result = await publicClient.readContract({
    address: config.strategyRegistryAddress,
    abi: strategyRegistryAbi,
    functionName: "getStrategy",
    args: [BigInt(strategyId)],
  });

  const s = result as StrategyTuple;

  return {
    id: s[0],
    provider: s[1],
    name: s[2],
    description: s[3],
    subscriptionFee: s[4],
    riskScore: s[5],
    isActive: s[6],
    totalCopiers: s[7],
    createdAt: s[8],
    teeAgentId: s[9],
    strategyStorageRoot: s[10],
    strategyConfigHash: s[11],
  };
}

export async function getAttestations(strategyId: number): Promise<OnChainAttestation[]> {
  const results = await publicClient.readContract({
    address: config.strategyRegistryAddress,
    abi: strategyRegistryAbi,
    functionName: "getAttestations",
    args: [BigInt(strategyId)],
  });

  const list = results as readonly AttestationTuple[];

  return list.map((a) => ({
    proofHash: a[0],
    teeAttestationId: a[1],
    storageRoot: a[2],
    tradeReturn: a[3],
    executionTimestamp: a[4],
    recordedAt: a[5],
  }));
}

export async function getStrategyCount(): Promise<bigint> {
  const count = await publicClient.readContract({
    address: config.strategyRegistryAddress,
    abi: strategyRegistryAbi,
    functionName: "strategyCount",
    args: [],
  });
  return count as bigint;
}

// ─── PolicyManager ─────────────────────────────────────────────────────────────

export async function getPolicy(policyId: number) {
  const result = await publicClient.readContract({
    address: config.policyManagerAddress,
    abi: policyManagerAbi,
    functionName: "getPolicy",
    args: [BigInt(policyId)],
  });

  return parsePolicyResult(result);
}

function parsePolicyResult(result: unknown) {
  const p = Array.isArray(result)
    ? ({
        id: result[0],
        copier: result[1],
        strategyId: result[2],
        coverageAmount: result[3],
        premium: result[4],
        lossThreshold: result[5],
        startTime: result[6],
        endTime: result[7],
        status: result[8],
        claimProofHash: result[9],
        claimTeeAttestationId: result[10],
        claimStorageRoot: result[11],
      } as PolicyStruct)
    : (result as PolicyStruct);

  const statusMap = ["Active", "Claimed", "Expired", "Cancelled"] as const;

  return {
    id: p.id.toString(),
    copier: p.copier,
    strategyId: p.strategyId.toString(),
    coverageAmount: p.coverageAmount.toString(),
    premium: p.premium.toString(),
    lossThreshold: p.lossThreshold.toString(),
    startTime: p.startTime.toString(),
    endTime: p.endTime.toString(),
    status: statusMap[p.status] ?? "Unknown",
    claimProofHash: p.claimProofHash,
    claimTeeAttestationId: p.claimTeeAttestationId,
    claimStorageRoot: p.claimStorageRoot,
    // Keep raw bigints for internal use
    _raw: p,
  };
}

export async function getCopierPolicies(copier: `0x${string}`): Promise<string[]> {
  const result = await publicClient.readContract({
    address: config.policyManagerAddress,
    abi: policyManagerAbi,
    functionName: "getCopierPolicies",
    args: [copier],
  });
  return (result as bigint[]).map((id) => id.toString());
}

export async function getStrategyPolicies(strategyId: number): Promise<bigint[]> {
  const result = await publicClient.readContract({
    address: config.policyManagerAddress,
    abi: policyManagerAbi,
    functionName: "getStrategyPolicies",
    args: [BigInt(strategyId)],
  });
  return result as bigint[];
}

/**
 * Fetch policies for a strategy and trigger claims for eligible ones.
 * Galileo custom chain config does not expose a multicall3 address in viem,
 * so this intentionally uses sequential reads for broad RPC compatibility.
 */
export async function triggerEligibleClaims(
  strategyId: number,
  proofHash: Hex,
  tradeReturn: number
): Promise<Hex[]> {
  if (tradeReturn >= 0) return [];

  const lossBps = BigInt(Math.abs(tradeReturn));
  const now = BigInt(Math.floor(Date.now() / 1000));
  const policyIds = await getStrategyPolicies(strategyId);

  if (policyIds.length === 0) return [];

  const claimTxHashes: Hex[] = [];

  for (let i = 0; i < policyIds.length; i++) {
    if (claimTxHashes.length >= config.maxClaimsPerAttestation) {
      console.warn(`[chain] claim trigger limit reached: ${config.maxClaimsPerAttestation}`);
      break;
    }

    const policyId = policyIds[i]!;
    let policy;
    try {
      policy = await getPolicy(Number(policyId));
    } catch (err) {
      console.warn(`[chain] getPolicy(${policyId.toString()}) failed:`, (err as Error).message);
      continue;
    }

    const isActive = policy.status === "Active";
    const isSameStrategy = BigInt(policy.strategyId) === BigInt(strategyId);
    const isUnexpired = policy._raw.endTime >= now;
    const crossesThreshold = lossBps >= policy._raw.lossThreshold;

    if (!isActive || !isSameStrategy || !isUnexpired || !crossesThreshold) {
      continue;
    }

    try {
      const account = getAccount();
      const txHash = await walletClient.writeContract({
        account,
        chain: zgChain,
        address: config.policyManagerAddress,
        abi: policyManagerAbi,
        functionName: "triggerClaim",
        args: [policyId, proofHash],
      });

      await waitForReceipt(txHash);
      claimTxHashes.push(txHash);
    } catch (err) {
      console.warn(
        `[chain] triggerClaim(${policyId.toString()}) skipped/failed:`,
        (err as Error).message
      );
    }
  }

  return claimTxHashes;
}

// ─── InsurancePool ─────────────────────────────────────────────────────────────

export async function getPoolStats(): Promise<PoolStats> {
  const result = await publicClient.readContract({
    address: config.insurancePoolAddress,
    abi: insurancePoolAbi,
    functionName: "poolStats",
    args: [],
  });

  const [_totalDeposits, _premiumsCollected, _claimsPaid, _available, _utilizationBps] =
    result as [bigint, bigint, bigint, bigint, bigint];

  return {
    totalDeposits: _totalDeposits,
    premiumsCollected: _premiumsCollected,
    claimsPaid: _claimsPaid,
    available: _available,
    utilizationBps: _utilizationBps,
  };
}

export async function getAvailableLiquidity(): Promise<bigint> {
  const result = await publicClient.readContract({
    address: config.insurancePoolAddress,
    abi: insurancePoolAbi,
    functionName: "availableLiquidity",
    args: [],
  });
  return result as bigint;
}

export async function mintDemoUsdc(to: `0x${string}`, amount: bigint): Promise<Hex> {
  const account = getAccount();
  const txHash = await walletClient.writeContract({
    account,
    chain: zgChain,
    address: config.usdcAddress,
    abi: demoUsdcAbi,
    functionName: "mint",
    args: [to, amount],
  });
  await waitForReceipt(txHash);
  return txHash;
}

export async function getDemoUsdcBalance(accountAddress: `0x${string}`): Promise<bigint> {
  const balance = await publicClient.readContract({
    address: config.usdcAddress,
    abi: demoUsdcAbi,
    functionName: "balanceOf",
    args: [accountAddress],
  });
  return balance as bigint;
}

export async function authorizeAttestor(attestor: `0x${string}`, authorized: boolean): Promise<Hex> {
  const account = getAccount();
  const txHash = await walletClient.writeContract({
    account,
    chain: zgChain,
    address: config.strategyRegistryAddress,
    abi: strategyRegistryAbi,
    functionName: "setAuthorizedAttestor",
    args: [attestor, authorized],
  });
  await waitForReceipt(txHash);
  return txHash;
}

export async function depositPoolFromRelayer(amount: bigint): Promise<{ approveTxHash: Hex; depositTxHash: Hex }> {
  const account = getAccount();
  const approveTxHash = await walletClient.writeContract({
    account,
    chain: zgChain,
    address: config.usdcAddress,
    abi: demoUsdcAbi,
    functionName: "approve",
    args: [config.insurancePoolAddress, amount],
  });
  await waitForReceipt(approveTxHash);

  const depositTxHash = await walletClient.writeContract({
    account,
    chain: zgChain,
    address: config.insurancePoolAddress,
    abi: insurancePoolAbi,
    functionName: "deposit",
    args: [amount],
  });
  await waitForReceipt(depositTxHash);

  return { approveTxHash, depositTxHash };
}

// ─── Serialization helper (for API responses) ─────────────────────────────────

/** Recursively convert BigInt values to strings for JSON serialization */
export function serializeBigInt<T>(obj: T): unknown {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)])
    );
  }
  return obj;
}
