'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AppProvider, useApp } from '@/context/AppContext'
import { Web3Provider } from '@/context/Web3Provider'
import PolicyWizardModal from '@/components/PolicyWizardModal'

const TABS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/portfolio', label: 'My Portfolio' },
  { href: '/claims', label: 'Claim Center' },
  { href: '/provider', label: 'Provider' },
  { href: '/underwriter', label: 'Underwriter' },
]

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    walletConnected,
    activeRole,
    setRole,
    wizardOpen,
    policies,
    claimDemoUsdc,
    loading,
    lastError,
  } = useApp()

  const hasTriggeredClaim = policies.some(p => p.status === 'triggered')

  return (
    <div className="min-h-screen bg-[#f8f8fb]">
      <nav className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur shadow-[0_4px_20px_rgba(31,35,45,0.06)]">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="size-8 rounded-full bg-[#e94343] grid place-items-center text-xs font-black text-white">CG</div>
              <span className="text-base font-black text-[#d62f35] hidden sm:block">CareGuard</span>
            </Link>

            <div className="flex items-center gap-0.5 overflow-x-auto">
              {TABS.map(tab => {
                const isActive = pathname === tab.href
                const isClaimTab = tab.href === '/claims'
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`relative px-4 py-2 rounded-full text-sm font-black whitespace-nowrap transition-colors ${
                      isActive ? 'bg-[#ffeaea] text-[#d62f35]' : 'text-[#72727c] hover:text-[#d62f35]'
                    }`}
                  >
                    {tab.label}
                    {isClaimTab && hasTriggeredClaim && (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#e94343]" />
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {walletConnected && (
                <>
                  <button
                    onClick={claimDemoUsdc}
                    disabled={loading}
                    className="hidden md:block rounded-full border border-[#e5e5ed] bg-white px-3 py-2 text-xs font-black text-[#62626d] disabled:opacity-60"
                  >
                    Faucet dUSDC
                  </button>
                  <select
                    value={activeRole}
                    onChange={e => setRole(e.target.value as 'copier' | 'provider' | 'underwriter')}
                    className="hidden sm:block rounded-full border border-[#e5e5ed] bg-white px-3 py-2 text-xs font-black text-[#62626d]"
                  >
                    <option value="copier">Copier</option>
                    <option value="provider">Provider</option>
                    <option value="underwriter">Underwriter</option>
                  </select>
                </>
              )}
              {walletConnected ? (
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }} />
              ) : (
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }} />
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {lastError && (
          <div className="mb-5 rounded-2xl border border-[#ffc8c8] bg-[#ffeaea] px-4 py-3 text-sm font-bold text-[#b4232b]">
            {lastError.length > 180 ? `${lastError.slice(0, 180)}...` : lastError}
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
