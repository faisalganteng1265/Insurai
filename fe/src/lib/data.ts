export type Strategy = {
  id: string
  contractId: number
  name: string
  tag: string
  description: string
  subscriptionFeeUsdc: number
  riskScore: number
  risk: 'Low' | 'Medium' | 'High'
  followers: number
  proof: string
  teeAgentId: string
  strategyStorageRoot: string
  strategyConfigHash: string
  accent: string
  active: boolean
  createdAt?: string
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'stablecare-alpha',
    contractId: 1,
    name: 'Stablecare Alpha',
    tag: 'Low-volatility yield agent',
    description:
      'A sealed AI strategy focused on stablecoin yield rotation with automatic cover for drawdowns above 12%.',
    subscriptionFeeUsdc: 10,
    riskScore: 20,
    risk: 'Low',
    followers: 0,
    proof: '0x',
    teeAgentId: '0x',
    strategyStorageRoot: '0x',
    strategyConfigHash: '0x',
    accent: 'bg-[#e94343]',
    active: true,
  },
  {
    id: 'pulse-momentum',
    contractId: 2,
    name: 'Pulse Momentum',
    tag: 'Adaptive momentum agent',
    description:
      'Tracks market regime shifts and mirrors positions only when verifiable execution confidence is above threshold.',
    subscriptionFeeUsdc: 10,
    riskScore: 40,
    risk: 'Medium',
    followers: 0,
    proof: '0x',
    teeAgentId: '0x',
    strategyStorageRoot: '0x',
    strategyConfigHash: '0x',
    accent: 'bg-[#42bfd1]',
    active: true,
  },
  {
    id: 'liquid-wellness',
    contractId: 3,
    name: 'Liquid Wellness',
    tag: 'Liquidity routing agent',
    description:
      'Moves copier capital through audited liquidity venues while claim logic watches loss triggers in real time.',
    subscriptionFeeUsdc: 10,
    riskScore: 25,
    risk: 'Low',
    followers: 0,
    proof: '0x',
    teeAgentId: '0x',
    strategyStorageRoot: '0x',
    strategyConfigHash: '0x',
    accent: 'bg-[#aeb5bd]',
    active: true,
  },
]
