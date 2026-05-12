'use client'

import { useApp, Policy } from '@/context/AppContext'

const CLAIM_STEPS = ['Loss Triggered', 'Attestation Verified', 'Payout Executed']

const STEP_INDEX: Record<Policy['status'], number> = {
  active: -1,
  triggered: 0,
  verified: 1,
  paid: 2,
  expired: -1,
  cancelled: -1,
}

function StatusTracker({ status }: { status: Policy['status'] }) {
  const current = STEP_INDEX[status]
  return (
    <div className="flex items-center gap-0">
      {CLAIM_STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`size-3 rounded-full transition-all ${
                i < current
                  ? 'bg-[#e94343]'
                  : i === current
                  ? 'bg-[#e94343] ring-4 ring-[#e94343]/20 animate-pulse'
                  : 'bg-white/20'
              }`}
            />
            <span className={`text-[9px] font-black whitespace-nowrap ${i <= current ? 'text-[#ffb8b8]' : 'text-white/30'}`}>
              {label}
            </span>
          </div>
          {i < CLAIM_STEPS.length - 1 && (
            <div className={`w-14 h-0.5 mb-5 mx-1 transition-colors ${i < current ? 'bg-[#e94343]' : 'bg-white/15'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ClaimCard({ policy }: { policy: Policy }) {
  const { advanceClaim, attestations } = useApp()
  const relatedAtt = attestations.find(a => a.strategyId === policy.strategyId && a.tradeReturn < 0)
  const canAdvance = policy.status === 'triggered' || policy.status === 'verified'

  return (
    <div className="rounded-[28px] overflow-hidden shadow-[0_18px_55px_rgba(31,35,45,0.16)]">
      <div className="bg-[#2b2c34] p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#ffb8b8]">Auto-Claim</p>
            <h3 className="mt-1 text-xl font-black text-white">{policy.strategyName}</h3>
            <p className="text-xs font-mono text-white/40 mt-0.5">{policy.id}</p>
          </div>
          {policy.status === 'paid' && (
            <span className="rounded-full bg-[#dff8ee] px-3 py-1.5 text-[10px] font-black text-[#11875d]">
              Paid ✓
            </span>
          )}
        </div>

        <StatusTracker status={policy.status} />

        {canAdvance && (
          <button
            onClick={() => advanceClaim(policy.id)}
            className="mt-5 rounded-full border border-white/20 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/10 transition-colors"
          >
            Advance Status (Demo) →
          </button>
        )}
      </div>

      <div className="bg-white p-6">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            ['Loss Amount', `${Math.abs(relatedAtt?.tradeReturn ?? 0) / 100}%`],
            ['Coverage', `$${policy.coverage.toLocaleString()} USDC`],
            ['Threshold', `${policy.threshold}%`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-[#f4f4f7] p-3">
              <p className="text-[10px] font-black uppercase text-[#9b9ba5]">{l}</p>
              <p className="mt-0.5 text-sm font-black text-[#24242b]">{v}</p>
            </div>
          ))}
        </div>

        {relatedAtt && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-[#9b9ba5]">Verifiable Proof</p>
            {[
              ['TEE Attestation ID', relatedAtt.teeId],
              ['Proof Hash', relatedAtt.proofHash],
              ['Storage Root (0G)', relatedAtt.storageRoot],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between rounded-xl border border-[#ebebf0] px-3 py-2.5">
                <span className="text-xs font-bold text-[#9b9ba5]">{l}</span>
                <span className="font-mono text-xs font-black text-[#3b3b45]">{v}</span>
              </div>
            ))}
            <button className="text-xs font-black text-[#308ca0] mt-1">View on 0G Explorer ↗</button>
          </div>
        )}

        {policy.status === 'paid' && (
          <div className="mt-4 rounded-2xl bg-[#dff8ee] border border-[#b7ecd6] p-4">
            <p className="text-sm font-black text-[#11875d]">
              ${policy.coverage.toLocaleString()} USDC paid to wallet
            </p>
            <p className="text-xs font-bold text-[#2a6e4a] mt-0.5">Transaction confirmed on-chain.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClaimsPage() {
  const { policies } = useApp()
  const activeClaims = policies.filter(p => p.status === 'triggered' || p.status === 'verified' || p.status === 'paid')

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Claim Center</p>
        <h1 className="mt-2 text-4xl font-black text-[#292932]">Auto-claim tracker</h1>
        <p className="mt-2 text-sm font-medium text-[#74747f]">
          No manual filing. Claims trigger from TEE attestation and execute on-chain.
        </p>
      </div>

      {activeClaims.length === 0 ? (
        <div className="rounded-[28px] bg-white p-12 text-center shadow-[0_18px_55px_rgba(31,35,45,0.08)]">
          <p className="text-4xl mb-4">🛡</p>
          <p className="text-lg font-black text-[#33333c]">No active claims</p>
          <p className="mt-2 text-sm font-medium text-[#9b9ba5]">
            All policies are within loss thresholds. Pool is healthy.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {activeClaims.map(p => <ClaimCard key={p.id} policy={p} />)}
        </div>
      )}
    </div>
  )
}
