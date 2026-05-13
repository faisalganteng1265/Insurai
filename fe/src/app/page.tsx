import Image from "next/image";
import Link from "next/link";
import SamuraiWebGLScene from "@/components/SamuraiWebGLScene";
import Navbar from "@/components/Navbar";

const stats = [
  ["Coverage", "$1,000"],
  ["Loss trigger", "−30%"],
  ["Threshold", "20%"],
  ["Payout", "Auto"],
];

const stackCards = [
  {
    label: "01 / Sealed Agent",
    kanji: "一",
    title: "Strategy logic stays hidden in the sheath.",
    text: "Providers register AI strategies with storage roots and config hashes. Copiers see performance proofs without exposing the strategy prompt or trading logic.",
    metric: "TEE sealed",
  },
  {
    label: "02 / Verifiable Execution",
    kanji: "二",
    title: "Every trade result arrives with a signed trail.",
    text: "The backend records TEE attestations, storage roots, proof hashes, market data fingerprints, and return in basis points for on-chain auditability.",
    metric: "0G proof",
  },
  {
    label: "03 / Insurance Layer",
    kanji: "三",
    title: "Copiers buy cover before following risk.",
    text: "Policies lock underwriter liquidity, price premium from strategy risk, and define the loss threshold that will trigger protection.",
    metric: "30 days",
  },
  {
    label: "04 / Auto Claim",
    kanji: "四",
    title: "When loss crosses the line, payout moves.",
    text: "Registered loss attestations can trigger claims directly against the policy contract, sending payout from the reserve to the protected copier.",
    metric: "No filing",
  },
];

const protocolPillars = [
  {
    title: "0G Compute",
    text: "Private AI strategy execution inside a verifiable TEE path.",
    num: "01",
  },
  {
    title: "0G Chain",
    text: "Policies, premium, reserves, subscriptions, and claim settlement.",
    num: "02",
  },
  {
    title: "0G Storage",
    text: "Execution payloads and attestations archived as audit roots.",
    num: "03",
  },
  {
    title: "Explorer Track Record",
    text: "Strategy history becomes visible without revealing the edge.",
    num: "04",
  },
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
    text: "Strategic restraint for sealed AI decision-making.",
  },
  {
    src: "/assets/samurai-armor-illustration.jpg",
    title: "Armor blueprint",
    text: "Protection-system metaphor for coverage and thresholds.",
  },
];

