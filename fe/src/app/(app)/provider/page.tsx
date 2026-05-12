'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'

export default function ProviderPage() {
  const { runStrategy, forceLossAttestation, attestations, strategies, loading } = useApp()

  const [strategyId, setStrategyId] = useState('pulse-momentum')
  const [submitted, setSubmitted] = useState(false)
  const [lastRunReturn, setLastRunReturn] = useState<number | null>(null)

  const selectedStrategy = strategies.find(s => s.id === strategyId)

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
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Strategy Provider</p>
        <h1 className="mt-2 text-4xl font-black text-[#292932]">Provider dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          ['Active Strategy', selectedStrategy?.name ?? '—'],
          ['Total Copiers', '842'],
          ['Revenue / mo', '$1,204'],
          ['Attestations', attestations.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(31,35,45,0.07)]">
            <p className="text-[10px] font-black uppercase text-[#9b9ba5]">{label}</p>
            <p className="mt-1 text-xl font-black text-[#24242b]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] bg-white p-7 shadow-[0_18px_55px_rgba(31,35,45,0.08)]">
          <p className="text-xs font-black uppercase tracking-widest text-[#d62f35] mb-1">Submit TEE Attestation</p>
          <h2 className="text-2xl font-black text-[#292932] mb-6">Record trade result on-chain</h2>

          {submitted ? (
            <div className="rounded-2xl bg-[#dff8ee] border border-[#b7ecd6] p-6 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="text-base font-black text-[#11875d]">Attestation recorded on-chain</p>
              {lossPct && lossPct > 0 && (
                <p className="mt-2 text-sm font-bold text-[#2a6e4a]">
                  Loss of {lossPct}% detected — insurance claims auto-triggered.
                </p>
              )}
              <button
                onClick={() => { setSubmitted(false) }}
                className="mt-4 text-sm font-black text-[#308ca0]"
              >
                Submit another →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-[#9b9ba5] mb-1.5 block">Strategy</label>
                <select
                  value={strategyId}
                  onChange={e => setStrategyId(e.target.value)}
                  className="w-full rounded-2xl border border-[#ebebf0] bg-[#f4f4f7] px-4 py-3 text-sm font-black text-[#24242b] outline-none"
                >
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-[#ebebf0] bg-[#f4f4f7] p-4">
                <p className="text-xs font-bold leading-5 text-[#74747f]">
                  This calls the backend strategy runner. The backend fetches market data, requests 0G Compute TEE inference,
                  stores the execution payload, records the attestation on-chain, then triggers eligible policy claims.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedStrategy}
                className="w-full rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)] disabled:opacity-60"
              >
                {loading ? 'Running 0G strategy...' : 'Run Strategy + Record Attestation'}
              </button>

              <button
                onClick={handleForceLoss}
                disabled={loading || !selectedStrategy}
                className="w-full rounded-full border border-[#d71920] bg-white py-4 text-sm font-black text-[#d71920] disabled:opacity-60"
              >
                Force -30% Loss Attestation
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-[#33333c] mb-4">Attestation History</h2>
          <div className="rounded-[28px] bg-[#2b2c34] p-5 space-y-3">
            {attestations.map(att => (
              <div key={att.id} className="rounded-2xl bg-white/8 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-black text-white">{att.strategyName}</p>
                  <span className={`text-sm font-black ${att.tradeReturn >= 0 ? 'text-[#4ade80]' : 'text-[#ff7777]'}`}>
                    {att.tradeReturn >= 0 ? '+' : ''}{(att.tradeReturn / 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] font-bold text-white/50 mb-1">{att.timestamp}</p>
                <p className="font-mono text-[10px] text-white/40">{att.teeId}</p>
              </div>
            ))}
            {attestations.length === 0 && (
              <p className="text-sm font-bold text-white/40 text-center py-4">No attestations yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
