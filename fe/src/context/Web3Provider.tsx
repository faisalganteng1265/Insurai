'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { insuraiChain } from '@/lib/chain'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'insurai-local-demo'

const config = getDefaultConfig({
  appName: 'Insurai',
  projectId,
  chains: [insuraiChain],
  ssr: true,
})

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
