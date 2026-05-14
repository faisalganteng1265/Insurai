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

export const STRATEGY_ACCENTS = [
  'bg-[#b83227]',
  'bg-[#42bfd1]',
  'bg-[#aeb5bd]',
  'bg-[#22c55e]',
  'bg-[#9b59b6]',
  'bg-[#e67e22]',
]
