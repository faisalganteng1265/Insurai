'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Strategy } from '@/lib/data'

type Step = 1 | 2 | 3 | 4 | 5

function StepProgress({ step }: { step: Step }) {
  if (step === 5) return null
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-[#e94343] w-8' : 'bg-[#ebebf0] w-4'}`}
          />
        ))}
      </div>
      <span className="text-xs font-black text-[#9b9ba5]">Step {step} of 4</span>
    </div>
  )
}

function Step1({ strategy, onNext, onClose }: { strategy: Strategy; onNext: () => void; onClose: () => void }) {
  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Subscribe to Strategy</p>
          <h2 className="mt-1 text-2xl font-black text-[#24242b]">{strategy.name}</h2>
        </div>
        <button onClick={onClose} className="text-[#9b9ba5] hover:text-[#2f3037] text-xl leading-none">×</button>
      </div>

      <div className="rounded-2xl border border-[#ebebf0] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`size-10 rounded-full ${strategy.accent} grid place-items-center text-sm font-black text-white`}>✦</div>
          <span className="rounded-full bg-[#eaf7fb] px-3 py-1.5 text-[10px] font-black text-[#308ca0]">TEE Verified</span>
        </div>
        <p className="text-xs font-black uppercase text-[#d62f35] mb-1">{strategy.tag}</p>
        <p className="text-sm text-[#74747f] leading-5 mb-4">{strategy.description}</p>
        <div className="grid grid-cols-3 gap-2">
          {[['Sub fee', `$${strategy.subscriptionFeeUsdc.toLocaleString()}`], ['Risk', `${strategy.riskScore}/100`], ['Copiers', strategy.followers.toLocaleString()]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-[#f4f4f7] p-3">
              <p className="text-[10px] font-black uppercase text-[#9b9ba5]">{l}</p>
              <p className="mt-0.5 text-base font-black text-[#d62f35]">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#ebebf0] p-4 mb-6">
        <p className="text-[10px] font-black uppercase text-[#9b9ba5] mb-1">TEE Agent ID</p>
        <p className="break-all font-mono text-xs font-black text-[#3b3b45]">{strategy.teeAgentId}</p>
        <button className="mt-2 text-xs font-black text-[#308ca0]">View on 0G Explorer ↗</button>
      </div>

      <button onClick={onNext} className="w-full rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)]">
        Next →
      </button>
    </div>
  )
}

function Step2({ capital, setCapital, onBack, onNext }: { capital: number; setCapital: (v: number) => void; onBack: () => void; onNext: () => void }) {
  const presets = [500, 1000, 5000]
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Capital Allocation</p>
        <h2 className="mt-1 text-2xl font-black text-[#24242b]">How much to allocate?</h2>
      </div>

      <div className="mb-4 rounded-2xl border border-[#ebebf0] p-4">
        <p className="text-[10px] font-black uppercase text-[#9b9ba5] mb-2">Amount (USDC)</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-[#9b9ba5]">$</span>
          <input
            type="number"
            value={capital}
            onChange={e => setCapital(Number(e.target.value))}
            className="flex-1 text-2xl font-black text-[#24242b] outline-none bg-transparent"
          />
          <span className="text-sm font-black text-[#9b9ba5]">USDC</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setCapital(p)}
            className={`rounded-2xl py-3 text-sm font-black transition-colors ${capital === p ? 'bg-[#ffeaea] text-[#d62f35]' : 'bg-[#f4f4f7] text-[#62626d]'}`}
          >
            ${p.toLocaleString()}
          </button>
        ))}
      </div>

      <p className="text-xs font-bold text-[#9b9ba5] mb-6">Available balance: 10,000 USDC</p>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-full border border-[#dedee6] py-4 text-sm font-black text-[#62626d]">← Back</button>
        <button onClick={onNext} className="flex-[2] rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)]">Next →</button>
      </div>
    </div>
  )
}

