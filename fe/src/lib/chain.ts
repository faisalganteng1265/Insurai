import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseAbi,
  parseUnits,
  type Address,
  type WalletClient,
} from 'viem'

export const insuraiChain = {
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ZG_RPC_URL ?? 'https://evmrpc.0g.ai'] },
  },
} as const

export const CONTRACTS = {
  demoUsdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '0x986d494b19f8eb3fa19f201dcd1ee6f67003d57f') as Address,
  strategyRegistry: (process.env.NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS ?? '0xb4a54d664c7f4c725e81bcba4ac8ad665e6665b8') as Address,
  insurancePool: (process.env.NEXT_PUBLIC_INSURANCE_POOL_ADDRESS ?? '0xb6a99e8698695d3fec7c18abd07df9134c9caccd') as Address,
  policyManager: (process.env.NEXT_PUBLIC_POLICY_MANAGER_ADDRESS ?? '0xbdaea5744ac79132c96420ce13de3d18c38feeca') as Address,
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://surgeons-implies-mills-booth.trycloudflare.com'

export const EXPLORER_BASE = 'https://chainscan.0g.ai'
export function explorerTx(hash: string) { return `${EXPLORER_BASE}/tx/${hash}` }
export function explorerAddress(addr: string) { return `${EXPLORER_BASE}/address/${addr}` }

export async function waitForReceipt(hash: `0x${string}`) {
  try {
    return await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 300_000,
      pollingInterval: 3_000,
    })
  } catch (err) {
    const msg = (err as Error).message ?? ''
    if (msg.includes('could not be found') || msg.includes('not processed')) {
      // tx submitted but chain is slow — treat as success
      return null
    }
    throw err
  }
}

export const publicClient = createPublicClient({
  chain: insuraiChain,
  transport: http(insuraiChain.rpcUrls.default.http[0]),
})

export const strategyRegistryAbi = parseAbi([
  'function subscribe(uint256 strategyId) external',
  'function getStrategy(uint256 strategyId) external view returns ((uint256,address,string,string,uint256,uint256,bool,uint256,uint256,bytes32,bytes32,bytes32))',
  'function getAttestations(uint256 strategyId) external view returns ((bytes32,bytes32,bytes32,int256,uint256,uint256)[])',
  'function isActiveSubscriber(uint256 strategyId, address copier) external view returns (bool)',
  'function strategyCount() external view returns (uint256)',
  'function registerStrategy(string name, string description, uint256 subscriptionFee, uint256 riskScore, bytes32 teeAgentId, bytes32 strategyStorageRoot, bytes32 strategyConfigHash) external returns (uint256)',
  'function getProviderStrategies(address provider) external view returns (uint256[])',
  'function claimFees(uint256 strategyId) external',
  'function pendingFees(uint256 strategyId) external view returns (uint256)',
])

export const policyManagerAbi = parseAbi([
  'function createPolicy(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold) external returns (uint256 policyId)',
  'function getPolicy(uint256 policyId) external view returns ((uint256,address,uint256,uint256,uint256,uint256,uint256,uint256,uint8,bytes32,bytes32,bytes32))',
  'function getCopierPolicies(address copier) external view returns (uint256[])',
  'function calculatePremium(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold) external view returns (uint256 premium)',
])

export const insurancePoolAbi = parseAbi([
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shareAmount) external',
  'function poolStats() external view returns (uint256 totalDeposits, uint256 premiumsCollected, uint256 claimsPaid, uint256 available, uint256 utilizationBps)',
  'function shares(address underwriter) external view returns (uint256)',
  'function shareValue(address underwriter) external view returns (uint256)',
])

export const demoUsdcAbi = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function claimDemoUsdc() external',
  'function hasClaimedFaucet(address account) external view returns (bool)',
])

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export function toUsdc(amount: number | string) {
  return parseUnits(String(amount || 0), 6)
}

export function fromUsdc(amount: bigint) {
  return Number(formatUnits(amount, 6))
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function shortHash(hash: string) {
  if (!hash || hash === '0x') return '0x'
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export async function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Browser wallet not found')
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' })
  await ensureGalileoNetwork()

  return createWalletClient({
    chain: insuraiChain,
    transport: custom(window.ethereum),
  })
}

export async function ensureGalileoNetwork() { // keeps existing callers working
  if (!window.ethereum) throw new Error('Browser wallet not found')

  const chainIdHex = `0x${insuraiChain.id.toString(16)}`
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code !== 4902) throw err

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: chainIdHex,
          chainName: insuraiChain.name,
          nativeCurrency: insuraiChain.nativeCurrency,
          rpcUrls: insuraiChain.rpcUrls.default.http,
        },
      ],
    })
  }
}

export async function approveIfNeeded(owner: Address, spender: Address, amount: bigint, walletClientOverride?: WalletClient) {
  const allowance = await publicClient.readContract({
    address: CONTRACTS.demoUsdc,
    abi: demoUsdcAbi,
    functionName: 'allowance',
    args: [owner, spender],
  })
  if (allowance >= amount) return null

  const walletClient = walletClientOverride ?? await getWalletClient()
  const [account] = await walletClient.getAddresses()
  const hash = await walletClient.writeContract({
    account,
    chain: insuraiChain,
    address: CONTRACTS.demoUsdc,
    abi: demoUsdcAbi,
    functionName: 'approve',
    args: [spender, amount],
  })
  await waitForReceipt(hash)
  return hash
}
