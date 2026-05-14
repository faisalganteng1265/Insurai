'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'

export default function UnderwriterPage() {
  const { policies, poolStats, depositToPool, withdrawFromPool, underwriterShares, underwriterShareValue, loading } = useApp()
  const [withdrawn, setWithdrawn] = useState(false)

  const yieldEarned = Math.max(0, underwriterShareValue - underwriterShares)
  const [depositAmount, setDepositAmount] = useState('10000')
  const [deposited, setDeposited]         = useState(false)

  const paidClaims     = policies.filter(p => p.status === 'paid')
  const activePolicies = policies.filter(p => p.status === 'active')
  const exposure    = activePolicies.reduce((s, p) => s + p.coverage, 0)
  const tvl         = poolStats.totalDeposits || 1
  const utilization = poolStats.utilizationPct || Math.round((exposure / tvl) * 100)

  async function handleDeposit() {
    await depositToPool(Number(depositAmount))
    setDeposited(true)
  }

  return (
    <div>
      {/* Page header */}
      <div className="relative mb-10 overflow-hidden border-b border-white/[0.05] pb-8">
        <Image
          src="/assets/samurai-armor-met.jpg"
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none object-cover object-[60%_30%] opacity-[0.07] saturate-0"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/80 to-transparent" />
        <div
          className="font-jp pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-white"
          style={{ fontSize: '9rem', opacity: 0.04, transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >盾</div>
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" /> Underwriter Pool
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#f5efe5] md:text-4xl">Premium yield reserve.</h1>
          <p className="mt-2 text-sm font-medium text-[#4a5568]">
            Deposit USDC to earn premium yield. You cover claims when strategies breach loss thresholds.
          </p>
        </div>
      </div>

      {/* Pool stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        {[
          ['Pool TVL',      `$${tvl.toLocaleString()}`],
          ['Utilization',   `${utilization.toFixed(2)}%`],
          ['Premiums',      `$${poolStats.premiumsCollected.toLocaleString()}`],
          ['Claims Paid',   `$${poolStats.claimsPaid.toLocaleString() || paidClaims.length}`],
        ].map(([label, value]) => (
          <div key={label} className="card-gb p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#f5efe5]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Deposit panel */}
        <div className="card-gb relative overflow-hidden p-7">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#cfa45b]"
            style={{ opacity: 0.04, filter: 'blur(40px)' }}
            aria-hidden="true"
          />

          <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" /> Deposit USDC
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#f5efe5]">Add liquidity to pool</h2>

          {deposited ? (
            <div className="mt-6 border border-[#22c55e]/20 bg-[#051209] p-6 text-center">
              <p className="mb-1 text-2xl text-[#22c55e] opacity-60">✓</p>
              <p className="text-base font-black text-[#22c55e]">
                ${Number(depositAmount).toLocaleString()} USDC deposited
              </p>
              <p className="mt-1 text-sm font-bold text-[#22c55e]/55">Pool stats refreshed from deployed contract.</p>
              <button onClick={() => setDeposited(false)} className="mt-4 text-sm font-black text-[#cfa45b] hover:text-[#e8b96a] transition-colors">
                Deposit more →
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Amount (USDC)</label>
                <div className="flex items-center gap-2 border border-[#1e2330] bg-[#0d1018] px-4 py-3 focus-within:border-[#cfa45b]/30">
                  <span className="text-lg font-black text-[#374151]">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="flex-1 bg-transparent text-xl font-black text-[#f5efe5] outline-none"
                  />
                  <span className="text-sm font-black text-[#374151]">USDC</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 50000].map(p => (
                  <button
                    key={p}
                    onClick={() => setDepositAmount(String(p))}
                    className={`py-2.5 text-sm font-black transition-colors ${
                      Number(depositAmount) === p
                        ? 'border border-[#cfa45b]/30 bg-[#251410] text-[#cfa45b]'
                        : 'border border-[#1e2330] bg-[#0d1018] text-[#4a5568] hover:text-[#7f8794]'
                    }`}
                  >
                    ${p.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="border border-[#1e2330] bg-[#0d1018] p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold text-[#4a5568]">Estimated APY</span>
                  <span className="font-black text-[#22c55e]">{poolStats.totalDeposits > 0 ? 'Live' : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-[#4a5568]">Monthly yield</span>
                  <span className="text-xs font-black text-[#6b7280]">Premium share accrues in pool</span>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading}
                className="btn-shimmer w-full bg-[#b83227] py-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(184,50,39,0.28)] disabled:opacity-40"
              >
                {loading ? 'Depositing…' : 'Deposit to Pool'}
              </button>
            </div>
          )}
        </div>

        {/* Right panels */}
        <div className="space-y-4">
          {/* Utilization bar */}
          <div className="card-gb p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Pool utilization</p>
              <span className="text-sm font-black text-[#f5efe5]">{utilization.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-[#0d1018]">
              <div
                className="h-full bg-gradient-to-r from-[#b83227] to-[#cfa45b] transition-all duration-500"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <div className="mt-2.5 flex justify-between text-[10px] font-bold text-[#2d3748]">
              <span>Exposure: ${exposure.toLocaleString()}</span>
              <span>TVL: ${tvl.toLocaleString()}</span>
            </div>
          </div>

          {/* My position */}
          <div className="card-gb p-5">
            <p className="mb-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">My Position</p>
            {underwriterShares > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0d1018] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Deposited</p>
                    <p className="mt-0.5 text-sm font-black text-[#d8d0c4]">${underwriterShares.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#0d1018] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Current Value</p>
                    <p className="mt-0.5 text-sm font-black text-[#d8d0c4]">${underwriterShareValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-[#0d1018] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Yield Earned</p>
                    <p className={`mt-0.5 text-sm font-black ${yieldEarned > 0 ? 'text-[#22c55e]' : 'text-[#374151]'}`}>
                      +${yieldEarned.toFixed(2)}
                    </p>
                  </div>
                </div>
                {withdrawn ? (
                  <p className="text-center text-sm font-black text-[#22c55e]">Withdrawn successfully</p>
                ) : (
                  <button
                    onClick={async () => { await withdrawFromPool(); setWithdrawn(true) }}
                    disabled={loading}
                    className="w-full border border-[#b83227]/40 bg-[#1a0808] py-2.5 text-sm font-black text-[#b83227] transition-colors hover:border-[#b83227]/70 disabled:opacity-40"
                  >
                    {loading ? 'Withdrawing…' : 'Withdraw All'}
                  </button>
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-xs font-bold text-[#374151]">No position yet.</p>
            )}
          </div>

          {/* Exposure by strategy */}
          <div className="card-gb p-5">
            <p className="mb-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Exposure by Strategy</p>
            <div className="space-y-2">
              {activePolicies.map(p => (
                <div key={p.id} className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-[#6b7280]">{p.strategyName}</span>
                  <span className="text-xs font-black text-[#d8d0c4]">${p.coverage.toLocaleString()}</span>
                </div>
              ))}
              {activePolicies.length === 0 && (
                <p className="py-4 text-center text-xs font-bold text-[#374151]">No active exposures.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
