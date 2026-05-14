'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useApp, CopyTradeScheduler, RegisterStrategyInput } from '@/context/AppContext'
import { Strategy } from '@/lib/data'
import { toast } from 'sonner'


function StrategyCard({ strategy, scheduler }: { strategy: Strategy; scheduler: CopyTradeScheduler | undefined }) {
  const { openWizard, walletConnected } = useApp()

  const actionColor = scheduler?.lastAction === 'buy'
    ? 'text-[#22c55e]'
    : scheduler?.lastAction === 'sell'
      ? 'text-[#b83227]'
      : 'text-[#cfa45b]'

  const returnColor = (scheduler?.lastReturn ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#b83227]'

  return (
    <article className="card-gb group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#b83227]/60 via-[#cfa45b]/30 to-transparent" />

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className={`grid size-10 place-items-center rounded-full ${strategy.accent} text-sm font-black text-white shadow-[0_0_18px_rgba(184,50,39,0.35)]`}>
            ✦
          </div>
          <span className="border border-[#cfa45b]/22 bg-[#251410] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#cfa45b]">
            TEE Verified
          </span>
        </div>

        <h3 className="text-lg font-black text-[#f5efe5]">{strategy.name}</h3>
        <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#cfa45b]">{strategy.tag}</p>
        <p className="mt-3 flex-1 text-sm font-medium leading-6 text-[#6b7280]">{strategy.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {[
            ['Sub fee', `$${strategy.subscriptionFeeUsdc.toLocaleString()}`],
            ['Risk score', `${strategy.riskScore}/100`],
            ['Copiers', strategy.followers.toLocaleString()],
            ['Risk', strategy.risk],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#0d1018] p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">{label}</p>
              <p className="mt-0.5 text-sm font-black text-[#cfa45b]">{value}</p>
            </div>
          ))}
        </div>

        {/* Copier bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">On-chain copiers</p>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${strategy.active ? 'bg-[#22c55e]' : 'bg-[#b83227]'}`} />
              <span className={`text-[9px] font-black ${strategy.active ? 'text-[#22c55e]' : 'text-[#b83227]'}`}>
                {strategy.active ? 'active' : 'inactive'}
              </span>
            </div>
          </div>
          <div className="h-1 overflow-hidden bg-[#0d1018]">
            <div
              className="h-full bg-gradient-to-r from-[#b83227] to-[#cfa45b]"
              style={{ width: `${Math.min(strategy.followers * 12, 100)}%` }}
            />
          </div>
        </div>

        {/* Last Signal */}
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          <div className="bg-[#0d1018] p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Signal</p>
            <p className={`mt-0.5 text-sm font-black uppercase ${scheduler?.lastAction ? actionColor : 'text-[#374151]'}`}>
              {scheduler?.lastAction ?? '—'}
            </p>
          </div>
          <div className="bg-[#0d1018] p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Return</p>
            <p className={`mt-0.5 text-sm font-black ${scheduler?.lastReturn != null ? returnColor : 'text-[#374151]'}`}>
              {scheduler?.lastReturn != null ? `${scheduler.lastReturn > 0 ? '+' : ''}${scheduler.lastReturn}bps` : '—'}
            </p>
          </div>
        </div>

        {/* TEE Agent ID */}
        <div className="mt-4 border border-[#1e2330] bg-[#0d1018] p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">TEE Agent ID</p>
          <p className="mt-0.5 break-all font-mono text-[10px] font-black text-[#4a5568]">{strategy.teeAgentId}</p>
        </div>
      </div>

      <div className="mt-auto p-5 pt-0">
        <button
          onClick={() => walletConnected ? openWizard(strategy) : toast.info('Connect your wallet first to subscribe.')}
          className={`btn-shimmer w-full py-3.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(184,50,39,0.3)] ${walletConnected ? 'bg-[#b83227] hover:bg-[#c8382c]' : 'cursor-not-allowed bg-[#374151]'}`}
        >
          {walletConnected ? 'Subscribe + Buy Insurance' : 'Connect Wallet to Subscribe'}
        </button>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="card-gb animate-pulse overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-10 w-10 rounded-full bg-white/[0.04]" />
        <div className="h-6 w-24 bg-white/[0.04]" />
      </div>
      <div className="mb-1 h-5 w-3/4 bg-white/[0.04]" />
      <div className="mb-3 h-3 w-1/3 bg-white/[0.04]" />
      <div className="mb-1 h-3 w-full bg-white/[0.04]" />
      <div className="h-3 w-2/3 bg-white/[0.04]" />
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {[0,1,2,3].map(i => <div key={i} className="h-12 bg-white/[0.04]" />)}
      </div>
      <div className="mt-4 h-1 bg-white/[0.04]" />
      <div className="mt-4 h-16 bg-white/[0.04]" />
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        <div className="h-12 bg-white/[0.04]" />
        <div className="h-12 bg-white/[0.04]" />
      </div>
      <div className="mt-4 h-12 bg-white/[0.04]" />
      <div className="mt-4 h-12 bg-[#b83227]/20" />
    </div>
  )
}

export default function MarketplacePage() {
  const { strategies, copyTradeSchedulers, registerStrategy, loading } = useApp()
  const isLoadingStrategies = strategies.length === 0

  const [showForm, setShowForm] = useState(false)
  const [done, setDone]         = useState(false)
  const [form, setForm] = useState<RegisterStrategyInput>({
    name: '',
    description: '',
    subscriptionFeeUsdc: 10,
    riskScore: 25,
  })

  async function handleRegister() {
    if (!form.name || !form.description) return
    await registerStrategy(form)
    setDone(true)
    setForm({ name: '', description: '', subscriptionFeeUsdc: 10, riskScore: 25 })
  }

  return (
    <div>
      {/* Page header */}
      <div className="relative mb-10 overflow-hidden border-b border-white/[0.05] pb-8">
        <Image
          src="/assets/musashi-self-portrait.jpg"
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none object-cover opacity-[0.055] saturate-0"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/85 to-transparent" />

        {/* Kanji 剣 */}
        <div
          className="font-jp pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-white"
          style={{ fontSize: '9rem', opacity: 0.04, transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >剣</div>

        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" />
            Strategy Marketplace
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-[#f5efe5] md:text-4xl">
            Protected AI strategies.
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#4a5568]">
            Every strategy runs inside a 0G Compute TEE. Logic is sealed — you verify results, not code.
          </p>
        </div>
      </div>

      {/* Onboarding — how it works */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { step: '01', title: 'Pick a strategy', desc: 'Browse AI trading strategies sealed in 0G Compute TEE.' },
          { step: '02', title: 'Subscribe + insure', desc: 'Subscribe and set your coverage amount and loss threshold.' },
          { step: '03', title: 'Auto-protected', desc: 'Signals are copied automatically. Claim pays if loss exceeds threshold.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex gap-3 border border-white/[0.04] bg-[#0a0b0f] p-4">
            <span className="shrink-0 text-[10px] font-black text-[#b83227]/60">{step}</span>
            <div>
              <p className="text-xs font-black text-[#d8d0c4]">{title}</p>
              <p className="mt-0.5 text-[11px] font-medium leading-4 text-[#374151]">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List your strategy */}
      <div className="mb-8 card-gb p-6">
        <button
          onClick={() => { setShowForm(v => !v); setDone(false) }}
          className="flex w-full items-center justify-between"
        >
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
              <span className="h-px w-4 bg-[#cfa45b]/55" /> List Your Strategy
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#4a5568]">Register your own AI strategy and earn subscription fees.</p>
          </div>
          <span
            className="shrink-0 text-[#374151] transition-transform duration-300"
            style={{ display: 'inline-block', transform: showForm ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >▼</span>
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${showForm ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
          <div className="mt-6">
            {done ? (
              <div className="border border-[#22c55e]/20 bg-[#051209] p-5 text-center">
                <p className="text-base font-black text-[#22c55e]">Strategy registered on-chain</p>
                <p className="mt-1 text-xs font-medium text-[#22c55e]/60">It&apos;s now live below.</p>
                <button onClick={() => setDone(false)} className="mt-3 text-sm font-black text-[#cfa45b] hover:text-[#e8b96a]">
                  Register another →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="My Alpha Strategy"
                      className="w-full border border-[#1e2330] bg-[#0d1018] px-4 py-3 text-sm font-black text-[#d8d0c4] placeholder-[#2d3748] outline-none focus:border-[#cfa45b]/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Sub Fee (USDC)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.subscriptionFeeUsdc}
                        onChange={e => setForm(f => ({ ...f, subscriptionFeeUsdc: Number(e.target.value) }))}
                        className="w-full border border-[#1e2330] bg-[#0d1018] px-4 py-3 text-sm font-black text-[#d8d0c4] outline-none focus:border-[#cfa45b]/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Risk (1–100)</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={form.riskScore}
                        onChange={e => setForm(f => ({ ...f, riskScore: Math.min(100, Math.max(1, Number(e.target.value))) }))}
                        className="w-full border border-[#1e2330] bg-[#0d1018] px-4 py-3 text-sm font-black text-[#d8d0c4] outline-none focus:border-[#cfa45b]/30"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the strategy's logic and focus..."
                    className="w-full resize-none border border-[#1e2330] bg-[#0d1018] px-4 py-3 text-sm font-medium text-[#d8d0c4] placeholder-[#2d3748] outline-none focus:border-[#cfa45b]/30"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={loading || !form.name || !form.description}
                  className="btn-shimmer bg-[#b83227] px-8 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(184,50,39,0.28)] disabled:opacity-40"
                >
                  {loading ? 'Registering on-chain…' : 'Register Strategy'}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filter sidebar */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="card-gb sticky top-20 p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">Filters</p>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#374151]">Risk Level</p>
                {['All Levels', 'Low', 'Medium', 'High'].map(item => (
                  <label key={item} className="mb-2 flex cursor-pointer items-center gap-2.5 text-xs font-bold text-[#6b7280] hover:text-[#a7adb8]">
                    <span className={`grid size-3.5 place-items-center border text-[7px] text-white ${
                      item === 'All Levels' ? 'border-[#b83227] bg-[#b83227]' : 'border-[#2a2f3a]'
                    }`}>
                      {item === 'All Levels' && '✓'}
                    </span>
                    {item}
                  </label>
                ))}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#cfa45b]/15 to-transparent" />

              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#374151]">Verification</p>
                <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-[#6b7280]">
                  <span className="grid size-3.5 place-items-center border border-[#b83227] bg-[#b83227] text-[7px] text-white">✓</span>
                  TEE Verified Only
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Strategy grid */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoadingStrategies
            ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
            : strategies.map(s => (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  scheduler={copyTradeSchedulers.find(sc => sc.strategyId === s.contractId)}
                />
              ))
          }
        </div>
      </div>
    </div>
  )
}
