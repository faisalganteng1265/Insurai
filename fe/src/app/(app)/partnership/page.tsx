const partnerTypes = [
  {
    title: 'Strategy Providers',
    text: 'Bring sealed trading agents, expose verifiable performance, and monetize copier subscriptions without revealing strategy logic.',
    metrics: ['TEE attestations', 'Storage roots', 'Subscriber cover'],
  },
  {
    title: 'Liquidity Partners',
    text: 'Supply reserve capital for insured copy trading markets and earn premium flow from active policy demand.',
    metrics: ['Premium yield', 'Claim reserve', 'Pool utilization'],
  },
  {
    title: 'Ecosystem Integrators',
    text: 'Embed protected strategy access into wallets, dashboards, communities, and trading surfaces that need auditable risk controls.',
    metrics: ['API handoff', 'Policy state', 'Claim events'],
  },
]

const pipeline = [
  ['01', 'Scope', 'Choose the partner lane, target users, and launch market.'],
  ['02', 'Verify', 'Connect strategy proofs, liquidity readiness, or integration requirements.'],
  ['03', 'Launch', 'Publish the protected flow with on-chain policy and reserve visibility.'],
]

export default function PartnershipPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#cfa45b]">Partnership Desk</p>
        <h1 className="mt-2 text-4xl font-black text-[#f5efe5]">Build protected AI finance with Insurai</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#a7adb8]">
          Partner with the protocol layer that connects sealed AI strategy execution, underwriter liquidity,
          and automatic insurance claims for copy trading products.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Partner lanes', '3'],
          ['Settlement', '0G Chain'],
          ['Execution', '0G Compute'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] bg-[#11141b] p-5 shadow-[0_10px_30px_rgba(31,35,45,0.07)]">
            <p className="text-[10px] font-black uppercase text-[#7f8794]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[#f5efe5]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {partnerTypes.map(partner => (
            <article
              key={partner.title}
              className="rounded-[28px] bg-[#11141b] p-6 shadow-[0_18px_55px_rgba(31,35,45,0.08)]"
            >
              <div className="mb-5 grid size-11 place-items-center rounded-full bg-[#b83227] text-base font-black text-white">
                IN
              </div>
              <h2 className="text-xl font-black text-[#f5efe5]">{partner.title}</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-[#a7adb8]">{partner.text}</p>
              <div className="mt-5 space-y-2">
                {partner.metrics.map(metric => (
                  <div key={metric} className="rounded-2xl bg-[#171b24] px-4 py-3">
                    <p className="text-xs font-black text-[#cfa45b]">{metric}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] bg-[#11141b] p-6 shadow-[0_18px_55px_rgba(31,35,45,0.08)]">
            <p className="text-xs font-black uppercase tracking-widest text-[#cfa45b]">Launch Pipeline</p>
            <div className="mt-5 space-y-4">
              {pipeline.map(([step, title, text]) => (
                <div key={step} className="rounded-2xl border border-[#2a2f3a] bg-[#171b24] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-[#251410] text-xs font-black text-[#cfa45b]">
                      {step}
                    </span>
                    <p className="text-sm font-black text-[#f5efe5]">{title}</p>
                  </div>
                  <p className="mt-3 text-xs font-bold leading-5 text-[#a7adb8]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#5c2a23] bg-[#251410] p-6">
            <p className="text-lg font-black text-[#f5efe5]">Ready for integration review?</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#a7adb8]">
              Prepare your strategy proof, liquidity plan, or product flow. The protocol can map it into
              subscriptions, policies, attestations, and reserve accounting.
            </p>
            <a
              className="mt-5 block rounded-full bg-[#b83227] px-5 py-4 text-center text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)]"
              href="mailto:partners@insurai.xyz"
            >
              Contact Partnerships
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
