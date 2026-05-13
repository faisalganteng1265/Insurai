import Image from "next/image";
import Link from "next/link";
import SamuraiWebGLScene from "@/components/SamuraiWebGLScene";

const stats = [
  ["Coverage", "$1,000"],
  ["Loss trigger", "-30%"],
  ["Threshold", "20%"],
  ["Payout", "Auto"],
];

const stackCards = [
  {
    label: "01 / Sealed Agent",
    title: "Strategy logic stays hidden in the sheath.",
    text: "Providers register AI strategies with storage roots and config hashes. Copiers see performance proofs without exposing the strategy prompt or trading logic.",
    metric: "TEE sealed",
  },
  {
    label: "02 / Verifiable Execution",
    title: "Every trade result arrives with a signed trail.",
    text: "The backend records TEE attestations, storage roots, proof hashes, market data fingerprints, and return in basis points for on-chain auditability.",
    metric: "0G proof",
  },
  {
    label: "03 / Insurance Layer",
    title: "Copiers buy cover before following risk.",
    text: "Policies lock underwriter liquidity, price premium from strategy risk, and define the loss threshold that will trigger protection.",
    metric: "30 days",
  },
  {
    label: "04 / Auto Claim",
    title: "When loss crosses the line, payout moves.",
    text: "Registered loss attestations can trigger claims directly against the policy contract, sending payout from the reserve to the protected copier.",
    metric: "No filing",
  },
];

const protocolPillars = [
  ["0G Compute", "Private AI strategy execution inside a verifiable TEE path."],
  ["0G Chain", "Policies, premium, reserves, subscriptions, and claim settlement."],
  ["0G Storage", "Execution payloads and attestations archived as audit roots."],
  ["Explorer Track Record", "Strategy history becomes visible without revealing the edge."],
];

