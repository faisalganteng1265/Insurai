'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 px-5 py-4 transition-all duration-500 md:px-8"
      style={{
        background: scrolled ? 'rgba(7,8,12,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      {/* Top red line — only when scrolled */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#b83227]/55 to-transparent transition-opacity duration-500"
        style={{ opacity: scrolled ? 1 : 0 }}
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        <Link className="flex items-center gap-3 hover:!transform-none" href="/">
          <div className="relative grid size-10 place-items-center">
            <Image
              src="/assets/logoinsurai-transparent.png"
              alt="Insurai logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain drop-shadow-[0_0_18px_rgba(184,50,39,0.46)]"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-wide text-[#cfa45b]">Insurai</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-[#4a5568]">0G Protocol</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-black text-[#7f8794] md:flex">
          {[['Flow', '#stack'], ['Protocol', '#protocol'], ['Reserve', '#reserve']].map(
            ([label, href]) => (
              <a key={label} className="nav-link hover:text-[#cfa45b]" href={href}>
                {label}
              </a>
            ),
          )}
        </div>

        <Link
          className="btn-shimmer rounded-full bg-[#b83227] px-5 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_rgba(184,50,39,0.38)] hover:bg-[#c8382c] hover:shadow-[0_16px_36px_rgba(184,50,39,0.52)]"
          href="/marketplace"
        >
          Launch App →
        </Link>
      </div>
    </nav>
  )
}
