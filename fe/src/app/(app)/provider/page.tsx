'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'
import { explorerTx } from '@/lib/chain'
import ConnectWalletPrompt from '@/components/ConnectWalletPrompt'

export default function ProviderPage() {
  const {
    runStrategy, forceLossAttestation, attestations, strategies, loading,
    providerStrategyIds, pendingFeesByStrategy, claimFees, walletConnected,
  } = useApp()

  if (!walletConnected) return <ConnectWalletPrompt message="Connect your wallet to access the provider dashboard and submit attestations." />

  const providerStrategies = strategies.filter(s => providerStrategyIds.includes(s.contractId))
  const totalPendingFees = Object.values(pendingFeesByStrategy).reduce((a, b) => a + b, 0)

  const [strategyId, setStrategyId]       = useState('')
  const [submitted, setSubmitted]         = useState(false)
  const [lastRunReturn, setLastRunReturn] = useState<number | null>(null)

  const selectedStrategy = strategies.find(s => s.id === strategyId) ?? strategies[0]

  async function handleSubmit() {
    if (!selectedStrategy) return
    const att = await runStrategy(selectedStrategy)
    setLastRunReturn(att.tradeReturn)
    setSubmitted(true)
  }

  async function handleForceLoss() {
    if (!selectedStrategy) return
    const att = await forceLossAttestation(selectedStrategy, -3000)
    setLastRunReturn(att.tradeReturn)
    setSubmitted(true)
  }

  const lossPct = lastRunReturn !== null && lastRunReturn < 0 ? Math.abs(lastRunReturn) / 100 : null

  return (
    <div>
      {/* Page header */}
      <div className="relative mb-10 overflow-hidden border-b border-white/[0.05] pb-8">
        <Image
          src="/assets/samurai-armor-illustration.jpg"
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none object-cover opacity-[0.065] saturate-0"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/80 to-transparent" />
        <div
          className="font-jp pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-white"
          style={{ fontSize: '9rem', opacity: 0.04, transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >封</div>
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" /> Strategy Provider
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#f5efe5] md:text-4xl">Provider dashboard.</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ['My Strategies', providerStrategies.length || strategies.length],
          ['Total Attestations', attestations.length],
          ['Pending Fees', `$${totalPendingFees.toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label} className="card-gb p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">{label}</p>
            <p className="mt-2 text-xl font-black text-[#f5efe5]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Submit panel */}
        <div className="card-gb relative overflow-hidden p-7">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#cfa45b]"
            style={{ opacity: 0.04, filter: 'blur(40px)' }}
            aria-hidden="true"
          />

          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" /> Submit TEE Attestation
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#f5efe5]">Record trade result on-chain</h2>

          {submitted ? (
            <div className="mt-6 border border-[#22c55e]/20 bg-[#051209] p-6 text-center">
              <p className="mb-1 text-2xl text-[#22c55e] opacity-60">✓</p>
              <p className="text-base font-black text-[#22c55e]">Attestation recorded on-chain</p>
              {lossPct && lossPct > 0 && (
                <p className="mt-2 text-sm font-bold text-[#22c55e]/60">
                  Loss of {lossPct}% detected — insurance claims auto-triggered.
                </p>
              )}
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm font-black text-[#cfa45b] hover:text-[#e8b96a] transition-colors"
              >
                Submit another →
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Strategy</label>
                <select
                  value={strategyId}
                  onChange={e => setStrategyId(e.target.value)}
                  className="w-full border border-[#1e2330] bg-[#0d1018] px-4 py-3 text-sm font-black text-[#d8d0c4] outline-none focus:border-[#cfa45b]/30"
                >
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="border border-[#1e2330] bg-[#0d1018] p-4">
                <p className="text-xs font-medium leading-5 text-[#4a5568]">
                  Calls the backend strategy runner — fetches market data, requests 0G Compute TEE inference, stores the execution payload, records attestation on-chain, then triggers eligible policy claims.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedStrategy}
                className="btn-shimmer w-full bg-[#b83227] py-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(184,50,39,0.28)] disabled:opacity-40"
              >
                {loading ? 'Running 0G strategy…' : 'Run Strategy + Record Attestation'}
              </button>

              <button
                onClick={handleForceLoss}
                disabled={loading || !selectedStrategy}
                className="w-full border border-[#b83227]/40 bg-[#0d0606] py-4 text-sm font-black text-[#b83227] transition-colors hover:border-[#b83227]/70 disabled:opacity-40"
              >
                Force −30% Loss Attestation
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Subscription fees */}
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
              <span className="h-px w-4 bg-[#cfa45b]/40" /> Subscription Fees
            </p>
            <div className="card-gb-dark divide-y divide-white/[0.04]">
              {providerStrategies.length > 0 ? providerStrategies.map(s => {
                const fees = pendingFeesByStrategy[s.contractId] ?? 0
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-black text-[#d8d0c4]">{s.name}</p>
                      <p className={`mt-0.5 text-xs font-black ${fees > 0 ? 'text-[#22c55e]' : 'text-[#374151]'}`}>
                        ${fees.toLocaleString()} pending
                      </p>
                    </div>
                    <button
                      onClick={() => claimFees(s.contractId)}
                      disabled={loading || fees === 0}
                      className="shrink-0 border border-[#cfa45b]/30 bg-[#15100a] px-3 py-1.5 text-[10px] font-black text-[#cfa45b] transition-colors hover:border-[#cfa45b]/60 disabled:opacity-30"
                    >
                      Claim
                    </button>
                  </div>
                )
              }) : (
                <p className="p-6 text-center text-sm font-bold text-[#374151]">
                  Connect wallet to see your strategies.
                </p>
              )}
            </div>
          </div>

          {/* Attestation history */}
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
              <span className="h-px w-4 bg-[#cfa45b]/40" /> Attestation History
            </p>
            <div className="card-gb-dark divide-y divide-white/[0.04]">
              {attestations.map(att => (
                <div key={att.id} className="p-4 transition-colors hover:bg-white/[0.02]">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-[#d8d0c4]">{att.strategyName}</p>
                    <span className={`text-sm font-black ${att.tradeReturn >= 0 ? 'text-[#22c55e]' : 'text-[#b83227]'}`}>
                      {att.tradeReturn >= 0 ? '+' : ''}{(att.tradeReturn / 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-[#2d3748]">{att.timestamp}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-[#1e2330]">{att.teeId}</p>
                  {att.txHash && (
                    <a href={explorerTx(att.txHash)} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-block text-[9px] font-black uppercase tracking-[0.1em] text-[#cfa45b]/60 hover:text-[#cfa45b]">
                      View on 0G Explorer →
                    </a>
                  )}
                </div>
              ))}
              {attestations.length === 0 && (
                <p className="p-8 text-center text-sm font-bold text-[#374151]">No attestations yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
