'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'

const ACTION_STYLE = {
  buy:  { label: 'BUY',  cls: 'border-[#22c55e]/40 bg-[#022010] text-[#22c55e]' },
  sell: { label: 'SELL', cls: 'border-[#b83227]/40 bg-[#1a0808] text-[#b83227]' },
  hold: { label: 'HOLD', cls: 'border-[#cfa45b]/30 bg-[#15100a] text-[#cfa45b]' },
} as const

function formatNextRun(nextRunAt: string | null): string {
  if (!nextRunAt) return '—'
  const diff = Math.floor((new Date(nextRunAt).getTime() - Date.now()) / 1000)
  if (diff <= 0) return 'soon'
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

export default function ProviderPage() {
  const {
    runStrategy, forceLossAttestation, attestations, strategies, loading,
    copyTradeSchedulers, startCopyTrade, stopCopyTrade, runCopyTradeNow,
  } = useApp()

  const [strategyId, setStrategyId]       = useState('pulse-momentum')
  const [submitted, setSubmitted]         = useState(false)
  const [lastRunReturn, setLastRunReturn] = useState<number | null>(null)
  const [schedulerIntervalMin, setSchedulerIntervalMin] = useState(60)

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

  async function handleToggleSchedule(strategy: (typeof strategies)[0]) {
    const sched = copyTradeSchedulers.find(s => s.strategyId === strategy.contractId)
    if (sched?.isRunning) {
      await stopCopyTrade(strategy.contractId)
    } else {
      await startCopyTrade(strategy, schedulerIntervalMin * 60 * 1000)
    }
  }

  async function handleRunNow(strategy: (typeof strategies)[0]) {
    await runCopyTradeNow(strategy)
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
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        {[
          ['Active Strategy', selectedStrategy?.name ?? '—'],
          ['Running Schedulers', copyTradeSchedulers.filter(s => s.isRunning).length],
          ['Total Attestations', attestations.length],
          ['Auto Signals', copyTradeSchedulers.reduce((n, s) => n + s.runCount, 0)],
        ].map(([label, value]) => (
          <div key={label} className="card-gb p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">{label}</p>
            <p className="mt-2 text-xl font-black text-[#f5efe5]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Submit panel */}
        <div className="space-y-6">
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

          {/* Copy Trade Scheduler */}
          <div className="card-gb p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
                  <span className="h-px w-4 bg-[#cfa45b]/55" /> Copy Trade Scheduler
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#4a5568]">
                  Auto-runs strategy every interval. Copiers get signals automatically.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Interval</label>
                <select
                  value={schedulerIntervalMin}
                  onChange={e => setSchedulerIntervalMin(Number(e.target.value))}
                  className="border border-[#1e2330] bg-[#0d1018] px-3 py-1.5 text-xs font-black text-[#d8d0c4] outline-none"
                >
                  <option value={1}>1 min</option>
                  <option value={5}>5 min</option>
                  <option value={15}>15 min</option>
                  <option value={60}>1 hour</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {strategies.map(strategy => {
                const sched = copyTradeSchedulers.find(s => s.strategyId === strategy.contractId)
                const isRunning = sched?.isRunning ?? false
                const action = sched?.lastAction ?? null

                return (
                  <div key={strategy.id} className="flex items-center gap-4 border border-[#1e2330] bg-[#0d1018] p-4">
                    {/* Status dot */}
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isRunning ? 'bg-[#22c55e]' : 'bg-[#374151]'}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#d8d0c4] truncate">{strategy.name}</p>
                      <p className="text-[10px] font-bold text-[#2d3748]">
                        {isRunning
                          ? `Next run in ${formatNextRun(sched?.nextRunAt ?? null)} · ${sched?.runCount ?? 0} runs`
                          : 'Scheduler off'}
                      </p>
                    </div>

                    {/* Last action badge */}
                    {action && (
                      <span className={`shrink-0 border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${ACTION_STYLE[action].cls}`}>
                        {ACTION_STYLE[action].label}
                        {sched?.lastReturn != null && ` ${sched.lastReturn >= 0 ? '+' : ''}${(sched.lastReturn / 100).toFixed(1)}%`}
                      </span>
                    )}

                    {/* Run now */}
                    <button
                      onClick={() => handleRunNow(strategy)}
                      disabled={loading}
                      title="Run now"
                      className="shrink-0 border border-[#1e2330] bg-[#07080c] px-2.5 py-1.5 text-[10px] font-black text-[#4a5568] transition-colors hover:border-[#cfa45b]/30 hover:text-[#cfa45b] disabled:opacity-40"
                    >
                      ▶
                    </button>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggleSchedule(strategy)}
                      disabled={loading}
                      className={`shrink-0 border px-3 py-1.5 text-[10px] font-black transition-colors disabled:opacity-40 ${
                        isRunning
                          ? 'border-[#b83227]/40 bg-[#1a0808] text-[#b83227] hover:border-[#b83227]/70'
                          : 'border-[#22c55e]/30 bg-[#022010] text-[#22c55e] hover:border-[#22c55e]/60'
                      }`}
                    >
                      {isRunning ? 'Stop' : 'Start'}
                    </button>
                  </div>
                )
              })}
            </div>
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
              </div>
            ))}
            {attestations.length === 0 && (
              <p className="p-8 text-center text-sm font-bold text-[#374151]">No attestations yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
