import Image from "next/image";
import Link from "next/link";

const proofSteps = [
  {
    label: "SEALED STRATEGY",
    title: "AI agent runs privately",
    text: "The provider keeps strategy logic hidden while execution output is prepared for verification.",
  },
  {
    label: "TEE ATTESTATION",
    title: "Loss is recorded as proof",
    text: "A signed result captures return, proof hash, TEE ID, and 0G Storage root for auditability.",
  },
  {
    label: "AUTO CLAIM",
    title: "Policy pays when threshold breaks",
    text: "The app demo shows coverage creation, proof submission, claim tracking, and pool payout.",
  },
];

const stats = [
  ["Demo Coverage", "$1,000"],
  ["Loss Trigger", "-30%"],
  ["Threshold", "20%"],
  ["Payout", "Auto"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f8fb] text-[#2f3037]">
      <nav className="fixed inset-x-0 top-0 z-30 border-b border-black/5 bg-white/88 px-5 py-4 shadow-[0_10px_30px_rgba(31,35,45,0.08)] backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid size-9 place-items-center rounded-full bg-[#e94343] text-sm font-black text-white">
              CG
            </div>
            <span className="text-lg font-black tracking-normal text-[#d62f35]">
              CareGuard Finance
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-black text-[#6d6d78] md:flex">
            <a href="#how">How It Works</a>
            <a href="#demo">Demo Flow</a>
            <a href="#protocol">Protocol</a>
          </div>
          <Link
            className="rounded-full bg-[#d71920] px-5 py-3 text-xs font-black text-white shadow-[0_10px_18px_rgba(215,25,32,0.22)]"
            href="/marketplace"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <section className="relative min-h-[92vh] overflow-hidden px-5 pb-14 pt-28 md:px-8 md:pt-32">
        <div className="absolute inset-0 bg-[#f8f8fb]" />
        <Image
          src="/assets/guardian-robot.png"
          alt="CareGuard AI insurance guardian"
          width={900}
          height={1320}
          priority
          className="pointer-events-none absolute bottom-[-220px] right-[-150px] z-0 w-[520px] max-w-none opacity-35 sm:right-[-70px] sm:w-[610px] md:bottom-[-260px] md:right-[3vw] md:w-[760px] md:opacity-90"
        />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.95fr_1.05fr]">
          <div className="flex min-h-[68vh] flex-col justify-center">
            <p className="mb-5 w-fit rounded-full border border-[#ffd7d7] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#d62f35]">
              0G verifiable finance demo
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-[#24242b] md:text-7xl">
              CareGuard Finance
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#5f606b]">
              Insurance for AI copy trading strategies. The demo focuses on the
              safety layer: strategy subscription, policy purchase, TEE proof
              submission, automatic claim tracking, and pool payout.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[#d71920] px-6 py-4 text-sm font-black text-white shadow-[0_18px_28px_rgba(215,25,32,0.22)]"
                href="/marketplace"
              >
                Launch Demo App
              </Link>
              <a
                className="rounded-full border border-[#dedee6] bg-white px-6 py-4 text-sm font-black text-[#393944]"
                href="#how"
              >
                See Flow
              </a>
            </div>
          </div>

          <div className="flex items-end justify-center md:justify-end">
            <div className="grid w-full max-w-xl grid-cols-2 gap-3 pb-2 md:pb-10">
              {stats.map(([label, value]) => (
                <div
                  className="rounded-[28px] bg-white/92 p-5 shadow-[0_18px_55px_rgba(31,35,45,0.08)] backdrop-blur"
                  key={label}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9b9ba5]">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-[#2f3037]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto grid max-w-7xl gap-5 px-5 py-16 md:grid-cols-3 md:px-8"
        id="how"
      >
        {proofSteps.map((step) => (
          <article
            className="rounded-[28px] bg-white p-7 shadow-[0_18px_55px_rgba(31,35,45,0.08)]"
            key={step.label}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d62f35]">
              {step.label}
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal text-[#292932]">
              {step.title}
            </h2>
            <p className="mt-4 text-sm font-medium leading-7 text-[#6d6d78]">
              {step.text}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-white px-5 py-16 md:px-8" id="demo">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d62f35]">
              Demo Journey
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-normal text-[#292932] md:text-5xl">
              Launch into the working insurance app.
            </h2>
            <p className="mt-5 text-base font-medium leading-8 text-[#6d6d78]">
              The core app is intentionally separate from this landing page. It
              lets the demo switch persona between copier, provider, and
              underwriter without turning the homepage into a dashboard.
            </p>
            <Link
              className="mt-7 inline-flex rounded-full bg-[#d71920] px-6 py-4 text-sm font-black text-white shadow-[0_18px_28px_rgba(215,25,32,0.22)]"
              href="/marketplace"
            >
              Open App Interface
            </Link>
          </div>
          <div className="grid gap-4">
            {[
              ["01", "Copier subscribes to Pulse Momentum and buys coverage."],
              ["02", "Provider records a mock TEE attestation with -3000 bps return."],
              ["03", "Claim Center advances from triggered to verified to paid."],
            ].map(([number, text]) => (
              <div
                className="flex items-center gap-5 rounded-[28px] bg-[#f8f8fb] p-5"
                key={number}
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e94343] text-sm font-black text-white">
                  {number}
                </div>
                <p className="text-lg font-black leading-7 text-[#363640]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8" id="protocol">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-[#2b2c34] p-7 text-white shadow-[0_18px_55px_rgba(31,35,45,0.16)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb8b8]">
            Protocol Scope
          </p>
          <div className="mt-4 grid gap-8 md:grid-cols-[1fr_0.9fr]">
            <h2 className="text-4xl font-black leading-tight tracking-normal md:text-5xl">
              The demo is the safety net layer, with copy trading simulated by
              verifiable results.
            </h2>
            <p className="text-base font-medium leading-8 text-white/70">
              This keeps the story honest: the smart contracts cover
              subscription, policy creation, underwriter liquidity, proof
              registry, threshold checks, and claim payout. The off-chain copy
              trading engine can be added later as an integration point.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
