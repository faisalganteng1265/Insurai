'use client'

import Link from 'next/link'
import { useApp, Policy } from '@/context/AppContext'

const STATUS_LABEL: Record<Policy['status'], string> = {
  active: 'Active',
  triggered: 'Claim Triggered',
  verified: 'Verified',
  paid: 'Paid Out',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<Policy['status'], string> = {
  active: 'bg-[#dff8ee] text-[#11875d]',
  triggered: 'bg-[#ffeaea] text-[#d62f35]',
  verified: 'bg-[#fff4d6] text-[#b07800]',
  paid: 'bg-[#eaf7fb] text-[#308ca0]',
  expired: 'bg-[#f1f1f4] text-[#777782]',
  cancelled: 'bg-[#f1f1f4] text-[#777782]',
}

function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(31,35,45,0.07)]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-black text-[#24242b]">{policy.strategyName}</p>
          <p className="text-xs font-mono text-[#9b9ba5] mt-0.5">{policy.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[10px] font-black shrink-0 ${STATUS_COLOR[policy.status]}`}>
          {STATUS_LABEL[policy.status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          ['Coverage', `$${policy.coverage.toLocaleString()}`],
          ['Threshold', `${policy.threshold}% loss`],
          ['Premium', `$${policy.premiumPaid}`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-[#f4f4f7] p-3">
            <p className="text-[10px] font-black uppercase text-[#9b9ba5]">{l}</p>
            <p className="mt-0.5 text-sm font-black text-[#24242b]">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#9b9ba5]">Expires in {policy.expiresIn}</span>
        <span className="font-mono font-bold text-[#9b9ba5]">{policy.proofHash}</span>
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const { policies, attestations } = useApp()

  const triggeredPolicies = policies.filter(p => p.status === 'triggered' || p.status === 'verified' || p.status === 'paid')
  const totalCoverage = policies.reduce((s, p) => s + p.coverage, 0)
  const totalPremium = policies.reduce((s, p) => s + p.premiumPaid, 0)

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">My Portfolio</p>
        <h1 className="mt-2 text-4xl font-black text-[#292932]">Copier dashboard</h1>
      </div>

      {triggeredPolicies.length > 0 && (
        <div className="mb-6 rounded-2xl bg-[#ffeaea] border border-[#ffc8c8] p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#d62f35]">Claim triggered on {triggeredPolicies[0].strategyName}</p>
            <p className="text-xs font-bold text-[#c0393f] mt-0.5">
              ${triggeredPolicies[0].coverage.toLocaleString()} USDC payout in progress
            </p>
          </div>
          <Link
            href="/claims"
            className="rounded-full bg-[#d71920] px-4 py-2.5 text-xs font-black text-white whitespace-nowrap"
          >
            View Claim →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          ['Active Policies', policies.length],
          ['Total Coverage', `$${totalCoverage.toLocaleString()}`],
          ['Premium Paid', `$${totalPremium}`],
          ['P&L', triggeredPolicies.length > 0 ? '-$300' : '+$920'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(31,35,45,0.07)]">
            <p className="text-[10px] font-black uppercase text-[#9b9ba5]">{label}</p>
            <p className={`mt-1 text-2xl font-black ${String(value).startsWith('-') ? 'text-[#d62f35]' : String(value).startsWith('+') ? 'text-[#11875d]' : 'text-[#24242b]'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-lg font-black text-[#33333c] mb-4">Active Policies</h2>
          <div className="space-y-3">
            {policies.map(p => <PolicyCard key={p.id} policy={p} />)}
            {policies.length === 0 && (
              <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(31,35,45,0.07)]">
                <p className="text-sm font-bold text-[#9b9ba5]">No policies yet.</p>
                <Link href="/marketplace" className="mt-3 inline-block text-sm font-black text-[#d62f35]">
                  Browse strategies →
                </Link>
              </div>
            )}
          </div>
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
                <p className="text-[10px] font-bold text-white/50 mb-2">{att.timestamp}</p>
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
