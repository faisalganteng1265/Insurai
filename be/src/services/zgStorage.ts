import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { keccak256, stringToBytes } from "viem";
import { createEthersWallet } from "../lib/ethersWallet.js";
import { config } from "../config.js";

export interface AttestationPayload {
  strategyId: number;
  strategyName: string;
  strategyStorageRoot: `0x${string}` | string;
  strategyConfigHash: `0x${string}` | string;
  teeAttestationId: string;
  teeVerified: boolean;
  teeSignerAcknowledged: boolean;
  teeSignerAddress: string;
  tradeReturn: number;
  action: string;
  confidence: number;
  reasoning: string;
  marketData: Record<string, unknown>;
  marketDataHash: `0x${string}`;
  rawCompletionHash: `0x${string}`;
  executionTimestamp: number;
  executionTimestampIso: string;
  timestamp?: string;
  version: string;
}

export interface StorageResult {
  storageRoot: `0x${string}`;
  method: "0g-storage" | "keccak-fallback";
  uploadId?: string;
  rawRootHash?: string;
}

export async function uploadAttestationToStorage(payload: AttestationPayload): Promise<StorageResult> {
  const jsonContent = JSON.stringify(payload, null, 2);

  try {
    const result = await tryZgStorageUpload(jsonContent);
    if (result) return result;
  } catch (err) {
    console.warn("[zgStorage] 0G Storage upload failed, falling back to keccak256:", (err as Error).message);
  }

  return buildKeccakFallback(jsonContent);
}

async function tryZgStorageUpload(content: string): Promise<StorageResult | null> {
  if (!config.zgStorageIndexerRpc || !config.providerPrivateKey || config.providerPrivateKey === "your_private_key_here") {
    console.warn("[zgStorage] Missing storage config, skipping upload");
    return null;
  }

  const signer = createEthersWallet();
  const indexer = new Indexer(config.zgStorageIndexerRpc);

  // Encode JSON as bytes and wrap in MemData (in-memory upload, no temp files)
  const bytes = new TextEncoder().encode(content);
  const memData = new MemData(bytes);

  const [tx, err] = await indexer.upload(memData, config.zgRpcUrl, signer);
  if (err) throw new Error(String(err));

  const rootHash = (tx as { rootHash?: string })?.rootHash ?? "";
  if (!rootHash) throw new Error("Upload returned empty rootHash");

  return {
    storageRoot: rootHashToBytes32(rootHash),
    method: "0g-storage",
    uploadId: rootHash,
    rawRootHash: rootHash,
  };
}

function buildKeccakFallback(content: string): StorageResult {
  const hash = keccak256(stringToBytes(content));
  return { storageRoot: hash as `0x${string}`, method: "keccak-fallback" };
}

function rootHashToBytes32(hex: string): `0x${string}` {
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (/^[0-9a-fA-F]{64}$/.test(stripped)) {
    return `0x${stripped}`;
  }
  return keccak256(stringToBytes(hex)) as `0x${string}`;
}
