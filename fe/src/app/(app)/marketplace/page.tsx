'use client'

import { useApp } from '@/context/AppContext'
import { Strategy } from '@/lib/data'

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const { openWizard } = useApp()

  return (
    <article className="rounded-[28px] bg-[#11141b] p-6 shadow-[0_18px_55px_rgba(31,35,45,0.08)] flex flex-col">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className={`grid size-11 place-items-center rounded-full ${strategy.accent} text-base font-black text-white`}>
          ✦
        </div>
        <span className="rounded-full bg-[#eaf7fb] px-3 py-1.5 text-[10px] font-black text-[#308ca0]">
          TEE Verified
        </span>
      </div>

      <h3 className="text-xl font-black text-[#f5efe5]">{strategy.name}</h3>
      <p className="mt-1 text-xs font-black uppercase text-[#cfa45b]">{strategy.tag}</p>
      <p className="mt-3 text-sm font-medium leading-6 text-[#a7adb8] flex-1">{strategy.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          ['Sub fee', `$${strategy.subscriptionFeeUsdc.toLocaleString()} USDC`],
          ['Risk score', `${strategy.riskScore}/100`],
          ['Copiers', strategy.followers.toLocaleString()],
          ['Risk', strategy.risk],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-[#171b24] p-3">
            <p className="text-[10px] font-black uppercase text-[#7f8794]">{label}</p>
            <p className="mt-0.5 text-base font-black text-[#cfa45b]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black uppercase text-[#7f8794] mb-1.5">On-chain copiers</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#171b24] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#b83227]"
              style={{ width: `${Math.min(strategy.followers * 12, 100)}%` }}
            />
          </div>
          <span className="text-xs font-black text-[#f5efe5]">{strategy.followers.toLocaleString()}</span>
          <span className={`text-[10px] font-black ${strategy.active ? 'text-[#11875d]' : 'text-[#b83227]'}`}>
            {strategy.active ? 'active' : 'inactive'}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#2a2f3a] p-3">
        <p className="text-[10px] font-black uppercase text-[#7f8794]">TEE Agent ID</p>
        <p className="mt-0.5 break-all font-mono text-xs font-black text-[#f5efe5]">{strategy.teeAgentId}</p>
      </div>

      <button
        onClick={() => openWizard(strategy)}
        className="mt-5 w-full rounded-full bg-[#b83227] px-5 py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)]"
      >
        Subscribe + Buy Insurance
      </button>
    </article>
  )
}

export default function MarketplacePage() {
  const { strategies } = useApp()

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#cfa45b]">Strategy Marketplace</p>
        <h1 className="mt-2 text-4xl font-black text-[#f5efe5]">Protected AI strategies</h1>
        <p className="mt-2 text-sm font-medium text-[#a7adb8]">
          Every strategy runs inside a 0G Compute TEE. Logic is sealed — you verify results, not code.
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="rounded-[28px] bg-[#11141b] p-6 shadow-[0_18px_55px_rgba(31,35,45,0.08)] sticky top-24">
            <h2 className="text-sm font-black text-[#f5efe5] mb-5">Filters</h2>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase text-[#7f8794] mb-2">Risk Level</p>
                {['All Levels', 'Low', 'Medium', 'High'].map(item => (
                  <label key={item} className="flex items-center gap-2.5 mb-2 text-sm font-bold text-[#a7adb8] cursor-pointer">
                    <span className={`size-4 rounded-full border ${item === 'All Levels' ? 'bg-[#b83227] border-[#b83227]' : 'border-[#2a2f3a]'} grid place-items-center text-[8px] text-white`}>
                      {item === 'All Levels' && '✓'}
                    </span>
                    {item}
                  </label>
                ))}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-[#7f8794] mb-2">Verification</p>
                <label className="flex items-center gap-2.5 text-sm font-bold text-[#a7adb8]">
                  <span className="size-4 rounded-full bg-[#b83227] border-[#b83227] grid place-items-center text-[8px] text-white">✓</span>
                  TEE Verified Only
                </label>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {strategies.map(s => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
