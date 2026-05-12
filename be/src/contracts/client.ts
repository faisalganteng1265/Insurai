import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";

// 0G Chain. Defaults to mainnet; set ZG_CHAIN_ID=16602 for Galileo testnet.
export const zgChain = {
  id: config.zgChainId,
  name: config.zgChainName,
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: [config.zgRpcUrl] },
    public: { http: [config.zgRpcUrl] },
  },
} as const;

export const publicClient: PublicClient = createPublicClient({
  chain: zgChain,
  transport: http(config.zgRpcUrl),
});

function createWallet(): WalletClient {
  const key = config.providerPrivateKey;
  if (!key || key === "your_private_key_here") {
    console.warn("[client] PROVIDER_PRIVATE_KEY not set — write operations will fail");
    // Return a dummy wallet for read-only mode
    const dummyKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
    const account = privateKeyToAccount(dummyKey as `0x${string}`);
    return createWalletClient({ account, chain: zgChain, transport: http(config.zgRpcUrl) });
  }

  const normalizedKey = key.startsWith("0x") ? key : `0x${key}`;
  const account = privateKeyToAccount(normalizedKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: zgChain,
    transport: http(config.zgRpcUrl),
  });
}

export const walletClient: WalletClient = createWallet();

export function getAccount() {
  return walletClient.account!;
}
