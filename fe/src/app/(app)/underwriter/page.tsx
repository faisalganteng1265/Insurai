'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'

export default function UnderwriterPage() {
  const { policies, poolStats, depositToPool, loading } = useApp()
  const [depositAmount, setDepositAmount] = useState('10000')
  const [deposited, setDeposited] = useState(false)

  const paidClaims = policies.filter(p => p.status === 'paid')
  const activePolicies = policies.filter(p => p.status === 'active')
  const exposure = activePolicies.reduce((s, p) => s + p.coverage, 0)
  const tvl = poolStats.totalDeposits || 1
  const utilization = poolStats.utilizationPct || Math.round((exposure / tvl) * 100)

  async function handleDeposit() {
    await depositToPool(Number(depositAmount))
    setDeposited(true)
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Underwriter Pool</p>
        <h1 className="mt-2 text-4xl font-black text-[#292932]">Premium yield reserve</h1>
        <p className="mt-2 text-sm font-medium text-[#74747f]">
          Deposit USDC to earn premium yield. You cover claims when strategies breach loss thresholds.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          ['Pool TVL', `$${tvl.toLocaleString()}`],
          ['Utilization', `${utilization.toFixed(2)}%`],
          ['Premiums', `$${poolStats.premiumsCollected.toLocaleString()}`],
          ['Claims Paid', `$${poolStats.claimsPaid.toLocaleString() || paidClaims.length}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(31,35,45,0.07)]">
            <p className="text-[10px] font-black uppercase text-[#9b9ba5]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[#24242b]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] bg-white p-7 shadow-[0_18px_55px_rgba(31,35,45,0.08)]">
          <p className="text-xs font-black uppercase tracking-widest text-[#d62f35] mb-1">Deposit USDC</p>
          <h2 className="text-2xl font-black text-[#292932] mb-6">Add liquidity to pool</h2>

          {deposited ? (
            <div className="rounded-2xl bg-[#dff8ee] border border-[#b7ecd6] p-6 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="text-base font-black text-[#11875d]">
                ${Number(depositAmount).toLocaleString()} USDC deposited
              </p>
              <p className="mt-1 text-sm font-bold text-[#2a6e4a]">Pool stats are refreshed from the deployed contract.</p>
              <button onClick={() => setDeposited(false)} className="mt-4 text-sm font-black text-[#308ca0]">
                Deposit more →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-[#9b9ba5] mb-1.5 block">Amount (USDC)</label>
                <div className="flex items-center gap-2 rounded-2xl border border-[#ebebf0] bg-[#f4f4f7] px-4 py-3">
                  <span className="text-lg font-black text-[#9b9ba5]">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="flex-1 text-xl font-black text-[#24242b] outline-none bg-transparent"
                  />
                  <span className="text-sm font-black text-[#9b9ba5]">USDC</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 50000].map(p => (
                  <button
                    key={p}
                    onClick={() => setDepositAmount(String(p))}
                    className={`rounded-2xl py-3 text-sm font-black transition-colors ${Number(depositAmount) === p ? 'bg-[#ffeaea] text-[#d62f35]' : 'bg-[#f4f4f7] text-[#62626d]'}`}
                  >
                    ${p.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[#ebebf0] p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-[#74747f]">Estimated APY</span>
                  <span className="font-black text-[#11875d]">{poolStats.totalDeposits > 0 ? 'Live' : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-[#74747f]">Monthly yield</span>
                  <span className="font-black text-[#24242b]">Premium share accrues in pool</span>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)] disabled:opacity-60"
              >
                {loading ? 'Depositing...' : 'Deposit to Pool'}
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-black text-[#33333c] mb-4">Active Exposure</h2>
          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(31,35,45,0.08)] mb-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#9b9ba5]">Pool utilization</span>
              <span className="text-sm font-black text-[#24242b]">{utilization.toFixed(2)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#f4f4f7] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#e94343]"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs font-bold text-[#9b9ba5]">
              <span>Exposure: ${exposure.toLocaleString()}</span>
              <span>TVL: ${tvl.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(31,35,45,0.08)]">
            <h3 className="text-sm font-black text-[#33333c] mb-3">Exposure by Strategy</h3>
            <div className="space-y-2">
              {activePolicies.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#74747f]">{p.strategyName}</span>
                  <span className="text-xs font-black text-[#24242b]">${p.coverage.toLocaleString()}</span>
                </div>
              ))}
              {activePolicies.length === 0 && (
                <p className="text-xs font-bold text-[#9b9ba5]">No active exposures.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
