'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useApp, Policy, CopyTradeFeedEntry } from '@/context/AppContext'

const STATUS_LABEL: Record<Policy['status'], string> = {
  active: 'Active',
  triggered: 'Claim Triggered',
  verified: 'Verified',
  paid: 'Paid Out',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<Policy['status'], string> = {
  active:    'border-[#22c55e]/30 text-[#22c55e]',
  triggered: 'border-[#cfa45b]/30 text-[#cfa45b]',
  verified:  'border-[#60a5fa]/30 text-[#60a5fa]',
  paid:      'border-[#22c55e]/30 text-[#22c55e]',
  expired:   'border-white/10 text-[#374151]',
  cancelled: 'border-white/10 text-[#374151]',
}

const ACTION_STYLE = {
  buy:  { label: 'BUY',  cls: 'border-[#22c55e]/40 bg-[#022010] text-[#22c55e]' },
  sell: { label: 'SELL', cls: 'border-[#b83227]/40 bg-[#1a0808] text-[#b83227]' },
  hold: { label: 'HOLD', cls: 'border-[#cfa45b]/30 bg-[#15100a] text-[#cfa45b]' },
} as const

function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <div className="card-gb group relative overflow-hidden p-5 transition-all duration-200">
      <div className={`absolute left-0 top-0 h-full w-[2px] ${
        policy.status === 'triggered' ? 'bg-[#cfa45b]' :
        policy.status === 'paid' ? 'bg-[#22c55e]' :
        policy.status === 'active' ? 'bg-[#b83227]/50' :
        'bg-white/10'
      }`} />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#e8ddd0]">{policy.strategyName}</p>
          <p className="mt-0.5 font-mono text-[10px] text-[#374151]">{policy.id}</p>
        </div>
        <span className={`shrink-0 border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${STATUS_STYLE[policy.status]}`}>
          {STATUS_LABEL[policy.status]}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {[
          ['Coverage', `$${policy.coverage.toLocaleString()}`],
          ['Threshold', `${policy.threshold}% loss`],
          ['Premium', `$${policy.premiumPaid}`],
        ].map(([l, v]) => (
          <div key={l} className="bg-[#0d1018] p-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#374151]">{l}</p>
            <p className="mt-0.5 text-sm font-black text-[#d8d0c4]">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="font-bold text-[#374151]">Expires in {policy.expiresIn}</span>
        <span className="font-mono font-bold text-[#2d3748]">{policy.proofHash}</span>
      </div>
    </div>
  )
}

function FeedCard({ entry, isFollowing }: { entry: CopyTradeFeedEntry; isFollowing: boolean }) {
  const a = ACTION_STYLE[entry.action]
  const returnSign = entry.tradeReturn >= 0 ? '+' : ''
  const returnPct = (entry.tradeReturn / 100).toFixed(2)

  return (
    <div className="p-4 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${a.cls}`}>
          {a.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-black text-[#d8d0c4] truncate">{entry.strategyName}</p>
            <span className={`shrink-0 text-sm font-black ${entry.tradeReturn >= 0 ? 'text-[#22c55e]' : 'text-[#b83227]'}`}>
              {returnSign}{returnPct}%
            </span>
          </div>
          <p className="mt-0.5 text-[10px] font-bold text-[#2d3748]">
            {entry.timestamp.slice(0, 16).replace('T', ' ')} UTC
          </p>
          <p className="mt-1 text-[10px] font-medium leading-4 text-[#374151] line-clamp-2">{entry.reasoning}</p>
        </div>
      </div>
      {isFollowing && (
        <div className="mt-2 ml-12">
          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#cfa45b]/70">Following</span>
        </div>
      )}
    </div>
  )
}

export default function PortfolioPage() {
  const { policies, attestations, copyTradeFeed } = useApp()
  const triggeredPolicies = policies.filter(p => ['triggered', 'verified', 'paid'].includes(p.status))
  const totalCoverage = policies.reduce((s, p) => s + p.coverage, 0)
  const totalPremium  = policies.reduce((s, p) => s + p.premiumPaid, 0)

  const followedStrategyIds = new Set(
    policies.filter(p => p.status === 'active').map(p => p.contractStrategyId)
  )

  const feedToShow = copyTradeFeed.length > 0 ? copyTradeFeed : []

  return (
    <div>
      {/* Page header */}
      <div className="relative mb-10 overflow-hidden border-b border-white/[0.05] pb-8">
        <Image
          src="/assets/samurai-armor-met.jpg"
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none object-cover object-[60%_30%] opacity-[0.055] saturate-0"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/80 to-transparent" />
        <div
          className="font-jp pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-white"
          style={{ fontSize: '9rem', opacity: 0.04, transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >守</div>
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" /> My Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#f5efe5] md:text-4xl">Copier dashboard.</h1>
        </div>
      </div>

      {/* Claim alert */}
      {triggeredPolicies.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4 border border-[#b83227]/30 bg-[#1a0808] p-4">
          <div className="flex items-center gap-3">
            <span className="live-badge h-2 w-2 rounded-full bg-[#b83227]" />
            <div>
              <p className="text-sm font-black text-[#cfa45b]">
                Claim triggered — {triggeredPolicies[0].strategyName}
              </p>
              <p className="text-xs font-bold text-[#b83227]">
                ${triggeredPolicies[0].coverage.toLocaleString()} USDC payout in progress
              </p>
            </div>
          </div>
          <Link href="/claims" className="btn-shimmer shrink-0 bg-[#b83227] px-4 py-2 text-xs font-black text-white">
            View Claim →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        {[
          ['Active Policies', policies.length, ''],
          ['Total Coverage', `$${totalCoverage.toLocaleString()}`, ''],
          ['Premium Paid', `$${totalPremium}`, ''],
          ['P&L', triggeredPolicies.length > 0 ? '−$300' : '+$920', triggeredPolicies.length > 0 ? 'text-[#cfa45b]' : 'text-[#22c55e]'],
        ].map(([label, value, extra]) => (
          <div key={label} className="card-gb p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">{label}</p>
            <p className={`mt-2 text-2xl font-black ${extra || 'text-[#f5efe5]'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Policies */}
        <div>
          <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/40" /> Active Policies
          </p>
          <div className="space-y-3">
            {policies.map(p => <PolicyCard key={p.id} policy={p} />)}
            {policies.length === 0 && (
              <div className="card-gb p-10 text-center">
                <p className="text-4xl mb-3 opacity-20">盾</p>
                <p className="text-sm font-bold text-[#374151]">No policies yet.</p>
                <Link href="/marketplace" className="mt-3 inline-block text-sm font-black text-[#cfa45b]">
                  Browse strategies →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Copy Trade Feed + Attestation History */}
        <div className="space-y-6">
          {/* Copy Trade Feed */}
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
              <span className="h-px w-4 bg-[#cfa45b]/40" /> Copy Trade Feed
            </p>
            <div className="card-gb-dark divide-y divide-white/[0.04]">
              {feedToShow.length > 0
                ? feedToShow.slice(0, 10).map((entry, i) => (
                    <FeedCard
                      key={`${entry.strategyId}-${entry.timestamp}-${i}`}
                      entry={entry}
                      isFollowing={followedStrategyIds.has(entry.strategyId)}
                    />
                  ))
                : (
                  <div className="p-8 text-center">
                    <p className="text-sm font-bold text-[#374151]">No signals yet.</p>
                    <p className="mt-1 text-[10px] font-medium text-[#2d3748]">
                      Signals appear when the provider runs a strategy.
                    </p>
                  </div>
                )
              }
            </div>
          </div>

          {/* Attestation History */}
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
              <span className="h-px w-4 bg-[#cfa45b]/40" /> On-Chain Attestations
            </p>
            <div className="card-gb-dark space-y-0 divide-y divide-white/[0.04]">
              {attestations.map(att => (
                <div key={att.id} className="p-4 transition-colors hover:bg-white/[0.02]">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-[#d8d0c4]">{att.strategyName}</p>
                    <span className={`text-sm font-black ${att.tradeReturn >= 0 ? 'text-[#22c55e]' : 'text-[#b83227]'}`}>
                      {att.tradeReturn >= 0 ? '+' : ''}{(att.tradeReturn / 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-[#2d3748]">{att.timestamp}</p>
                  <p className="mt-1 font-mono text-[9px] text-[#1e2330]">{att.teeId}</p>
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