const tickerItems = [
  "◆ Sealed strategy",
  "◆ TEE proof",
  "◆ Threshold cover",
  "◆ Pool payout",
  "◆ 0G compute",
  "◆ Verifiable execution",
  "◆ Auto claim",
  "◆ Underwriter reserve",
  "◆ No filing required",
  "◆ On-chain settlement",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#07080c] text-[#f5efe5]">

      <Navbar />

      {/* ── HERO ────────────────────────────────── */}
      <section className="relative h-screen overflow-hidden px-5 pb-0 pt-24 md:px-8">
        {/* Base bg */}
        <div className="absolute inset-0 bg-[#07080c]" />

        {/* Samurai armor — right half only via mask */}
        <Image
          src="/assets/samurai-armor-met.jpg"
          alt="Historic samurai armor — Insurai visual identity"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none absolute inset-0 z-0 object-cover opacity-55 md:opacity-70"
          style={{
            objectPosition: "62% 38%",
            maskImage:
              "linear-gradient(to right, transparent 0%, transparent 10%, black 38%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, transparent 10%, black 38%, black 100%)",
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_62%_55%_at_68%_38%,rgba(184,50,39,0.2),transparent),linear-gradient(104deg,rgba(7,8,12,1)_0%,rgba(7,8,12,0.97)_28%,rgba(7,8,12,0.76)_52%,rgba(7,8,12,0.28)_100%)]" />

        {/* WebGL embers + katana */}
        <SamuraiWebGLScene />

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-52 bg-gradient-to-t from-[#07080c] to-transparent" />

        {/* Kanji watermark 護 (protect) */}
        <div
          className="pointer-events-none absolute right-[5%] top-1/2 z-[1] select-none font-black leading-none text-white"
          style={{ fontSize: "27vw", opacity: 0.028, transform: "translateY(-50%)" }}
          aria-hidden="true"
        >
          護
        </div>

        {/* Left vertical accent line */}
        <div className="pointer-events-none absolute left-0 top-0 z-[3] h-full w-px overflow-hidden">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-[#b83227]/28 to-transparent" />
        </div>

        {/* ── Hero content: cinematic poster layout ── */}
        <div className="relative z-10 flex h-full flex-col justify-end">

          {/* ── Sparse top elements ── */}
          {/* Top-left: year + vertical tick */}
          <div className="absolute left-5 top-28 hidden flex-col items-center gap-1.5 md:left-8 lg:flex">
            <span className="h-10 w-px bg-gradient-to-b from-[#b83227]/45 to-transparent" />
            <p
              className="text-[9px] font-black uppercase tracking-[0.26em] text-[#2d3748]"
              style={{ writingMode: "vertical-rl" }}
            >
              侍 · 2025
            </p>
          </div>

          {/* Top-right: live + protocol ID */}
          <div className="absolute right-5 top-28 hidden flex-col items-end gap-1.5 md:right-8 lg:flex">
            <div className="flex items-center gap-1.5">
              <span className="live-badge h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#2d3748]">Live</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1a2030]">0G Testnet</span>
          </div>

          {/* Film-frame corner markers — top-left */}
          <div className="absolute left-5 top-24 hidden md:left-8 md:top-24 lg:block" aria-hidden="true">
            <div className="h-5 w-5 border-l border-t border-[#cfa45b]/18" />
          </div>
          {/* Film-frame corner — top-right */}
          <div className="absolute right-5 top-24 hidden md:right-8 lg:block" aria-hidden="true">
            <div className="h-5 w-5 border-r border-t border-[#cfa45b]/18" />
          </div>

          {/* ── Stats: tactical overlay at mid-right ── */}
          <div className="absolute right-5 top-1/2 hidden -translate-y-[55%] flex-col gap-2 md:right-8 lg:flex">
            {stats.map(([label, value]) => (
              <div
                key={label}
                className="card-gb group flex w-[220px] items-center justify-between p-4 transition-all duration-300 hover:-translate-x-[2px]"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#4a5568] transition-colors group-hover:text-[#7f8794]">
                  {label}
                </p>
                <p className="text-[1.6rem] font-black leading-none text-[#f5efe5]">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Bottom text block ── */}
          <div className="mx-auto w-full max-w-7xl px-5 pb-28 md:px-8 md:pb-32">

            {/* Divider line */}
            <div className="mb-7 flex items-center gap-5">
              <span className="h-px flex-1 max-w-[180px] bg-gradient-to-r from-[#b83227]/50 to-[#cfa45b]/25" />
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-[#cfa45b]/55">
                0G verifiable finance · samurai risk protocol
              </p>
              <span className="h-px w-8 bg-[#cfa45b]/15" />
            </div>

            {/* Headline: scale contrast — huge title, smaller tagline */}
            <div className="max-w-3xl">
              <h1>
                <span
                  className="block font-black leading-[0.86] tracking-[-0.02em] text-[#f5efe5]"
                  style={{ fontSize: "clamp(4rem, 10.5vw, 9rem)" }}
                >
                  Insurai
                </span>
                <span
                  className="mt-2 block font-black leading-[1.1]"
                  style={{ fontSize: "clamp(1.2rem, 2.8vw, 2.4rem)", color: "#7a8594" }}
                >
                  guards AI copy trading.
                </span>
              </h1>
            </div>

            {/* Description + CTAs + trust pillars row */}
            <div className="mt-7 flex flex-wrap items-end gap-10 lg:gap-16">

              {/* Left: description + buttons */}
              <div>
                <p className="max-w-[40ch] text-[0.875rem] font-medium leading-[1.9] text-[#5c6470]">
                  Dark insurance for sealed AI strategies: verifiable TEE
                  execution, threshold cover, automatic claims on 0G.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    className="btn-shimmer rounded-full bg-[#b83227] px-7 py-3.5 text-sm font-black text-white shadow-[0_18px_42px_rgba(184,50,39,0.38)] hover:bg-[#c8382c] hover:shadow-[0_24px_52px_rgba(184,50,39,0.52)]"
                    href="/marketplace"
                  >
                    Enter Marketplace
                  </Link>
                  <a
                    className="rounded-full border border-white/10 bg-[#0d1018]/60 px-6 py-3.5 text-sm font-black text-[#b0b8c4] backdrop-blur hover:border-[#cfa45b]/25 hover:text-[#f5efe5]"
                    href="#stack"
                  >
                    Watch Flow ↓
                  </a>
                </div>
              </div>

              {/* Right: trust pillars aligned to bottom-right */}
              <div className="flex flex-wrap items-end gap-6 lg:ml-auto">
                {[
                  ["TEE sealed", "Verifiable AI"],
                  ["0G Chain", "On-chain"],
                  ["Auto payout", "No filing"],
                ].map(([title, sub]) => (
                  <div key={title} className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-[#c0c8d4]">{title}</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#2d3748]">{sub}</span>
                  </div>
                ))}
              </div>

            </div>


          </div>

          {/* Film-frame corner markers — bottom */}
          <div className="absolute bottom-[4.5rem] left-5 hidden md:left-8 lg:block" aria-hidden="true">
            <div className="h-5 w-5 border-b border-l border-[#cfa45b]/15" />
          </div>
          <div className="absolute bottom-[4.5rem] right-5 hidden md:right-8 lg:block" aria-hidden="true">
            <div className="h-5 w-5 border-b border-r border-[#cfa45b]/15" />
          </div>

        </div>

        {/* ── Marquee ticker — pinned to bottom of hero ── */}
        <div className="absolute inset-x-0 bottom-0 z-[5] overflow-hidden border-t border-white/[0.06] bg-[#07080c]/80 py-3.5 backdrop-blur-sm">
          <div className="marquee-track flex items-center whitespace-nowrap">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-12 px-12 text-[10px] font-black uppercase tracking-[0.2em] text-[#2d3748]"
              >
                {tickerItems.map((item) => (
                  <span key={item} className="transition-colors duration-200 hover:text-[#cfa45b]">
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── SCROLL STACK ────────────────────────── */}
      <section className="relative px-5 py-20 md:px-8 lg:py-32" id="stack" style={{ overflowX: 'clip' }}>
        {/* Kanji watermark 武 (warrior) */}
        <div
          className="pointer-events-none absolute -right-8 top-1/2 select-none font-black leading-none text-[#cfa45b]"
          style={{ fontSize: "22vw", opacity: 0.022, transform: "translateY(-50%)" }}
          aria-hidden="true"
        >
          武
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">

          {/* Sticky left panel */}
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <p className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
              <span className="h-px w-5 bg-[#cfa45b]/55" />
              Scroll Stack
            </p>
            <h2 className="mt-4 font-black leading-[1.04] tracking-tight text-[#f5efe5]"
              style={{ fontSize: "clamp(1.9rem, 3.2vw, 3rem)" }}
            >
              One protocol flow,{" "}
              <span className="text-shimmer">four disciplined</span>{" "}
              cuts.
            </h2>
            <p className="mt-5 max-w-[36ch] text-[0.9rem] font-medium leading-[1.85] text-[#6b7280]">
              Sealed strategy → verifiable proof → threshold cover → automatic payout. Each layer leaves a signed trace for the next.
            </p>

            {/* Katana rule */}
            <div className="katana-rule mt-8" />

            {/* Small armor preview */}
            <div className="mt-8 overflow-hidden">
              <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <Image
                  src="/assets/samurai-armor-illustration.jpg"
                  alt="Samurai armor blueprint"
                  fill
                  sizes="260px"
                  className="object-cover opacity-55 saturate-[0.65] transition-all duration-500 hover:opacity-72 hover:saturate-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/15 to-transparent" />
                <div className="absolute inset-0 border border-white/[0.07]" />
                <p className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#cfa45b]/65">
                  Protection system
                </p>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-5">
            {stackCards.map((card, index) => (
              <article
                className="card-gb group relative overflow-hidden sticky p-6 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-sm md:p-8"
                key={card.label}
                style={{
                  top: `${108 + index * 20}px`,
                  zIndex: index + 2,
                }}
              >
                {/* Left red-to-gold accent bar */}
                <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#b83227]/55 via-[#cfa45b]/35 to-transparent" />

                {/* Kanji number watermark */}
                <div
                  className="pointer-events-none absolute right-5 top-1/2 select-none font-black leading-none text-[#cfa45b]"
                  style={{ fontSize: "5.5rem", opacity: 0.045, transform: "translateY(-50%)" }}
                  aria-hidden="true"
                >
                  {card.kanji}
                </div>

                <div className="flex items-start justify-between gap-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
                    {card.label}
                  </p>
                  <span className="shrink-0 border border-[#cfa45b]/22 bg-[#251410] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#cfa45b]">
                    {card.metric}
                  </span>
                </div>
                <h3 className="mt-7 max-w-2xl text-[1.6rem] font-black leading-[1.18] text-[#f5efe5] md:text-[1.85rem]">
                  {card.title}
                </h3>
                <p className="mt-4 max-w-2xl text-[0.9rem] font-medium leading-[1.88] text-[#6b7280]">
                  {card.text}
                </p>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ── DIAGONAL DIVIDER ────────────────────── */}
      <div className="relative z-10 -mb-1 overflow-hidden" style={{ height: "52px" }} aria-hidden="true">
        <div className="absolute inset-0 bg-[#0c0f15]" />
        <div
          className="absolute inset-0 bg-[#07080c]"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
      </div>

      {/* ── PROTOCOL ARCHITECTURE ───────────────── */}
      <section className="relative overflow-hidden bg-[#0c0f15] px-5 py-20 md:px-8 lg:py-32" id="protocol">
        {/* Subtle grid */}
        <div className="tech-grid pointer-events-none absolute inset-0" />

        {/* Kanji watermark 剣 (sword) */}
        <div
          className="pointer-events-none absolute -left-10 top-1/2 select-none font-black leading-none text-white"
          style={{ fontSize: "24vw", opacity: 0.018, transform: "translateY(-50%)" }}
          aria-hidden="true"
        >
          剣
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div>
              <p className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
                <span className="h-px w-5 bg-[#cfa45b]/55" />
                Protocol Architecture
              </p>
              <h2 className="mt-4 font-black leading-[1.04] tracking-tight text-[#f5efe5]"
                style={{ fontSize: "clamp(1.9rem, 3.5vw, 3.2rem)" }}
              >
                Built for proof,{" "}
                <span className="text-[#b83227]">not promises.</span>
              </h2>
            </div>
            <p className="self-end text-[0.9rem] font-medium leading-[1.88] text-[#6b7280]">
              Insurai separates what must stay private from what must be verifiable. Strategy logic stays hidden; execution history, policy state, and claim outcomes stay inspectable on-chain.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {protocolPillars.map((pillar) => (
              <article
                className="card-gb-dark scan-line group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_20px_56px_rgba(0,0,0,0.42)] md:p-8"
                key={pillar.title}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="text-base font-black leading-none text-[#cfa45b] opacity-38">
                    {pillar.num}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#cfa45b]/18 to-transparent" />
                </div>
                <p className="text-xl font-black text-[#e8ddd0] transition-colors duration-250 group-hover:text-[#cfa45b]">
                  {pillar.title}
                </p>
                <p className="mt-3 text-[0.875rem] font-medium leading-[1.85] text-[#6b7280]">
                  {pillar.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVERSE DIAGONAL DIVIDER ────────────── */}
      <div className="relative z-10 -mt-1 overflow-hidden" style={{ height: "52px" }} aria-hidden="true">
        <div className="absolute inset-0 bg-[#07080c]" />
        <div
          className="absolute inset-0 bg-[#0c0f15]"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        />
      </div>

      {/* ── SAMURAI VISUAL CODEX ────────────────── */}
      <section className="px-5 py-20 md:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
                <span className="h-px w-5 bg-[#cfa45b]/55" />
                Samurai Visual Codex
              </p>
              <h2 className="mt-4 font-black leading-[1.04] tracking-tight text-[#f5efe5]"
                style={{ fontSize: "clamp(1.9rem, 3.5vw, 3.2rem)" }}
              >
                Blade, armor,<br />
                and discipline.
              </h2>
            </div>
            <p className="self-end text-[0.9rem] font-medium leading-[1.88] text-[#6b7280]">
              Three samurai archetypes map to the protocol: armor for protection layers, ronin motion for automatic trigger execution, Musashi-style restraint for sealed AI decision-making.
            </p>
          </div>

          {/* Magazine asymmetric grid */}
          <div className="grid gap-4 md:grid-cols-5">

            {/* Feature card — 3 cols */}
            <article className="group relative col-span-5 overflow-hidden md:col-span-3">
              <div className="relative overflow-hidden bg-[#07080c]" style={{ aspectRatio: "16/10" }}>
                <Image
                  src={samuraiVisuals[0].src}
                  alt={samuraiVisuals[0].title}
                  fill
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover opacity-65 saturate-[0.68] transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-85 group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/22 to-transparent" />
                <div className="absolute inset-0 border border-white/[0.08]" />
                {/* Red top-left corner accent */}
                <div className="absolute left-0 top-0 h-12 w-[2px] bg-gradient-to-b from-[#b83227]/60 to-transparent" />
                <div className="absolute left-0 top-0 h-[2px] w-12 bg-gradient-to-r from-[#b83227]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
                    01 — {samuraiVisuals[0].title}
                  </span>
                  <p className="mt-2 max-w-[36ch] text-sm font-medium leading-6 text-[#8a9099]">
                    {samuraiVisuals[0].text}
                  </p>
                </div>
              </div>
            </article>

            {/* Right column — 2 stacked cards */}
            <div className="col-span-5 flex flex-col gap-4 md:col-span-2">
              {samuraiVisuals.slice(1).map((visual, i) => (
                <article key={visual.src} className="group relative flex-1 overflow-hidden">
                  <div className="relative overflow-hidden bg-[#07080c]" style={{ aspectRatio: "4/3" }}>
                    <Image
                      src={visual.src}
                      alt={visual.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover opacity-58 saturate-[0.6] transition-all duration-700 group-hover:scale-[1.05] group-hover:opacity-80 group-hover:saturate-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-transparent to-transparent" />
                    <div className="absolute inset-0 border border-white/[0.08]" />
                    {/* Gold top-left corner */}
                    <div className="absolute left-0 top-0 h-8 w-[2px] bg-gradient-to-b from-[#cfa45b]/45 to-transparent" />
                    <div className="absolute left-0 top-0 h-[2px] w-8 bg-gradient-to-r from-[#cfa45b]/45 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cfa45b]">
                        {String(i + 2).padStart(2, "0")} — {visual.title}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── DIAGONAL DIVIDER ────────────────────── */}
      <div className="relative z-10 -mb-1 overflow-hidden" style={{ height: "52px" }} aria-hidden="true">
        <div className="absolute inset-0 bg-[#0c0f15]" />
        <div
          className="absolute inset-0 bg-[#07080c]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />
      </div>

      {/* ── RESERVE LOGIC ───────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c0f15] px-5 py-20 md:px-8 lg:py-32" id="reserve">
        {/* Kanji 盾 (shield/protection) */}
        <div
          className="pointer-events-none absolute right-0 top-1/2 select-none font-black leading-none text-[#b83227]"
          style={{ fontSize: "20vw", opacity: 0.024, transform: "translateY(-50%)" }}
          aria-hidden="true"
        >
          盾
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.22fr_0.78fr]">

            {/* Left: info panel */}
            <div className="card-gb relative overflow-hidden p-7 md:p-10">
              {/* Ambient red glow */}
              <div
                className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[#b83227]"
                style={{ opacity: 0.07, filter: "blur(52px)" }}
                aria-hidden="true"
              />

              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">
                  <span className="h-px w-5 bg-[#cfa45b]/55" />
                  Reserve Logic
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="live-badge inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#374151]">
                    Live
                  </span>
                </div>
              </div>

              <h2 className="mt-4 font-black leading-[1.14] text-[#f5efe5]"
                style={{ fontSize: "clamp(1.55rem, 2.8vw, 2.5rem)" }}
              >
                Underwriters earn when strategies behave.{" "}
                <span className="text-[#b83227]">Copiers recover when they break.</span>
              </h2>

              <p className="mt-5 max-w-[50ch] text-[0.9rem] font-medium leading-[1.88] text-[#6b7280]">
                The demo keeps the product honest: copy trading is simulated by verifiable results, while the insurance primitive is deployed with real contracts for subscriptions, policies, premium, reserves, attestations, and payout.
              </p>

              <div className="katana-rule mt-8" />

              {/* Bottom image strip */}
              <div className="mt-7 overflow-hidden">
                <div className="relative overflow-hidden" style={{ aspectRatio: "5/2" }}>
                  <Image
                    src="/assets/ronin-lunging-forward.jpg"
                    alt="Ronin execution"
                    fill
                    sizes="600px"
                    className="object-cover opacity-35 saturate-[0.45] grayscale"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#11141b] via-transparent to-[#11141b]" />
                  <p className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.24em] text-[#cfa45b]/48">
                    Ronin execution trigger
                  </p>
                </div>
              </div>
            </div>

            {/* Right: data rows */}
            <div className="flex flex-col gap-2.5">
              {[
                ["Risk score", "Premium multiplier", "#cfa45b"],
                ["Loss threshold", "Claim condition", "#b83227"],
                ["Reserved cover", "Locked pool liquidity", "#cfa45b"],
                ["Proof hash", "Audit handle", "#7f8794"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="card-gb-dark group flex items-center justify-between px-5 py-4 transition-all duration-200 hover:-translate-y-[1px]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color, opacity: 0.75 }}
                    />
                    <span className="text-sm font-bold text-[#4a5568]">{label}</span>
                  </div>
                  <span className="text-sm font-black text-[#d8d0c4]">{value}</span>
                </div>
              ))}

              {/* Musashi discipline image */}
              <div className="mt-1 overflow-hidden">
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <Image
                    src="/assets/musashi-self-portrait.jpg"
                    alt="Strategy discipline"
                    fill
                    sizes="360px"
                    className="object-cover opacity-35 saturate-[0.4] grayscale"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0c0f15]/80 via-transparent to-[#0c0f15]/80" />
                  <div className="absolute inset-0 border border-white/[0.06]" />
                  <p className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.22em] text-[#cfa45b]/48">
                    Musashi discipline
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── REVERSE DIAGONAL ────────────────────── */}
      <div className="relative z-10 -mt-1 overflow-hidden" style={{ height: "52px" }} aria-hidden="true">
        <div className="absolute inset-0 bg-[#07080c]" />
        <div
          className="absolute inset-0 bg-[#0c0f15]"
          style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
        />
      </div>

      {/* ── CTA ─────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-28 pt-6 md:px-8 md:pb-36">
        {/* Background armor */}
        <Image
          src="/assets/samurai-armor-met.jpg"
          alt="Enter the dojo"
          fill
          sizes="100vw"
          className="pointer-events-none absolute inset-0 object-cover object-center opacity-18 saturate-[0.35] grayscale"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_55%,rgba(184,50,39,0.16),transparent_58%),linear-gradient(to_bottom,#07080c_0%,rgba(7,8,12,0.55)_35%,rgba(7,8,12,0.55)_65%,#07080c_100%)]" />

        {/* Kanji 入 (enter) watermark */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 select-none font-black leading-none text-[#b83227]"
          style={{
            fontSize: "40vw",
            opacity: 0.038,
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        >
          入
        </div>

        <div className="relative mx-auto max-w-4xl py-20 text-center">
          <p className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.26em] text-[#cfa45b]">
            <span className="h-px w-10 bg-[#cfa45b]/48" />
            Enter the dojo
            <span className="h-px w-10 bg-[#cfa45b]/48" />
          </p>

          <h2 className="mx-auto mt-6 max-w-3xl font-black leading-[1.02] tracking-tight text-[#f5efe5]"
            style={{ fontSize: "clamp(2rem, 4.8vw, 3.8rem)" }}
          >
            Follow sealed AI strategies with a{" "}
            <span className="text-shimmer">protection layer already drawn.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-[44ch] text-[0.9rem] font-medium leading-[1.88] text-[#6b7280]">
            Marketplace, portfolio, underwriting, and claims — all wired to 0G contracts with TEE attestation.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              className="btn-shimmer rounded-full bg-[#b83227] px-9 py-4 text-sm font-black text-white shadow-[0_20px_52px_rgba(184,50,39,0.42)] hover:bg-[#c8382c] hover:shadow-[0_26px_64px_rgba(184,50,39,0.58)]"
              href="/marketplace"
            >
              Launch Insurai →
            </Link>
            <a
              className="rounded-full border border-white/12 bg-[#11141b]/55 px-7 py-4 text-sm font-black text-[#c7ccd6] backdrop-blur hover:border-[#cfa45b]/28 hover:text-[#f5efe5]"
              href="#stack"
            >
              Learn more
            </a>
          </div>

          {/* Decorative bottom lines */}
          <div className="mt-16 flex items-center justify-center gap-4 opacity-25">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#cfa45b]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#cfa45b]">侍</span>
            <span className="h-px flex-1 max-w-xs bg-[#cfa45b]/50" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#cfa45b]">侍</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#cfa45b]" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-5 py-7 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 flex-wrap">
          <Link className="flex items-center gap-2.5 hover:!transform-none" href="/">
            <div className="grid size-7 place-items-center rounded-full bg-[#b83227] text-[11px] font-black text-white shadow-[0_0_14px_rgba(184,50,39,0.4)]">
              IN
            </div>
            <span className="text-sm font-black text-[#cfa45b]">Insurai</span>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#2d3748]">
            Built on 0G · Verifiable AI Insurance · 2025
          </p>
          <div className="flex items-center gap-1.5">
            <span className="live-badge inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#2d3748]">Testnet</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
