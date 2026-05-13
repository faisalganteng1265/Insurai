'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AppProvider, useApp } from '@/context/AppContext'
import { Web3Provider } from '@/context/Web3Provider'
import PolicyWizardModal from '@/components/PolicyWizardModal'

const TABS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/portfolio',   label: 'Portfolio'   },
  { href: '/claims',      label: 'Claims'      },
  { href: '/provider',    label: 'Provider'    },
  { href: '/underwriter', label: 'Underwriter' },
  { href: '/partnership', label: 'Alliance'    },
]

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { walletConnected, activeRole, setRole, wizardOpen, policies, claimDemoUsdc, loading, lastError } = useApp()
  const hasTriggeredClaim = policies.some(p => p.status === 'triggered')

  return (
    <div className="min-h-screen bg-[#07080c] text-[#f5efe5]">

      {/* ── App Nav ─────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#07080c]/92 backdrop-blur-xl">
        {/* Top red line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#b83227]/50 to-transparent" />

        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="grid size-8 place-items-center rounded-full bg-[#b83227] text-xs font-black text-white shadow-[0_0_18px_rgba(184,50,39,0.45)]">
                IN
              </div>
              <span className="hidden text-sm font-black text-[#cfa45b] sm:block">Insurai</span>
            </Link>

            {/* Tabs */}
            <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto">
              {TABS.map(tab => {
                const isActive = pathname === tab.href
                const isClaims = tab.href === '/claims'
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`relative px-3 py-1.5 text-xs font-black whitespace-nowrap transition-all duration-200 lg:px-4 ${
                      isActive
                        ? 'text-[#cfa45b]'
                        : 'text-[#4a5568] hover:text-[#8a9099]'
                    }`}
                  >
                    {tab.label}
                    {/* Active underline */}
                    <span
                      className="absolute bottom-0 left-0 right-0 h-px transition-all duration-200"
                      style={{ background: isActive ? 'linear-gradient(90deg, transparent, #cfa45b, transparent)' : 'transparent' }}
                    />
                    {/* Claim dot */}
                    {isClaims && hasTriggeredClaim && (
                      <span className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-[#b83227]" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right controls */}
            <div className="flex shrink-0 items-center gap-2">
              {walletConnected && (
                <>
                  <button
                    onClick={claimDemoUsdc}
                    disabled={loading}
                    className="hidden rounded-full border border-[#1e2330] bg-[#0d1018] px-3 py-1.5 text-[10px] font-black text-[#4a5568] transition-colors hover:border-[#cfa45b]/20 hover:text-[#7f8794] disabled:opacity-40 md:block"
                  >
                    Faucet
                  </button>
                  <select
                    value={activeRole}
                    onChange={e => setRole(e.target.value as 'copier' | 'provider' | 'underwriter')}
                    className="hidden rounded-full border border-[#1e2330] bg-[#0d1018] px-3 py-1.5 text-[10px] font-black text-[#4a5568] outline-none sm:block"
                  >
                    <option value="copier">Copier</option>
                    <option value="provider">Provider</option>
                    <option value="underwriter">Underwriter</option>
                  </select>
                </>
              )}
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }}
              />
            </div>

          </div>
        </div>

        {/* Bottom border */}
        <div className="h-px bg-white/[0.05]" />
      </nav>

      {/* ── Content ─────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {lastError && (
          <div className="mb-6 border border-[#5c2a23] bg-[#1a0a08] px-4 py-3 text-sm font-bold text-[#c0393f]">
            {lastError.length > 180 ? `${lastError.slice(0, 180)}…` : lastError}
          </div>
        )}
        {children}
      </div>

      {wizardOpen && <PolicyWizardModal />}
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <AppProvider>
        <AppShell>{children}</AppShell>
      </AppProvider>
    </Web3Provider>
  )
}
