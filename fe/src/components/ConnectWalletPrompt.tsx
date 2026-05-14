'use client'

export default function ConnectWalletPrompt({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="mb-6 select-none text-[5rem] font-black leading-none text-white"
        style={{ opacity: 0.06 }}
        aria-hidden="true"
      >鍵</div>
      <p className="text-base font-black text-[#374151]">Wallet not connected</p>
      <p className="mt-2 max-w-xs text-sm font-medium text-[#2d3748]">
        {message ?? 'Connect your wallet using the button in the top right to continue.'}
      </p>
    </div>
  )
}
