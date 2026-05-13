'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Strategy } from '@/lib/data'

type Step = 1 | 2 | 3 | 4 | 5

function StepProgress({ step }: { step: Step }) {
  if (step === 5) return null
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1 transition-all duration-300 ${s <= step ? 'bg-[#b83227] w-8' : 'bg-[#1e2330] w-4'}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#374151]">Step {step} / 4</span>
    </div>
  )
}

function Step1({ strategy, onNext, onClose }: { strategy: Strategy; onNext: () => void; onClose: () => void }) {
  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">Subscribe to Strategy</p>
          <h2 className="mt-1 text-2xl font-black text-[#f5efe5]">{strategy.name}</h2>
        </div>
        <button onClick={onClose} className="text-[#374151] transition-colors hover:text-[#f5efe5] text-xl leading-none">×</button>
      </div>

      <div className="mb-4 border border-[#1e2330] bg-[#0d1018] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className={`grid size-10 place-items-center ${strategy.accent} text-sm font-black text-white`}>✦</div>
          <span className="border border-[#cfa45b]/22 bg-[#251410] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#cfa45b]">TEE Verified</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#cfa45b] mb-1">{strategy.tag}</p>
        <p className="mb-4 text-sm font-medium leading-5 text-[#6b7280]">{strategy.description}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[['Sub fee', `$${strategy.subscriptionFeeUsdc.toLocaleString()}`], ['Risk', `${strategy.riskScore}/100`], ['Copiers', strategy.followers.toLocaleString()]].map(([l, v]) => (
            <div key={l} className="bg-[#07080c] p-2.5">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#374151]">{l}</p>
              <p className="mt-0.5 text-sm font-black text-[#cfa45b]">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 border border-[#1e2330] bg-[#0d1018] p-4">
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">TEE Agent ID</p>
        <p className="break-all font-mono text-xs font-black text-[#4a5568]">{strategy.teeAgentId}</p>
        <button className="mt-2 text-[10px] font-black text-[#cfa45b]/60 hover:text-[#cfa45b] transition-colors">View on 0G Explorer ↗</button>
      </div>

      <button onClick={onNext} className="btn-shimmer w-full bg-[#b83227] py-3.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.28)]">
        Next →
      </button>
    </div>
  )
}

function Step2({ capital, setCapital, onBack, onNext }: { capital: number; setCapital: (v: number) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">Capital Allocation</p>
        <h2 className="mt-1 text-2xl font-black text-[#f5efe5]">How much to allocate?</h2>
      </div>

      <div className="mb-4 border border-[#1e2330] bg-[#0d1018] p-4">
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Amount (USDC)</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-[#374151]">$</span>
          <input
            type="number"
            value={capital}
            onChange={e => setCapital(Number(e.target.value))}
            className="flex-1 bg-transparent text-2xl font-black text-[#f5efe5] outline-none"
          />
          <span className="text-sm font-black text-[#374151]">USDC</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[500, 1000, 5000].map(p => (
          <button
            key={p}
            onClick={() => setCapital(p)}
            className={`py-2.5 text-sm font-black transition-colors ${capital === p ? 'border border-[#cfa45b]/30 bg-[#251410] text-[#cfa45b]' : 'border border-[#1e2330] bg-[#0d1018] text-[#4a5568] hover:text-[#7f8794]'}`}
          >
            ${p.toLocaleString()}
          </button>
        ))}
      </div>

      <p className="mb-6 text-[10px] font-bold text-[#374151]">Available balance: 10,000 USDC</p>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-[#1e2330] py-3.5 text-sm font-black text-[#4a5568] hover:text-[#a7adb8] transition-colors">← Back</button>
        <button onClick={onNext} className="btn-shimmer flex-[2] bg-[#b83227] py-3.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.28)]">Next →</button>
      </div>
    </div>
  )
}

function Step3({ threshold, setThreshold, onBack, onNext }: { threshold: number; setThreshold: (v: number) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">Protection Threshold</p>
        <h2 className="mt-1 text-2xl font-black text-[#f5efe5]">Set your loss threshold</h2>
      </div>

      <div className="mb-4 border border-[#1e2330] bg-[#0d1018] p-5">
        <div className="mb-3 flex items-end justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Trigger if loss exceeds</p>
          <p className="text-3xl font-black text-[#cfa45b]">{threshold}%</p>
        </div>
        <input
          type="range"
          min={10}
          max={40}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className="w-full accent-[#b83227]"
        />
        <div className="mt-1.5 flex justify-between text-[9px] font-black text-[#374151]">
          <span>10% (safe)</span>
          <span>40% (aggressive)</span>
        </div>
      </div>

      <div className="mb-6 border border-[#1e2330] bg-[#0d1018] p-4">
        <p className="text-xs font-medium leading-5 text-[#4a5568]">
          Claim triggers automatically if strategy loses more than{' '}
          <span className="font-black text-[#cfa45b]">{threshold}%</span>{' '}
          of your allocated capital. No manual filing needed.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-[#1e2330] py-3.5 text-sm font-black text-[#4a5568] hover:text-[#a7adb8] transition-colors">← Back</button>
        <button onClick={onNext} className="btn-shimmer flex-[2] bg-[#b83227] py-3.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.28)]">Next →</button>
      </div>
    </div>
  )
}

function Step4({ strategy, capital, threshold, premium, loading, onBack, onConfirm }: { strategy: Strategy; capital: number; threshold: number; premium: number; loading: boolean; onBack: () => void; onConfirm: () => void }) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#cfa45b]">Review Policy</p>
        <h2 className="mt-1 text-2xl font-black text-[#f5efe5]">Confirm & sign</h2>
      </div>

      <div className="mb-4 divide-y divide-[#1e2330] border border-[#1e2330]">
        {[
          ['Strategy',       strategy.name],
          ['Coverage',       `$${capital.toLocaleString()} USDC`],
          ['Loss Threshold', `> ${threshold}%`],
          ['Premium Cost',   `$${premium} USDC`],
          ['Max Payout',     `$${capital.toLocaleString()} USDC`],
          ['Duration',       '30 days'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-bold text-[#4a5568]">{label}</span>
            <span className="text-sm font-black text-[#d8d0c4]">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 border border-[#22c55e]/20 bg-[#051209] p-4">
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#22c55e]">✓ Auto-Claim: ON</p>
        <p className="text-xs font-medium leading-5 text-[#22c55e]/60">
          Smart contract auto-triggers payout when TEE attestation confirms loss exceeds threshold. No manual filing.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-[#1e2330] py-3.5 text-sm font-black text-[#4a5568] hover:text-[#a7adb8] transition-colors">← Back</button>
        <button onClick={onConfirm} disabled={loading} className="btn-shimmer flex-[2] bg-[#b83227] py-3.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.28)] disabled:opacity-50">
          {loading ? 'Signing on-chain…' : 'Confirm & Sign →'}
        </button>
      </div>
    </div>
  )
}

function Step5({ policyId, onClose }: { policyId: string; onClose: () => void }) {
  return (
    <div className="py-6 text-center">
      {/* Kanji 護 as success icon */}
      <div
        className="mx-auto mb-4 select-none text-[5rem] font-black leading-none text-[#22c55e]"
        style={{ opacity: 0.55 }}
        aria-hidden="true"
      >護</div>
      <h2 className="text-2xl font-black text-[#f5efe5]">Policy Active</h2>
      <p className="mt-2 text-sm font-medium text-[#6b7280]">Your insurance policy is live. Auto-claim is watching.</p>

      <div className="mt-6 border border-[#1e2330] bg-[#0d1018] p-4 text-left">
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#374151]">Policy ID</p>
        <p className="font-mono text-sm font-black text-[#d8d0c4]">{policyId}</p>
      </div>

      <button onClick={onClose} className="btn-shimmer mt-5 w-full bg-[#b83227] py-3.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(184,50,39,0.28)]">
        View in Portfolio
      </button>
    </div>
  )
}

export default function PolicyWizardModal() {
  const { selectedStrategy, closeWizard, createPolicyOnChain, loading } = useApp()
  const [step, setStep]           = useState<Step>(1)
  const [capital, setCapital]     = useState(1000)
  const [threshold, setThreshold] = useState(20)
  const [newPolicyId, setNewPolicyId] = useState('')

  if (!selectedStrategy) return null

  const riskMultiplier = 100 + selectedStrategy.riskScore
  const discountBps    = ((threshold * 100 - 500) * 10_000) / (5000 - 500)
  const thresholdFactor = 10_000 - (discountBps * 45) / 100
  const premium = Math.max(1, Math.round((capital * 41 * riskMultiplier * thresholdFactor) / (10_000 * 100 * 10_000)))

  async function handleConfirm() {
    try {
      const policy = await createPolicyOnChain({ strategy: selectedStrategy!, coverage: capital, threshold })
      setNewPolicyId(policy.id)
      setStep(5)
    } catch { /* AppContext surfaces the error in the shell alert */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-[#1e2330] bg-[#0d1018] p-7 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        {/* Modal top red line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#b83227]/50 to-transparent" />
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
