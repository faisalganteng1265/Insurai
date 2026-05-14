const ERROR_MAP: [RegExp, string][] = [
  [/user rejected/i, 'Transaction rejected in wallet.'],
  [/insufficient funds/i, 'Insufficient 0G for gas. Top up your wallet.'],
  [/already claimed/i, 'You have already claimed from the faucet.'],
  [/provider cannot subscribe/i, 'Strategy providers cannot subscribe to their own strategy.'],
  [/not authorized/i, 'Your wallet is not authorized for this action.'],
  [/strategy not active/i, 'This strategy is no longer active.'],
  [/insufficient.*liquidity/i, 'Pool does not have enough liquidity for this coverage amount.'],
  [/no shares/i, 'You have no shares to withdraw.'],
  [/no pending fees/i, 'No fees to claim for this strategy.'],
  [/risk score must/i, 'Risk score must be between 1 and 100.'],
  [/strategy config hash required/i, 'Strategy configuration is invalid.'],
  [/could not be found|not processed/i, 'Transaction submitted — chain is slow, check the explorer for confirmation.'],
]

export function friendlyError(raw: string): string {
  for (const [pattern, message] of ERROR_MAP) {
    if (pattern.test(raw)) return message
  }
  if (raw.length > 100) return raw.slice(0, 100) + '…'
  return raw
}
