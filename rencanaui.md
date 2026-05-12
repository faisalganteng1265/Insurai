# Rencana UI — IDE 2 Copy Trading Safety Net

## Prioritas MVP (untuk hackathon demo)

---

### 1. Landing / Dashboard (Prioritas 1)
**Tujuan:** First screen langsung terasa sebagai app aktif: tunjukkan value proposition, statistik global, health insurance pool, dan entry point ke flow utama.

Konten:
- Tagline: "Copy trading tanpa takut — safety net pertama untuk AI trading strategies di 0G"
- Stats global: Total Capital Insured, Active Policies, Pool TVL, Premium Yield
- Top 3 performing strategies (preview card)
- CTA: "Browse Strategies" dan "Become Underwriter"
- Risk index / pool health indicator
- Recent auto-claims: strategi, loss trigger, payout status

---

### 2. Strategy Marketplace (Prioritas 2)
**Tujuan:** Tampilkan semua AI strategies yang bisa di-copy, dengan bukti verifiable.

Konten:
- List/grid card tiap strategy
- Per card: nama strategy, annualized return, max drawdown, jumlah followers, subscription fee, current premium rate, risk score, TEE attestation badge
- Verifiable proof: TEE attestation ID, proof hash, link "View on 0G Explorer"
- Premium signal: premium trend naik/turun sebagai indikator risk pricing
- Filter: by risk level, asset class, performance, premium rate, TEE verified
- Search bar
- Tombol per card: "Subscribe + Buy Insurance"

---

### 3. Insurance Policy Wizard (Prioritas 3)
**Tujuan:** Flow utama copier — subscribe ke strategy dan beli insurance dalam satu flow.

Step-by-step:
1. Pilih strategy (atau langsung dari marketplace)
2. Set alokasi capital
3. Pilih coverage threshold (contoh: cover loss > 20%)
4. Preview premium, estimasi payout, dan auto-claim trigger
5. Konfirmasi & sign transaction
6. Tampilkan policy aktif dengan proof hash dan status attestation

---

### 4. My Portfolio — Copier (Prioritas 3)
**Tujuan:** Copier bisa monitor subscription, policy, P&L, dan status auto-claim.

Konten:
- Active subscriptions: strategy name, capital allocated, P&L, status
- Active insurance policies: coverage amount, premium paid, threshold, auto-claim status
- Trade history yang di-replicate, lengkap dengan attestation proof per trade
- Claim eligibility: Not Triggered / Triggered / Verified / Paid
- Tombol "View Claim Proof" kalau loss sudah melewati threshold

---

### 5. Claim / Proof Center (Prioritas 4)
**Tujuan:** Bukan tempat user manual file claim, tapi pusat transparansi untuk auto-claim yang dipicu oleh threshold loss dan diverifikasi lewat TEE attestation.

Konten:
- List auto-claims: Triggered, Verified, Paid
- Detail per klaim: strategy, policy ID, loss amount, coverage amount, payout amount
- Verifiable proof: TEE attestation ID, proof hash, 0G Storage record, link "View on 0G Explorer"
- Status tracker: Loss Triggered → Attestation Verified → Payout Executed
- Tombol utama: "View Proof" dan "View Transaction"

---

### 6. Strategy Provider Dashboard (Prioritas 5 — bisa placeholder)
**Tujuan:** Trader deploy dan manage AI strategy.

Konten:
- Form deploy strategy ke 0G Compute
- Analytics: jumlah copier, subscription revenue, performance chart
- Attestation history: TEE attestation ID, proof hash, 0G Storage record
- Premium impact: bagaimana performa strategy memengaruhi premium rate

---

### 7. Underwriter Pool (Prioritas 5 — bisa placeholder)
**Tujuan:** Underwriter deposit dan monitor yield.

Konten:
- Deposit / withdraw USDC ke insurance pool
- Current yield APR, pool utilization, exposure risk, pool health
- Payout history (klaim yang sudah dibayar dari pool)
- Active exposure by strategy dan expected claim risk

---

## Urutan Build

| Urutan | Halaman | Status |
|--------|---------|--------|
| 1 | Landing / Dashboard | Belum |
| 2 | Strategy Marketplace | Belum |
| 3 | Insurance Policy Wizard | Belum |
| 4 | My Portfolio (Copier) | Belum |
| 5 | Claim / Proof Center | Belum |
| 6 | Strategy Provider Dashboard | Belum |
| 7 | Underwriter Pool | Belum |
