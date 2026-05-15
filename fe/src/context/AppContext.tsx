'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { Address } from 'viem'
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi'
import { keccak256, toHex, stringToBytes } from 'viem'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/friendlyError'
import { Strategy, STRATEGY_ACCENTS } from '@/lib/data'
import {
  API_BASE_URL,
  CONTRACTS,
  approveIfNeeded,
  demoUsdcAbi,
  fromUsdc,
  getWalletClient,
  insurancePoolAbi,
  policyManagerAbi,
  publicClient,
  shortAddress,
  shortHash,
  strategyRegistryAbi,
  toUsdc,
  insuraiChain,
  waitForReceipt,
} from '@/lib/chain'

export type CopyTradeScheduler = {
  strategyId: number
  strategyName: string
  intervalMs: number
  isRunning: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  runCount: number
  lastReturn: number | null
  lastAction: 'buy' | 'sell' | 'hold' | null
  lastError: string | null
}

export type CopyTradeFeedEntry = {
  strategyId: number
  strategyName: string
  action: 'buy' | 'sell' | 'hold'
  tradeReturn: number
  confidence: number
  reasoning: string
  teeAttestationId: string
  proofHash: string
  txHash: string | null
  timestamp: string
}

export type Policy = {
  id: string
  strategyId: string
  contractPolicyId?: string
  contractStrategyId?: number
  strategyName: string
  coverage: number
  threshold: number
  premiumPaid: number
  status: 'active' | 'triggered' | 'verified' | 'paid' | 'expired' | 'cancelled'
  proofHash: string
  createdAt: string
  expiresIn: string
  txHash?: string
}

export type Attestation = {
  id: string
  strategyId: string
  strategyName: string
  teeId: string
  storageRoot: string
  proofHash: string
  tradeReturn: number
  timestamp: string
  txHash?: string
}

export type PoolStats = {
  totalDeposits: number
  premiumsCollected: number
  claimsPaid: number
  available: number
  utilizationPct: number
}

type CreatePolicyInput = {
  strategy: Strategy
  coverage: number
  threshold: number
}

export type RegisterStrategyInput = {
  name: string
  description: string
  subscriptionFeeUsdc: number
  riskScore: number
}

type AppContextType = {
  walletConnected: boolean
  walletAddress: string
  activeRole: 'copier' | 'provider' | 'underwriter'
  policies: Policy[]
  attestations: Attestation[]
  strategies: Strategy[]
  poolStats: PoolStats
  wizardOpen: boolean
  selectedStrategy: Strategy | null
  loading: boolean
  lastError: string
  copyTradeSchedulers: CopyTradeScheduler[]
  copyTradeFeed: CopyTradeFeedEntry[]
  underwriterShares: number
  underwriterShareValue: number
  providerStrategyIds: number[]
  pendingFeesByStrategy: Record<number, number>
  demoUsdcBalance: number
  connectWallet: () => Promise<void>
  setRole: (role: 'copier' | 'provider' | 'underwriter') => void
  openWizard: (strategy: Strategy) => void
  closeWizard: () => void
  createPolicyOnChain: (input: CreatePolicyInput) => Promise<Policy>
  runStrategy: (strategy: Strategy) => Promise<Attestation>
  forceLossAttestation: (strategy: Strategy, tradeReturn?: number) => Promise<Attestation>
  claimDemoUsdc: () => Promise<string>
  depositToPool: (amount: number) => Promise<string>
  withdrawFromPool: () => Promise<string>
  claimFees: (strategyId: number) => Promise<string>
  refreshChainData: () => Promise<void>
  advanceClaim: (policyId: string) => void
  startCopyTrade: (strategy: Strategy, intervalMs?: number) => Promise<void>
  stopCopyTrade: (strategyId: number) => Promise<void>
  runCopyTradeNow: (strategy: Strategy) => Promise<CopyTradeFeedEntry | null>
  refreshCopyTrade: () => Promise<void>
  registerStrategy: (input: RegisterStrategyInput) => Promise<number>
}