function Step3({ threshold, setThreshold, onBack, onNext }: { threshold: number; setThreshold: (v: number) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Protection Threshold</p>
        <h2 className="mt-1 text-2xl font-black text-[#24242b]">Set your loss threshold</h2>
      </div>

      <div className="rounded-2xl border border-[#ebebf0] p-5 mb-4">
        <div className="flex items-end justify-between mb-3">
          <p className="text-xs font-black uppercase text-[#9b9ba5]">Trigger if loss exceeds</p>
          <p className="text-3xl font-black text-[#d62f35]">{threshold}%</p>
        </div>
        <input
          type="range"
          min={10}
          max={40}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className="w-full accent-[#d71920]"
        />
        <div className="flex justify-between text-[10px] font-black text-[#9b9ba5] mt-1">
          <span>10% (safe)</span>
          <span>40% (aggressive)</span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#f4f4f7] p-4 mb-6">
        <p className="text-xs font-bold text-[#74747f] leading-5">
          Claim triggers automatically if strategy loses more than <span className="font-black text-[#d62f35]">{threshold}%</span> of your allocated capital in any single reporting window. No manual filing needed.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-full border border-[#dedee6] py-4 text-sm font-black text-[#62626d]">← Back</button>
        <button onClick={onNext} className="flex-[2] rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)]">Next →</button>
      </div>
    </div>
  )
}

function Step4({ strategy, capital, threshold, premium, loading, onBack, onConfirm }: { strategy: Strategy; capital: number; threshold: number; premium: number; loading: boolean; onBack: () => void; onConfirm: () => void }) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#d62f35]">Review Policy</p>
        <h2 className="mt-1 text-2xl font-black text-[#24242b]">Confirm & sign</h2>
      </div>

      <div className="rounded-2xl border border-[#ebebf0] divide-y divide-[#ebebf0] mb-4">
        {[
          ['Strategy', strategy.name],
          ['Coverage', `$${capital.toLocaleString()} USDC`],
          ['Loss Threshold', `> ${threshold}%`],
          ['Premium Cost', `$${premium} USDC`],
          ['Max Payout', `$${capital.toLocaleString()} USDC`],
          ['Duration', '30 days'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-bold text-[#74747f]">{label}</span>
            <span className="text-sm font-black text-[#24242b]">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#dff8ee] border border-[#b7ecd6] p-4 mb-6">
        <p className="text-xs font-black text-[#11875d] mb-1">✓ Auto-Claim: ON</p>
        <p className="text-xs font-bold text-[#2a6e4a] leading-5">
          Smart contract auto-triggers payout when TEE attestation confirms loss exceeds threshold. No manual filing.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-full border border-[#dedee6] py-4 text-sm font-black text-[#62626d]">← Back</button>
        <button onClick={onConfirm} disabled={loading} className="flex-[2] rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)] disabled:opacity-60">
          {loading ? 'Signing on-chain...' : 'Confirm & Sign →'}
        </button>
      </div>
    </div>
  )
}

function Step5({ policyId, onClose }: { policyId: string; onClose: () => void }) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto mb-6 size-20 rounded-full bg-[#dff8ee] grid place-items-center">
        <span className="text-4xl">✓</span>
      </div>
      <h2 className="text-2xl font-black text-[#24242b] mb-2">Policy Active</h2>
      <p className="text-sm font-medium text-[#74747f] mb-6">Your insurance policy is live. Auto-claim is watching.</p>

      <div className="rounded-2xl bg-[#f4f4f7] p-4 mb-6 text-left">
        <p className="text-[10px] font-black uppercase text-[#9b9ba5] mb-1">Policy ID</p>
        <p className="font-mono text-sm font-black text-[#3b3b45]">{policyId}</p>
      </div>

      <button onClick={onClose} className="w-full rounded-full bg-[#d71920] py-4 text-sm font-black text-white shadow-[0_14px_24px_rgba(215,25,32,0.2)]">
        View in Portfolio
      </button>
    </div>
  )
}

export default function PolicyWizardModal() {
  const { selectedStrategy, closeWizard, createPolicyOnChain, loading } = useApp()
  const [step, setStep] = useState<Step>(1)
  const [capital, setCapital] = useState(1000)
  const [threshold, setThreshold] = useState(20)
  const [newPolicyId, setNewPolicyId] = useState('')

  if (!selectedStrategy) return null

  const riskMultiplier = 100 + selectedStrategy.riskScore
  const discountBps = ((threshold * 100 - 500) * 10_000) / (5000 - 500)
  const thresholdFactor = 10_000 - (discountBps * 45) / 100
  const premium = Math.max(1, Math.round((capital * 41 * riskMultiplier * thresholdFactor) / (10_000 * 100 * 10_000)))

  async function handleConfirm() {
    try {
      const policy = await createPolicyOnChain({
        strategy: selectedStrategy!,
        coverage: capital,
        threshold,
      })
      setNewPolicyId(policy.id)
      setStep(5)
    } catch {
      // AppContext surfaces the wallet or contract error in the shell alert.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-[0_40px_100px_rgba(31,35,45,0.2)]">
        <StepProgress step={step} />
        {step === 1 && <Step1 strategy={selectedStrategy} onNext={() => setStep(2)} onClose={closeWizard} />}
        {step === 2 && <Step2 capital={capital} setCapital={setCapital} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Step3 threshold={threshold} setThreshold={setThreshold} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <Step4 strategy={selectedStrategy} capital={capital} threshold={threshold} premium={premium} loading={loading} onBack={() => setStep(3)} onConfirm={handleConfirm} />}
        {step === 5 && <Step5 policyId={newPolicyId} onClose={closeWizard} />}
      </div>
    </div>
  )
}
