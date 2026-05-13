'use client'

import Image from 'next/image'
import { useApp } from '@/context/AppContext'
import { Strategy } from '@/lib/data'

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const { openWizard } = useApp()

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

        {/* TEE Agent ID */}
        <div className="mt-4 border border-[#1e2330] bg-[#0d1018] p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">TEE Agent ID</p>
          <p className="mt-0.5 break-all font-mono text-[10px] font-black text-[#4a5568]">{strategy.teeAgentId}</p>
        </div>
      </div>

      <div className="mt-auto p-5 pt-0">
        <button
          onClick={() => openWizard(strategy)}
          className="btn-shimmer w-full bg-[#b83227] py-3.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(184,50,39,0.3)] hover:bg-[#c8382c]"
        >
          Subscribe + Buy Insurance
        </button>
      </div>
    </article>
  )
}

export default function MarketplacePage() {
  const { strategies } = useApp()

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
          className="pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-white"
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
          {strategies.map(s => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