const AppContext = createContext<AppContextType | null>(null)

type ChainAttestation = {
  proofHash: `0x${string}`
  teeAttestationId: `0x${string}`
  storageRoot: `0x${string}`
  tradeReturn: bigint
  executionTimestamp: bigint
  recordedAt: bigint
}

type ChainAttestationTuple = readonly [`0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint]

type ChainPolicy = {
  id: bigint
  copier: Address
  strategyId: bigint
  coverageAmount: bigint
  premium: bigint
  lossThreshold: bigint
  startTime: bigint
  endTime: bigint
  status: number
  claimProofHash: `0x${string}`
  claimTeeAttestationId: `0x${string}`
  claimStorageRoot: `0x${string}`
}

type ChainPolicyTuple = readonly [
  bigint,
  Address,
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
]

type ChainStrategy = {
  id: bigint
  provider: Address
  name: string
  description: string
  subscriptionFee: bigint
  riskScore: bigint
  isActive: boolean
  totalCopiers: bigint
  createdAt: bigint
  teeAgentId: `0x${string}`
  strategyStorageRoot: `0x${string}`
  strategyConfigHash: `0x${string}`
}

type ChainStrategyTuple = readonly [
  bigint,
  Address,
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
]

function normalizeAttestation(value: ChainAttestation | ChainAttestationTuple): ChainAttestation {
  if (Array.isArray(value)) {
    return {
      proofHash: value[0],
      teeAttestationId: value[1],
      storageRoot: value[2],
      tradeReturn: value[3],
      executionTimestamp: value[4],
      recordedAt: value[5],
    }
  }
  return value as ChainAttestation
}

function normalizePolicy(value: ChainPolicy | ChainPolicyTuple): ChainPolicy {
  if (Array.isArray(value)) {
    return {
      id: value[0],
      copier: value[1],
      strategyId: value[2],
      coverageAmount: value[3],
      premium: value[4],
      lossThreshold: value[5],
      startTime: value[6],
      endTime: value[7],
      status: value[8],
      claimProofHash: value[9],
      claimTeeAttestationId: value[10],
      claimStorageRoot: value[11],
    }
  }
  return value as ChainPolicy
}

function normalizeStrategy(value: ChainStrategy | ChainStrategyTuple): ChainStrategy {
  if (Array.isArray(value)) {
    return {
      id: value[0],
      provider: value[1],
      name: value[2],
      description: value[3],
      subscriptionFee: value[4],
      riskScore: value[5],
      isActive: value[6],
      totalCopiers: value[7],
      createdAt: value[8],
      teeAgentId: value[9],
      strategyStorageRoot: value[10],
      strategyConfigHash: value[11],
    }
  }
  return value as ChainStrategy
}

const INITIAL_POLICIES: Policy[] = []
const INITIAL_ATTESTATIONS: Attestation[] = []

function formatExpiry(endTime: bigint) {
  const seconds = Number(endTime) - Math.floor(Date.now() / 1000)
  if (seconds <= 0) return 'expired'
  const days = Math.ceil(seconds / 86400)
  return `${days} day${days === 1 ? '' : 's'}`
}

function policyStatus(status: number): Policy['status'] {
  if (status === 0) return 'active'
  if (status === 1) return 'paid'
  if (status === 2) return 'expired'
  if (status === 3) return 'cancelled'
  return 'active'
}

function riskLabel(score: number): Strategy['risk'] {
  if (score <= 33) return 'Low'
  if (score <= 66) return 'Medium'
  return 'High'
}

function tagFromRisk(score: number): string {
  if (score <= 33) return 'Low-risk AI trading agent'
  if (score <= 66) return 'Balanced AI trading agent'
  return 'High-yield AI trading agent'
}

function chainStrategyToFrontend(s: ChainStrategy): Strategy {
  const contractId = Number(s.id)
  const riskScore = Number(s.riskScore)
  return {
    id: `strategy-${contractId}`,
    contractId,
    name: s.name,
    tag: tagFromRisk(riskScore),
    description: s.description,
    subscriptionFeeUsdc: fromUsdc(s.subscriptionFee),
    riskScore,
    risk: riskLabel(riskScore),
    followers: Number(s.totalCopiers),
    proof: s.teeAgentId,
    teeAgentId: s.teeAgentId,
    strategyStorageRoot: s.strategyStorageRoot,
    strategyConfigHash: s.strategyConfigHash,
    accent: STRATEGY_ACCENTS[(contractId - 1) % STRATEGY_ACCENTS.length],
    active: s.isActive,
    createdAt: new Date(Number(s.createdAt) * 1000).toISOString().slice(0, 10),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletAccount, setWalletAccount] = useState<Address | null>(null)
  const [activeRole, setActiveRole] = useState<'copier' | 'provider' | 'underwriter'>('copier')
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES)
  const [attestations, setAttestations] = useState<Attestation[]>(INITIAL_ATTESTATIONS)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState('')
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalDeposits: 0,
    premiumsCollected: 0,
    claimsPaid: 0,
    available: 0,
    utilizationPct: 0,
  })
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [copyTradeSchedulers, setCopyTradeSchedulers] = useState<CopyTradeScheduler[]>([])
  const [copyTradeFeed, setCopyTradeFeed] = useState<CopyTradeFeedEntry[]>([])
  const [underwriterShares, setUnderwriterShares] = useState(0)
  const [underwriterShareValue, setUnderwriterShareValue] = useState(0)
  const [providerStrategyIds, setProviderStrategyIds] = useState<number[]>([])
  const [pendingFeesByStrategy, setPendingFeesByStrategy] = useState<Record<number, number>>({})
  const [demoUsdcBalance, setDemoUsdcBalance] = useState(0)
  const { address, isConnected } = useAccount()
  const { data: wagmiWalletClient } = useWalletClient()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const readStrategies = useCallback(async (): Promise<Strategy[]> => {
    const count = await publicClient.readContract({
      address: CONTRACTS.strategyRegistry,
      abi: strategyRegistryAbi,
      functionName: 'strategyCount',
    }) as bigint

    const loaded: Strategy[] = []
    for (let i = 1; i <= Number(count); i++) {
      try {
        const raw = await publicClient.readContract({
          address: CONTRACTS.strategyRegistry,
          abi: strategyRegistryAbi,
          functionName: 'getStrategy',
          args: [BigInt(i)],
        }) as ChainStrategy | ChainStrategyTuple
        const s = normalizeStrategy(raw)
        if (s.isActive) loaded.push(chainStrategyToFrontend(s))
      } catch {
        // skip invalid/missing strategy slots
      }
    }
    setStrategies(loaded)
    return loaded
  }, [])

  async function connectWallet() {
    setLastError('')
    const id = toast.loading('Connecting wallet…')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      setWalletConnected(true)
      setWalletAddress(shortAddress(account))
      setWalletAccount(account)
      await refreshChainData(account)
      toast.success('Wallet connected', { id })
    } catch (err) {
      toast.error('Connection failed', { id })
      throw err
    }
  }

  function setRole(role: 'copier' | 'provider' | 'underwriter') {
    setActiveRole(role)
  }

  function openWizard(strategy: Strategy) {
    setSelectedStrategy(strategy)
    setWizardOpen(true)
  }

  function closeWizard() {
    setWizardOpen(false)
    setSelectedStrategy(null)
  }

  const readPoolStats = useCallback(async () => {
    const [totalDeposits, premiumsCollected, claimsPaid, available, utilizationBps] =
      await publicClient.readContract({
        address: CONTRACTS.insurancePool,
        abi: insurancePoolAbi,
        functionName: 'poolStats',
      })

    setPoolStats({
      totalDeposits: fromUsdc(totalDeposits),
      premiumsCollected: fromUsdc(premiumsCollected),
      claimsPaid: fromUsdc(claimsPaid),
      available: fromUsdc(available),
      utilizationPct: Number(utilizationBps) / 100,
    })
  }, [])

  const readAttestations = useCallback(async (strategiesList: Strategy[]) => {
    const loaded: Attestation[] = []
    for (const strategy of strategiesList) {
      const items = await publicClient.readContract({
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'getAttestations',
        args: [BigInt(strategy.contractId)],
      }) as Array<ChainAttestation | ChainAttestationTuple>
      for (const item of items) {
        const att = normalizeAttestation(item)
        loaded.push({
          id: `${strategy.id}-${att.proofHash}`,
          strategyId: strategy.id,
          strategyName: strategy.name,
          teeId: shortHash(att.teeAttestationId),
          storageRoot: shortHash(att.storageRoot),
          proofHash: shortHash(att.proofHash),
          tradeReturn: Number(att.tradeReturn),
          timestamp: new Date(Number(att.executionTimestamp) * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
        })
      }
    }
    setAttestations(loaded.reverse())
  }, [])

  const readPolicies = useCallback(async (account: Address, strategiesList: Strategy[] = []) => {
    const ids = await publicClient.readContract({
      address: CONTRACTS.policyManager,
      abi: policyManagerAbi,
      functionName: 'getCopierPolicies',
      args: [account],
    }) as bigint[]

    const loaded: Policy[] = []
    for (const id of ids) {
      const rawPolicy = await publicClient.readContract({
        address: CONTRACTS.policyManager,
        abi: policyManagerAbi,
        functionName: 'getPolicy',
        args: [id],
      }) as ChainPolicy | ChainPolicyTuple
      const p = normalizePolicy(rawPolicy)
      const contractStrategyId = Number(p.strategyId)
      const strategy = strategiesList.find(s => s.contractId === contractStrategyId)
      loaded.push({
        id: `POL-0G-${p.id.toString().padStart(5, '0')}`,
        contractPolicyId: p.id.toString(),
        contractStrategyId,
        strategyId: strategy?.id ?? String(contractStrategyId),
        strategyName: strategy?.name ?? `Strategy #${contractStrategyId}`,
        coverage: fromUsdc(p.coverageAmount),
        threshold: Number(p.lossThreshold) / 100,
        premiumPaid: fromUsdc(p.premium),
        status: policyStatus(p.status),
        proofHash: shortHash(p.claimProofHash),
        createdAt: new Date(Number(p.startTime) * 1000).toISOString().slice(0, 10),
        expiresIn: formatExpiry(p.endTime),
      })
    }
    setPolicies(loaded)
    return loaded
  }, [])

  const readDemoUsdcBalance = useCallback(async (account: Address) => {
    try {
      const raw = await publicClient.readContract({
        address: CONTRACTS.demoUsdc,
        abi: demoUsdcAbi,
        functionName: 'balanceOf',
        args: [account],
      })
      setDemoUsdcBalance(fromUsdc(raw as bigint))
    } catch { /* silent — don't flash 0 on error */ }
  }, [])

  const readUnderwriterPosition = useCallback(async (account: Address) => {
    const [sharesRaw, valueRaw] = await Promise.all([
      publicClient.readContract({ address: CONTRACTS.insurancePool, abi: insurancePoolAbi, functionName: 'shares', args: [account] }),
      publicClient.readContract({ address: CONTRACTS.insurancePool, abi: insurancePoolAbi, functionName: 'shareValue', args: [account] }),
    ])
    setUnderwriterShares(fromUsdc(sharesRaw as bigint))
    setUnderwriterShareValue(fromUsdc(valueRaw as bigint))
  }, [])

  const readProviderData = useCallback(async (account: Address, strategiesList: Strategy[]) => {
    const ids = await publicClient.readContract({
      address: CONTRACTS.strategyRegistry,
      abi: strategyRegistryAbi,
      functionName: 'getProviderStrategies',
      args: [account],
    }) as bigint[]
    const numIds = ids.map(Number)
    setProviderStrategyIds(numIds)
    const fees: Record<number, number> = {}
    for (const id of numIds) {
      const strategy = strategiesList.find(s => s.contractId === id)
      if (!strategy) continue
      const raw = await publicClient.readContract({
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'pendingFees',
        args: [BigInt(id)],
      })
      fees[id] = fromUsdc(raw as bigint)
    }
    setPendingFeesByStrategy(fees)
  }, [])

  const refreshChainData = useCallback(async (accountOverride?: Address) => {
    try {
      const [loadedStrategies] = await Promise.all([readStrategies(), readPoolStats()])
      await readAttestations(loadedStrategies)
      const account = accountOverride ?? walletAccount ?? undefined
      if (account) {
        await readPolicies(account, loadedStrategies)
        readProviderData(account, loadedStrategies).catch(() => {})
        readUnderwriterPosition(account).catch(() => {})
        readDemoUsdcBalance(account).catch(() => {})
      }
    } catch (err) {
      setLastError((err as Error).message)
    }
  }, [readAttestations, readPolicies, readPoolStats, readStrategies, readProviderData, readUnderwriterPosition, readDemoUsdcBalance, walletAccount])

  async function createPolicyOnChain({ strategy, coverage, threshold }: CreatePolicyInput) {
    setLoading(true)
    setLastError('')
    const id = toast.loading('Creating policy on-chain…')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      setWalletConnected(true)
      setWalletAddress(shortAddress(account))
      setWalletAccount(account)

      const coverageAmount = toUsdc(coverage)
      const thresholdBps = BigInt(Math.round(threshold * 100))

      const rawStrategy = await publicClient.readContract({
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'getStrategy',
        args: [BigInt(strategy.contractId)],
      }) as ChainStrategy | ChainStrategyTuple
      const onChainStrategy = normalizeStrategy(rawStrategy)

      if (onChainStrategy.provider.toLowerCase() === account.toLowerCase()) {
        throw new Error('Strategy provider cannot subscribe to its own strategy. Connect a different wallet as copier, then claim dUSDC from the faucet.')
      }

      if (onChainStrategy.subscriptionFee > BigInt(0)) {
        await approveIfNeeded(account, CONTRACTS.strategyRegistry, onChainStrategy.subscriptionFee, walletClient)
      }

      const isSubscribed = await publicClient.readContract({
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'isActiveSubscriber',
        args: [BigInt(strategy.contractId), account],
      })

      if (!isSubscribed) {
        const subscribeHash = await walletClient.writeContract({
          account,
          chain: insuraiChain,
          address: CONTRACTS.strategyRegistry,
          abi: strategyRegistryAbi,
          functionName: 'subscribe',
          args: [BigInt(strategy.contractId)],
        })
        await waitForReceipt(subscribeHash)
      }

      const premium = await publicClient.readContract({
        address: CONTRACTS.policyManager,
        abi: policyManagerAbi,
        functionName: 'calculatePremium',
        args: [BigInt(strategy.contractId), coverageAmount, thresholdBps],
      }) as bigint

      await approveIfNeeded(account, CONTRACTS.policyManager, premium, walletClient)

      const policyHash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.policyManager,
        abi: policyManagerAbi,
        functionName: 'createPolicy',
        args: [BigInt(strategy.contractId), coverageAmount, thresholdBps],
      })
      await waitForReceipt(policyHash)

      const fallbackPolicy: Policy = {
        id: `POL-0G-${Date.now().toString().slice(-5)}`,
        strategyId: strategy.id,
        contractStrategyId: strategy.contractId,
        strategyName: strategy.name,
        coverage,
        threshold,
        premiumPaid: fromUsdc(premium),
        status: 'active',
        proofHash: shortHash(policyHash),
        createdAt: new Date().toISOString().slice(0, 10),
        expiresIn: '30 days',
        txHash: policyHash,
      }

      // non-blocking: refresh data + auto-start scheduler
      readPolicies(account, strategies).catch(() => {})
      readPoolStats().catch(() => {})
      fetch(`${API_BASE_URL}/api/copy-trade/status`)
        .then(r => r.json() as Promise<{ schedulers: CopyTradeScheduler[] }>)
        .then(data => {
          const alreadyRunning = data.schedulers.some(
            s => s.strategyId === strategy.contractId && s.isRunning
          )
          if (!alreadyRunning) {
            return fetch(`${API_BASE_URL}/api/copy-trade/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ strategyId: strategy.contractId, strategyName: strategy.name }),
            })
          }
        })
        .then(() => refreshCopyTrade())
        .catch(() => {})

      toast.success(`Policy created — $${coverage.toLocaleString()} covered`, { id })
      return fallbackPolicy
    } catch (err) {
      const message = (err as Error).message
      setLastError(message)
      toast.error(friendlyError(message), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function runStrategy(strategy: Strategy) {
    setLoading(true)
    setLastError('')
    const id = toast.loading(`Running ${strategy.name} via 0G Compute…`)
    try {
      const res = await fetch(`${API_BASE_URL}/api/run-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId: strategy.contractId, strategyName: strategy.name }),
      })
      const body = await res.json()
      if (!res.ok && res.status !== 207) throw new Error(body.detail ?? body.error ?? 'Strategy run failed')

      const attestation: Attestation = {
        id: `${strategy.id}-${body.proofHash}`,
        strategyId: strategy.id,
        strategyName: strategy.name,
        teeId: shortHash(body.teeAttestationId),
        storageRoot: shortHash(body.storageRoot),
        proofHash: shortHash(body.proofHash),
        tradeReturn: Number(body.tradeReturn),
        timestamp: body.executionTimestampIso ? body.executionTimestampIso.slice(0, 16).replace('T', ' ') + ' UTC' : new Date().toISOString(),
        txHash: body.txHash ?? undefined,
      }
      setAttestations(prev => [attestation, ...prev])
      await refreshChainData()
      const sign = attestation.tradeReturn >= 0 ? '+' : ''
      toast.success(`Attestation recorded — ${sign}${(attestation.tradeReturn / 100).toFixed(2)}%`, { id })
      return attestation
    } catch (err) {
      const message = (err as Error).message
      setLastError(message)
      toast.error(friendlyError(message), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function forceLossAttestation(strategy: Strategy, tradeReturn = -3000) {
    setLoading(true)
    setLastError('')
    const id = toast.loading('Submitting force loss attestation…')
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo/force-loss-attestation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId: strategy.contractId, tradeReturn }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail ?? body.error ?? 'Force loss attestation failed')

      const attestation: Attestation = {
        id: `${strategy.id}-${body.proofHash}`,
        strategyId: strategy.id,
        strategyName: strategy.name,
        teeId: shortHash(body.teeAttestationId),
        storageRoot: shortHash(body.storageRoot),
        proofHash: shortHash(body.proofHash),
        tradeReturn: Number(body.tradeReturn),
        timestamp: body.executionTimestampIso ? body.executionTimestampIso.slice(0, 16).replace('T', ' ') + ' UTC' : new Date().toISOString(),
        txHash: body.txHash ?? undefined,
      }
      setAttestations(prev => [attestation, ...prev])
      await refreshChainData()
      toast.success('Force loss recorded — claims auto-triggered', { id })
      return attestation
    } catch (err) {
      const message = (err as Error).message
      setLastError(message)
      toast.error(friendlyError(message), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function claimDemoUsdc() {
    setLoading(true)
    setLastError('')
    const id = toast.loading('Claiming dUSDC from faucet…')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      const claimed = await publicClient.readContract({
        address: CONTRACTS.demoUsdc,
        abi: demoUsdcAbi,
        functionName: 'hasClaimedFaucet',
        args: [account],
      })
      if (claimed) {
        toast.info('Already claimed from faucet', { id })
        return 'already-claimed'
      }

      const hash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.demoUsdc,
        abi: demoUsdcAbi,
        functionName: 'claimDemoUsdc',
      })
      await waitForReceipt(hash)
      toast.success('dUSDC claimed successfully', { id })
      readDemoUsdcBalance(account).catch(() => {})
      return hash
    } catch (err) {
      setLastError((err as Error).message)
      toast.error('Faucet claim failed', { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function depositToPool(amount: number) {
    setLoading(true)
    setLastError('')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      const usdcAmount = toUsdc(amount)
      await approveIfNeeded(account, CONTRACTS.insurancePool, usdcAmount, walletClient)
      const hash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.insurancePool,
        abi: insurancePoolAbi,
        functionName: 'deposit',
        args: [usdcAmount],
      })
      await waitForReceipt(hash)
      await Promise.all([readPoolStats(), readDemoUsdcBalance(account)])
      toast.success(`$${amount.toLocaleString()} USDC deposited to pool`)
      return hash
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshCopyTrade = useCallback(async () => {
    try {
      const [statusRes, feedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/copy-trade/status`),
        fetch(`${API_BASE_URL}/api/copy-trade/feed`),
      ])
      if (statusRes.ok) {
        const data = await statusRes.json() as { schedulers: CopyTradeScheduler[] }
        setCopyTradeSchedulers(data.schedulers ?? [])
      }
      if (feedRes.ok) {
        const data = await feedRes.json() as { feed: CopyTradeFeedEntry[] }
        setCopyTradeFeed(data.feed ?? [])
      }
      // silently refresh balance alongside copy trade poll
      if (walletAccount) readDemoUsdcBalance(walletAccount)
    } catch {
      // non-critical — backend may not be running
    }
  }, [walletAccount, readDemoUsdcBalance])

  async function withdrawFromPool(): Promise<string> {
    setLoading(true)
    setLastError('')
    const id = toast.loading('Withdrawing from pool…')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      const sharesRaw = await publicClient.readContract({
        address: CONTRACTS.insurancePool,
        abi: insurancePoolAbi,
        functionName: 'shares',
        args: [account],
      }) as bigint
      if (sharesRaw === BigInt(0)) throw new Error('No shares to withdraw')
      const hash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.insurancePool,
        abi: insurancePoolAbi,
        functionName: 'withdraw',
        args: [sharesRaw],
      })
      await waitForReceipt(hash)
      await Promise.all([readPoolStats(), readUnderwriterPosition(account)])
      toast.success('Withdrawn from pool successfully', { id })
      return hash
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function claimFees(strategyId: number): Promise<string> {
    setLoading(true)
    setLastError('')
    const id = toast.loading('Claiming subscription fees…')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'claimFees',
        args: [BigInt(strategyId)],
      })
      await waitForReceipt(hash)
      await readProviderData(account, strategies)
      toast.success('Fees claimed successfully', { id })
      return hash
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function startCopyTrade(strategy: Strategy, intervalMs?: number) {
    setLoading(true)
    setLastError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/copy-trade/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId: strategy.contractId, strategyName: strategy.name, intervalMs }),
      })
      const body = await res.json() as { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Failed to start copy trade')
      await refreshCopyTrade()
      toast.success(`Scheduler started — ${strategy.name}`)
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg))
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function stopCopyTrade(strategyId: number) {
    setLoading(true)
    setLastError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/copy-trade/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId }),
      })
      const body = await res.json() as { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Failed to stop copy trade')
      await refreshCopyTrade()
      toast.success('Scheduler stopped')
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg))
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function runCopyTradeNow(strategy: Strategy): Promise<CopyTradeFeedEntry | null> {
    setLoading(true)
    setLastError('')
    const id = toast.loading(`Running ${strategy.name}…`)
    try {
      const res = await fetch(`${API_BASE_URL}/api/copy-trade/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId: strategy.contractId, strategyName: strategy.name }),
      })
      const body = await res.json() as { entry?: CopyTradeFeedEntry; error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Run failed')
      await Promise.all([refreshCopyTrade(), refreshChainData()])
      const entry = body.entry
      if (entry) {
        const sign = entry.tradeReturn >= 0 ? '+' : ''
        toast.success(`Signal: ${entry.action.toUpperCase()} ${sign}${(entry.tradeReturn / 100).toFixed(2)}%`, { id })
      } else {
        toast.success('Run complete', { id })
      }
      return entry ?? null
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function registerStrategy(input: RegisterStrategyInput): Promise<number> {
    setLoading(true)
    setLastError('')
    const id = toast.loading('Registering strategy on-chain…')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      setWalletConnected(true)
      setWalletAddress(shortAddress(account))
      setWalletAccount(account)

      const configHash = keccak256(toHex(stringToBytes(`${input.name}:${input.description}`)))
      const teeAgentId = keccak256(toHex(stringToBytes(`tee-agent:${input.name}`)))
      const storageRoot = keccak256(toHex(stringToBytes(`storage-root:${input.name}`)))

      const hash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'registerStrategy',
        args: [
          input.name,
          input.description,
          toUsdc(input.subscriptionFeeUsdc),
          BigInt(input.riskScore),
          teeAgentId,
          storageRoot,
          configHash,
        ],
      })
      await waitForReceipt(hash)
      const loadedStrategies = await readStrategies()
      const registered = loadedStrategies.find(s => s.name === input.name)
      if (registered) {
        fetch(`${API_BASE_URL}/api/copy-trade/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategyId: registered.contractId, strategyName: registered.name }),
        }).then(() => refreshCopyTrade()).catch(() => {})
      }
      toast.success(`"${input.name}" is now live in the marketplace`, { id })
      return registered?.contractId ?? 0
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      toast.error(friendlyError(msg), { id })
      throw err
    } finally {
      setLoading(false)
    }
  }

  function advanceClaim(policyId: string) {
    const next: Record<string, Policy['status']> = {
      triggered: 'verified',
      verified: 'paid',
    }
    setPolicies(prev =>
      prev.map(p => (p.id === policyId && next[p.status] ? { ...p, status: next[p.status] } : p))
    )
  }

  useEffect(() => {
    refreshChainData()
  }, [refreshChainData])

  useEffect(() => {
    refreshCopyTrade()
    const id = setInterval(refreshCopyTrade, 30_000)
    return () => clearInterval(id)
  }, [refreshCopyTrade])

  useEffect(() => {
    const id = setInterval(() => {
      readPoolStats().catch(() => {})
    }, 60_000)
    return () => clearInterval(id)
  }, [readPoolStats])

  useEffect(() => {
    queueMicrotask(() => {
      if (isConnected && address) {
        setWalletConnected(true)
        setWalletAddress(shortAddress(address))
        setWalletAccount(address)
        refreshChainData(address)
        readUnderwriterPosition(address).catch(() => {})
        readDemoUsdcBalance(address).catch(() => {})
        return
      }

      setWalletConnected(false)
      setWalletAddress('')
      setWalletAccount(null)
      setPolicies([])
      setUnderwriterShares(0)
      setUnderwriterShareValue(0)
      setDemoUsdcBalance(0)
      setProviderStrategyIds([])
      setPendingFeesByStrategy({})
    })
  }, [isConnected, address, refreshChainData])

  useEffect(() => {
    if (isConnected && chainId !== insuraiChain.id) {
      switchChain({ chainId: insuraiChain.id })
    }
  }, [isConnected, chainId, switchChain])

  return (
    <AppContext.Provider
      value={{
        walletConnected,
        walletAddress,
        activeRole,
        policies,
        attestations,
        strategies,
        poolStats,
        wizardOpen,
        selectedStrategy,
        loading,
        lastError,
        connectWallet,
        setRole,
        openWizard,
        closeWizard,
        createPolicyOnChain,
        runStrategy,
        forceLossAttestation,
        claimDemoUsdc,
        depositToPool,
        refreshChainData,
        advanceClaim,
        copyTradeSchedulers,
        copyTradeFeed,
        startCopyTrade,
        stopCopyTrade,
        runCopyTradeNow,
        refreshCopyTrade,
        registerStrategy,
        underwriterShares,
        underwriterShareValue,
        providerStrategyIds,
        pendingFeesByStrategy,
        demoUsdcBalance,
        withdrawFromPool,
        claimFees,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