const samuraiVisuals = [
  {
    src: "/assets/ronin-lunging-forward.jpg",
    title: "Ronin execution",
    text: "Action print energy for the protocol's claim trigger moment.",
  },
  {
    src: "/assets/musashi-self-portrait.jpg",
    title: "Musashi discipline",
    text: "A strategic, restrained visual cue for sealed AI decision-making.",
  },
  {
    src: "/assets/samurai-armor-illustration.jpg",
    title: "Armor blueprint",
    text: "A protection-system metaphor for coverage, reserves, and thresholds.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07080c] text-[#f5efe5]">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#07080c]/78 px-5 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid size-9 place-items-center rounded-full border border-[#cfa45b]/30 bg-[#b83227] text-sm font-black text-white shadow-[0_0_32px_rgba(184,50,39,0.38)]">
              IN
            </div>
            <span className="text-lg font-black tracking-normal text-[#cfa45b]">
              Insurai
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-black text-[#a7adb8] md:flex">
            <a className="hover:text-[#cfa45b]" href="#stack">
              Flow
            </a>
            <a className="hover:text-[#cfa45b]" href="#protocol">
              Protocol
            </a>
            <a className="hover:text-[#cfa45b]" href="#reserve">
              Reserve
            </a>
          </div>
          <Link
            className="rounded-full bg-[#b83227] px-5 py-3 text-xs font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.32)]"
            href="/marketplace"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <section className="relative min-h-[96vh] px-5 pb-16 pt-28 md:px-8 md:pt-32 lg:h-[94vh] lg:min-h-[720px] lg:max-h-[920px] lg:pb-12">
        <div className="absolute inset-0 bg-[#07080c]" />
        <Image
          src="/assets/samurai-armor-met.jpg"
          alt="Historic samurai armor used as Insurai visual identity"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none absolute inset-0 z-0 object-cover object-[60%_42%] opacity-50 md:object-[72%_44%] md:opacity-78"
        />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_74%_36%,rgba(184,50,39,0.30),transparent_30%),linear-gradient(90deg,rgba(7,8,12,0.98)_0%,rgba(7,8,12,0.90)_40%,rgba(7,8,12,0.36)_100%)]" />
        <SamuraiWebGLScene />
        <div className="absolute inset-x-0 bottom-0 z-0 h-56 bg-gradient-to-t from-[#07080c] to-transparent" />

        <div className="relative z-10 mx-auto grid h-full max-w-7xl items-center gap-10 md:grid-cols-[0.96fr_1.04fr]">
          <div>
            <p className="mb-5 w-fit rounded-full border border-[#cfa45b]/25 bg-[#11141b]/82 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#cfa45b] backdrop-blur">
              0G verifiable finance / samurai risk protocol
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-normal text-[#f5efe5] md:text-7xl lg:text-7xl xl:text-8xl">
              Insurai guards AI copy trading.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#c7ccd6]">
              A dark insurance layer for sealed AI strategies: verifiable TEE
              execution, threshold-based cover, automatic claims, and
              underwriter liquidity on 0G.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[#b83227] px-6 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(184,50,39,0.34)]"
                href="/marketplace"
              >
                Enter Marketplace
              </Link>
              <a
                className="rounded-full border border-white/15 bg-[#11141b]/72 px-6 py-4 text-sm font-black text-[#f5efe5] backdrop-blur"
                href="#stack"
              >
                Watch the Flow
              </a>
            </div>
          </div>

          <div className="self-end">
            <div className="ml-auto grid w-full max-w-xl grid-cols-2 gap-3">
              {stats.map(([label, value]) => (
                <div
                  className="border border-white/10 bg-[#11141b]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur"
                  key={label}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7f8794]">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-[#f5efe5]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c0f15] px-5 py-5 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#7f8794] md:grid-cols-4">
          {["Sealed strategy", "TEE proof", "Threshold cover", "Pool payout"].map(
            (item) => (
              <div className="flex items-center gap-3" key={item}>
                <span className="h-px flex-1 bg-[#2a2f3a]" />
                <span>{item}</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 lg:py-28" id="stack">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa45b]">
              Scroll Stack
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-normal text-[#f5efe5] md:text-5xl">
              One protocol flow, four disciplined cuts.
            </h2>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-[#a7adb8]">
              The landing is built around the core demo path: sealed strategy,
              proof, coverage, and payout. Each layer becomes stronger because
              the previous layer leaves a verifiable trace.
            </p>
          </div>

          <div className="space-y-5">
            {stackCards.map((card, index) => (
              <article
                className="sticky border border-white/10 bg-[#11141b]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur md:p-8"
                key={card.label}
                style={{ top: `${112 + index * 18}px` }}
              >
                <div className="flex items-start justify-between gap-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa45b]">
                    {card.label}
                  </p>
                  <span className="shrink-0 border border-[#cfa45b]/25 bg-[#251410] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#cfa45b]">
                    {card.metric}
                  </span>
                </div>
                <h3 className="mt-8 max-w-3xl text-3xl font-black leading-tight text-[#f5efe5] md:text-4xl">
                  {card.title}
                </h3>
                <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-[#a7adb8]">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0c0f15] px-5 py-20 md:px-8 lg:py-28" id="protocol">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa45b]">
                Protocol Architecture
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-normal text-[#f5efe5] md:text-5xl">
                Built for proof, not promises.
              </h2>
            </div>
            <p className="text-base font-medium leading-8 text-[#a7adb8]">
              Insurai makes AI copy trading easier to trust by separating what
              must stay private from what must be verifiable. Strategy logic can
              remain hidden, but execution history, policy state, and claim
              outcomes stay inspectable.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {protocolPillars.map(([title, text]) => (
              <article
                className="border border-white/10 bg-[#11141b] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.18)]"
                key={title}
              >
                <p className="text-xl font-black text-[#f5efe5]">{title}</p>
                <p className="mt-3 text-sm font-medium leading-7 text-[#a7adb8]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa45b]">
                Samurai Visual Codex
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-[#f5efe5] md:text-5xl">
                More blade, armor, and discipline in the brand system.
              </h2>
            </div>
            <p className="text-base font-medium leading-8 text-[#a7adb8]">
              Insurai now uses a broader samurai visual language: armor for
              protection, ronin motion for automatic claims, and Musashi-style
              discipline for hidden AI strategy. These are local assets, not
              hotlinked images.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {samuraiVisuals.map((visual) => (
              <article
                className="group overflow-hidden border border-white/10 bg-[#11141b]"
                key={visual.src}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#07080c]">
                  <Image
                    src={visual.src}
                    alt={visual.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover opacity-82 saturate-[0.78] transition duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black text-[#f5efe5]">
                    {visual.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-7 text-[#a7adb8]">
                    {visual.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 lg:py-28" id="reserve">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-white/10 bg-[#11141b] p-7 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa45b]">
              Reserve Logic
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-[#f5efe5] md:text-5xl">
              Underwriters earn when strategies behave. Copiers recover when
              they break.
            </h2>
            <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-[#a7adb8]">
              The demo keeps the product honest: copy trading is simulated by
              verifiable results, while the insurance primitive is implemented
              with deployed contracts for subscriptions, policies, premium,
              reserves, attestations, and payout.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              ["Risk score", "Premium multiplier"],
              ["Loss threshold", "Claim condition"],
              ["Reserved cover", "Locked pool liquidity"],
              ["Proof hash", "Audit handle"],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between border border-white/10 bg-[#11141b] px-5 py-4"
                key={label}
              >
                <span className="text-sm font-bold text-[#7f8794]">{label}</span>
                <span className="text-sm font-black text-[#f5efe5]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl border border-[#cfa45b]/20 bg-[#251410] p-8 text-center shadow-[0_24px_80px_rgba(184,50,39,0.16)] md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#cfa45b]">
            Enter the dojo
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight text-[#f5efe5] md:text-5xl">
            Follow sealed AI strategies with a protection layer already drawn.
          </h2>
          <Link
            className="mt-8 inline-flex rounded-full bg-[#b83227] px-7 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(184,50,39,0.32)]"
            href="/marketplace"
          >
            Launch Insurai
          </Link>
        </div>
      </section>
    </main>
  );
}
