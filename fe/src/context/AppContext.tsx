'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { Address } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'
import { Strategy, STRATEGIES } from '@/lib/data'
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
} from '@/lib/chain'

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
  connectWallet: () => Promise<void>
  setRole: (role: 'copier' | 'provider' | 'underwriter') => void
  openWizard: (strategy: Strategy) => void
  closeWizard: () => void
  createPolicyOnChain: (input: CreatePolicyInput) => Promise<Policy>
  runStrategy: (strategy: Strategy) => Promise<Attestation>
  forceLossAttestation: (strategy: Strategy, tradeReturn?: number) => Promise<Attestation>
  claimDemoUsdc: () => Promise<string>
  depositToPool: (amount: number) => Promise<string>
  refreshChainData: () => Promise<void>
  advanceClaim: (policyId: string) => void
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

function strategyByContractId(id: number) {
  return STRATEGIES.find(s => s.contractId === id)
}

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
  const [strategies, setStrategies] = useState<Strategy[]>(STRATEGIES)
  const { address, isConnected } = useAccount()
  const { data: wagmiWalletClient } = useWalletClient()

  const readStrategies = useCallback(async () => {
    const loaded: Strategy[] = []
    for (const base of STRATEGIES) {
      const raw = await publicClient.readContract({
        address: CONTRACTS.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: 'getStrategy',
        args: [BigInt(base.contractId)],
      }) as ChainStrategy | ChainStrategyTuple
      const s = normalizeStrategy(raw)
      loaded.push({
        ...base,
        name: s.name,
        description: s.description,
        subscriptionFeeUsdc: fromUsdc(s.subscriptionFee),
        riskScore: Number(s.riskScore),
        risk: riskLabel(Number(s.riskScore)),
        followers: Number(s.totalCopiers),
        proof: s.teeAgentId,
        teeAgentId: s.teeAgentId,
        strategyStorageRoot: s.strategyStorageRoot,
        strategyConfigHash: s.strategyConfigHash,
        active: s.isActive,
        createdAt: new Date(Number(s.createdAt) * 1000).toISOString().slice(0, 10),
      })
    }
    setStrategies(loaded)
    return loaded
  }, [])

  async function connectWallet() {
    setLastError('')
    const walletClient = wagmiWalletClient ?? await getWalletClient()
    const [account] = await walletClient.getAddresses()
    setWalletConnected(true)
    setWalletAddress(shortAddress(account))
    setWalletAccount(account)
    await refreshChainData(account)
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

  const readAttestations = useCallback(async () => {
    const loaded: Attestation[] = []
    for (const strategy of STRATEGIES) {
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

  const readPolicies = useCallback(async (account: Address) => {
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
      const strategy = strategyByContractId(contractStrategyId)
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

  const refreshChainData = useCallback(async (accountOverride?: Address) => {
    try {
      await Promise.all([readPoolStats(), readAttestations(), readStrategies()])
      const account = accountOverride ?? walletAccount ?? undefined
      if (account) await readPolicies(account)
    } catch (err) {
      setLastError((err as Error).message)
    }
  }, [readAttestations, readPolicies, readPoolStats, readStrategies, walletAccount])

  async function createPolicyOnChain({ strategy, coverage, threshold }: CreatePolicyInput) {
    setLoading(true)
    setLastError('')
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
        await publicClient.waitForTransactionReceipt({ hash: subscribeHash })
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
      await publicClient.waitForTransactionReceipt({ hash: policyHash })

      const loadedPolicies = await readPolicies(account)
      await readPoolStats()

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
      return loadedPolicies[loadedPolicies.length - 1] ?? fallbackPolicy
    } catch (err) {
      const message = (err as Error).message
      setLastError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function runStrategy(strategy: Strategy) {
    setLoading(true)
    setLastError('')
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
      return attestation
    } catch (err) {
      const message = (err as Error).message
      setLastError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function forceLossAttestation(strategy: Strategy, tradeReturn = -3000) {
    setLoading(true)
    setLastError('')
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
      return attestation
    } catch (err) {
      const message = (err as Error).message
      setLastError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function claimDemoUsdc() {
    setLoading(true)
    setLastError('')
    try {
      const walletClient = wagmiWalletClient ?? await getWalletClient()
      const [account] = await walletClient.getAddresses()
      const claimed = await publicClient.readContract({
        address: CONTRACTS.demoUsdc,
        abi: demoUsdcAbi,
        functionName: 'hasClaimedFaucet',
        args: [account],
      })
      if (claimed) return 'already-claimed'

      const hash = await walletClient.writeContract({
        account,
        chain: insuraiChain,
        address: CONTRACTS.demoUsdc,
        abi: demoUsdcAbi,
        functionName: 'claimDemoUsdc',
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (err) {
      setLastError((err as Error).message)
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
      await publicClient.waitForTransactionReceipt({ hash })
      await readPoolStats()
      return hash
    } catch (err) {
      setLastError((err as Error).message)
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
    queueMicrotask(() => {
      if (isConnected && address) {
        setWalletConnected(true)
        setWalletAddress(shortAddress(address))
        setWalletAccount(address)
        refreshChainData(address)
        return
      }

      setWalletConnected(false)
      setWalletAddress('')
      setWalletAccount(null)
      setPolicies([])
    })
  }, [isConnected, address, refreshChainData])

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
