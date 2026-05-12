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

export const careGuardChain = {
  id: 16602,
  name: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ZG_RPC_URL ?? 'https://evmrpc-testnet.0g.ai'] },
  },
} as const

export const CONTRACTS = {
  demoUsdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '0x5C789abC439d69E4b66160214254DC04EE3e5341') as Address,
  strategyRegistry: (process.env.NEXT_PUBLIC_STRATEGY_REGISTRY_ADDRESS ?? '0x6CE2C0e89BAFaafa50762d0728012cFbb96D0d00') as Address,
  insurancePool: (process.env.NEXT_PUBLIC_INSURANCE_POOL_ADDRESS ?? '0xB3C6f054DD1841dA7832a695704BdbB4A4c8D038') as Address,
  policyManager: (process.env.NEXT_PUBLIC_POLICY_MANAGER_ADDRESS ?? '0x73a3Bbd0e0961292F6BdF5d3017A70c06A0b2ef2') as Address,
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'

export const publicClient = createPublicClient({
  chain: careGuardChain,
  transport: http(careGuardChain.rpcUrls.default.http[0]),
})

export const strategyRegistryAbi = parseAbi([
  'function subscribe(uint256 strategyId) external',
  'function getStrategy(uint256 strategyId) external view returns ((uint256,address,string,string,uint256,uint256,bool,uint256,uint256,bytes32,bytes32,bytes32))',
  'function getAttestations(uint256 strategyId) external view returns ((bytes32,bytes32,bytes32,int256,uint256,uint256)[])',
  'function isActiveSubscriber(uint256 strategyId, address copier) external view returns (bool)',
])

export const policyManagerAbi = parseAbi([
  'function createPolicy(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold) external returns (uint256 policyId)',
  'function getPolicy(uint256 policyId) external view returns ((uint256,address,uint256,uint256,uint256,uint256,uint256,uint256,uint8,bytes32,bytes32,bytes32))',
  'function getCopierPolicies(address copier) external view returns (uint256[])',
  'function calculatePremium(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold) external view returns (uint256 premium)',
])

export const insurancePoolAbi = parseAbi([
  'function deposit(uint256 amount) external',
  'function poolStats() external view returns (uint256 totalDeposits, uint256 premiumsCollected, uint256 claimsPaid, uint256 available, uint256 utilizationBps)',
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
    chain: careGuardChain,
    transport: custom(window.ethereum),
  })
}

export async function ensureGalileoNetwork() {
  if (!window.ethereum) throw new Error('Browser wallet not found')

  const chainIdHex = `0x${careGuardChain.id.toString(16)}`
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
          chainName: careGuardChain.name,
          nativeCurrency: careGuardChain.nativeCurrency,
          rpcUrls: careGuardChain.rpcUrls.default.http,
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
    chain: careGuardChain,
    address: CONTRACTS.demoUsdc,
    abi: demoUsdcAbi,
    functionName: 'approve',
    args: [spender, amount],
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}
