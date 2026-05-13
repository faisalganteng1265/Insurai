'use client'

import Image from 'next/image'
import { useApp, Policy } from '@/context/AppContext'

const CLAIM_STEPS = ['Loss Triggered', 'Attestation Verified', 'Payout Executed']

const STEP_INDEX: Record<Policy['status'], number> = {
  active: -1, triggered: 0, verified: 1, paid: 2, expired: -1, cancelled: -1,
}

function StatusTracker({ status }: { status: Policy['status'] }) {
  const current = STEP_INDEX[status]
  return (
    <div className="flex items-start gap-0">
      {CLAIM_STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-start">
          <div className="flex flex-col items-center gap-2">
            <div className={`relative h-3 w-3 transition-all ${
              i < current  ? 'bg-[#b83227]' :
              i === current ? 'bg-[#b83227] ring-4 ring-[#b83227]/22 animate-pulse' :
              'bg-[#1e2330]'
            }`} />
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] whitespace-nowrap ${i <= current ? 'text-[#cfa45b]' : 'text-[#2d3748]'}`}>
              {label}
            </span>
          </div>
          {i < CLAIM_STEPS.length - 1 && (
            <div className={`mt-1.5 h-px flex-1 transition-colors ${i < current ? 'bg-[#b83227]' : 'bg-[#1e2330]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ClaimCard({ policy }: { policy: Policy }) {
  const { advanceClaim, attestations } = useApp()
  const relatedAtt = attestations.find(a => a.strategyId === policy.strategyId && a.tradeReturn < 0)
  const canAdvance  = policy.status === 'triggered' || policy.status === 'verified'

  return (
    <div className="relative overflow-hidden border border-[#b83227]/20">
      {/* Red ambient glow */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#b83227]"
        style={{ opacity: 0.06, filter: 'blur(48px)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative border-b border-white/[0.05] bg-[#0d0606] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#b83227]">Auto-Claim</p>
            <h3 className="mt-1 text-xl font-black text-[#f5efe5]">{policy.strategyName}</h3>
            <p className="mt-0.5 font-mono text-[10px] text-[#374151]">{policy.id}</p>
          </div>
          {policy.status === 'paid' && (
            <span className="border border-[#22c55e]/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#22c55e]">
              Paid ✓
            </span>
          )}
        </div>

        <StatusTracker status={policy.status} />

        {canAdvance && (
          <button
            onClick={() => advanceClaim(policy.id)}
            className="mt-5 border border-white/10 px-4 py-2 text-xs font-black text-[#a7adb8] transition-colors hover:border-[#cfa45b]/30 hover:text-[#cfa45b]"
          >
            Advance Status (Demo) →
          </button>
        )}
      </div>

      {/* Body */}
      <div className="bg-[#07080c] p-6">
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            ['Loss Amount', `${Math.abs(relatedAtt?.tradeReturn ?? 0) / 100}%`],
            ['Coverage', `$${policy.coverage.toLocaleString()}`],
            ['Threshold', `${policy.threshold}%`],
          ].map(([l, v]) => (
            <div key={l} className="bg-[#0d1018] p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#374151]">{l}</p>
              <p className="mt-0.5 text-sm font-black text-[#d8d0c4]">{v}</p>
            </div>
          ))}
        </div>

        {relatedAtt && (
          <div className="space-y-1.5">
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">Verifiable Proof</p>
            {[
              ['TEE Attestation ID', relatedAtt.teeId],
              ['Proof Hash',         relatedAtt.proofHash],
              ['Storage Root (0G)',  relatedAtt.storageRoot],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between border border-[#1e2330] px-3 py-2">
                <span className="text-xs font-bold text-[#374151]">{l}</span>
                <span className="font-mono text-[10px] font-black text-[#6b7280]">{v}</span>
              </div>
            ))}
            <button className="mt-1 text-[10px] font-black text-[#cfa45b]/60 hover:text-[#cfa45b] transition-colors">
              View on 0G Explorer ↗
            </button>
          </div>
        )}

        {policy.status === 'paid' && (
          <div className="mt-4 border border-[#22c55e]/20 bg-[#051209] p-4">
            <p className="text-sm font-black text-[#22c55e]">
              ${policy.coverage.toLocaleString()} USDC paid to wallet
            </p>
            <p className="mt-0.5 text-xs font-bold text-[#22c55e]/55">Transaction confirmed on-chain.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClaimsPage() {
  const { policies } = useApp()
  const activeClaims = policies.filter(p => ['triggered', 'verified', 'paid'].includes(p.status))

  return (
    <div>
      {/* Page header — most dramatic, ronin image */}
      <div className="relative mb-10 overflow-hidden border-b border-[#b83227]/15 pb-8">
        <Image
          src="/assets/ronin-lunging-forward.jpg"
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none object-cover opacity-[0.1] saturate-0"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/80 to-transparent" />
        {/* Red ambient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 50%, rgba(184,50,39,0.08), transparent)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-[#b83227]"
          style={{ fontSize: '9rem', opacity: 0.06, transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >戦</div>

        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#b83227]">
            <span className="h-px w-4 bg-[#b83227]/55" /> Claim Center
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#f5efe5] md:text-4xl">Auto-claim tracker.</h1>
          <p className="mt-2 text-sm font-medium text-[#4a5568]">
            No manual filing. Claims trigger from TEE attestation and execute on-chain.
          </p>
        </div>
      </div>

      {activeClaims.length === 0 ? (
        <div className="card-gb relative overflow-hidden p-14 text-center">
          <Image
            src="/assets/samurai-armor-illustration.jpg"
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none object-cover opacity-[0.04] saturate-0"
            aria-hidden="true"
          />
          <div className="relative">
            <div
              className="mx-auto mb-4 select-none text-[5rem] font-black leading-none text-[#b83227]"
              style={{ opacity: 0.18 }}
              aria-hidden="true"
            >盾</div>
            <p className="text-lg font-black text-[#f5efe5]">No active claims</p>
            <p className="mt-2 text-sm font-medium text-[#374151]">
              All policies are within loss thresholds. Pool is healthy.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {activeClaims.map(p => <ClaimCard key={p.id} policy={p} />)}
        </div>
      )}
    </div>
  )
}
