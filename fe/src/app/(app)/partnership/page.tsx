import Image from 'next/image'

const partnerTypes = [
  {
    kanji: '剣',
    title: 'Strategy Providers',
    text: 'Bring sealed trading agents, expose verifiable performance, and monetize copier subscriptions without revealing strategy logic.',
    metrics: ['TEE attestations', 'Storage roots', 'Subscriber cover'],
  },
  {
    kanji: '盾',
    title: 'Liquidity Partners',
    text: 'Supply reserve capital for insured copy trading markets and earn premium flow from active policy demand.',
    metrics: ['Premium yield', 'Claim reserve', 'Pool utilization'],
  },
  {
    kanji: '盟',
    title: 'Ecosystem Integrators',
    text: 'Embed protected strategy access into wallets, dashboards, communities, and trading surfaces that need auditable risk controls.',
    metrics: ['API handoff', 'Policy state', 'Claim events'],
  },
]

const pipeline = [
  ['01', 'Scope',  'Choose the partner lane, target users, and launch market.'],
  ['02', 'Verify', 'Connect strategy proofs, liquidity readiness, or integration requirements.'],
  ['03', 'Launch', 'Publish the protected flow with on-chain policy and reserve visibility.'],
]

export default function PartnershipPage() {
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/80 to-transparent" />
        <div
          className="pointer-events-none absolute -right-4 top-1/2 select-none font-black leading-none text-white"
          style={{ fontSize: '9rem', opacity: 0.04, transform: 'translateY(-50%)' }}
          aria-hidden="true"
        >盟</div>
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
            <span className="h-px w-4 bg-[#cfa45b]/55" /> Partnership Desk
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#f5efe5] md:text-4xl">
            Build protected AI finance.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#4a5568]">
            Partner with the protocol layer that connects sealed AI strategy execution, underwriter liquidity, and automatic insurance claims for copy trading products.
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ['Partner lanes', '3'],
          ['Settlement',    '0G Chain'],
          ['Execution',     '0G Compute'],
        ].map(([label, value]) => (
          <div key={label} className="card-gb p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#f5efe5]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Partner type cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {partnerTypes.map(partner => (
            <article key={partner.title} className="card-gb group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-[2px]">
              {/* Left accent */}
              <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#b83227]/55 via-[#cfa45b]/25 to-transparent" />

              {/* Kanji watermark */}
              <div
                className="pointer-events-none absolute right-3 top-3 select-none font-black leading-none text-[#cfa45b]"
                style={{ fontSize: '3.5rem', opacity: 0.06 }}
                aria-hidden="true"
              >{partner.kanji}</div>

              <div className="relative mb-4 grid size-10 place-items-center bg-[#b83227] text-sm font-black text-white shadow-[0_0_18px_rgba(184,50,39,0.35)]">
                IN
              </div>
              <h2 className="text-lg font-black text-[#f5efe5]">{partner.title}</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-[#6b7280]">{partner.text}</p>

              <div className="mt-5 space-y-1.5">
                {partner.metrics.map(metric => (
                  <div key={metric} className="bg-[#0d1018] px-3 py-2">
                    <p className="text-[10px] font-black text-[#cfa45b]">{metric}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Pipeline */}
          <div className="card-gb p-6">
            <p className="mb-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
              <span className="h-px w-4 bg-[#cfa45b]/55" /> Launch Pipeline
            </p>
            <div className="space-y-3">
              {pipeline.map(([step, title, text]) => (
                <div key={step} className="border border-[#1e2330] bg-[#0d1018] p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center bg-[#251410] text-[10px] font-black text-[#cfa45b]">
                      {step}
                    </span>
                    <p className="text-sm font-black text-[#e8ddd0]">{title}</p>
                  </div>
                  <p className="text-xs font-bold leading-5 text-[#4a5568]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="relative overflow-hidden border border-[#b83227]/20 bg-[#0d0606] p-6">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#b83227]"
              style={{ opacity: 0.07, filter: 'blur(36px)' }}
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-lg font-black text-[#f5efe5]">Ready for integration review?</p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#4a5568]">
                Prepare your strategy proof, liquidity plan, or product flow. The protocol maps it into subscriptions, policies, attestations, and reserve accounting.
              </p>
              <a
                className="btn-shimmer mt-5 block bg-[#b83227] px-5 py-3.5 text-center text-sm font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.3)]"
                href="mailto:partners@insurai.xyz"
              >
                Contact Partnerships →
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
