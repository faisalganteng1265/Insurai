**📋 IDE 2 — Copy Trading Safety Net**

**Track:** 3 (Agentic Economy — Verifiable Finance)

---

**🎯 Core idea**

Kita build insurance protocol khusus untuk AI copy trading di 0G. Bayangkan DeFi copy trading yang selama ini stuck di niche karena user takut AI-nya ngaco — kita kasih safety net yang bikin adoption-nya scale.

**Hook 1-kalimat:**
"Copy trading tanpa takut: safety net pertama untuk AI trading strategies, dibangun di atas verifiable inference 0G."

---

**🧩 Kenapa narrative-nya kuat**

Chain logic-nya begini:

- Copy trading di DeFi selama ini stuck karena dilemma: trader nggak mau expose strategy (takut di-copy), user nggak mau follow black box (nggak bisa verify)
- 0G memecahkan dilemma ini lewat TEE inference — strategy dieksekusi verifiable tanpa exposed
- Tapi teknologi aja nggak cukup untuk mass adoption, user tetap butuh safety net
- Insurance = catalyst yang unlock mass adoption

Jadi posisinya: **insurance adalah natural missing piece untuk AI copy trading, dan AI copy trading adalah natural use case untuk 0G.**

---

**⚙️ Core mechanic**

Tiga aktor:

**Strategy Provider (AI trader)**
- Deploy AI trading strategy sebagai sealed agent di 0G Compute
- Strategy-nya encrypted di 0G Storage, dijalankan di TEE
- Earn subscription fee dari followers

**Copier (follower)**
- Subscribe ke strategy, alokasikan capital
- Beli insurance cover dengan bayar premium
- Wallet auto-execute trade yang sama proporsional
- Protected kalau strategy loss melebihi threshold

**Underwriter**
- Deposit USDC ke insurance pool
- Earn premium yield dari policies aktif
- Berisiko kena claim saat strategy ngaco

---

**🔄 Flow utama**

1. Trader deploy AI strategy di 0G Compute (TEE-sealed, prompt/logic invisible)
2. Copier subscribe + beli insurance cover
3. Saat strategy execute trade → TEE signed attestation
4. Copier's wallet auto-replicate trade
5. Kalau loss > threshold (measurable dari attestation on-chain), claim otomatis trigger
6. Payout dari underwriter pool ke copier

---

**💰 Number-go-up dynamics**

- Strategy bagus → premium turun → lebih banyak copier → trader untung dari subscription fee
- Underwriter earn premium dari pool yang makin besar
- Market self-regulate: strategy buruk → premium naik → signal ke user

Ini flywheel yang natural — semua aktor menang saat system jalan baik.

---

**🏗️ Arsitektur teknis (4 komponen 0G esensial)**

- **0G Compute + TEE** → eksekusi AI strategy yang invisible tapi verifiable
- **0G Chain** → smart contract insurance pool, policies, auto-claim
- **0G Storage** → archive trade history + attestations (audit trail)
- **0G Explorer** → on-chain verifiable track record untuk strategy

Kalau dicabut salah satu, primitive ini pecah. Integration depth auto-maksimal.

---

**🎯 Kenapa "obvious tapi belum ada"**

- DeFi insurance (Nexus Mutual, InsurAce): ada
- AI trading agents di crypto: ada
- DeFi copy trading (Gains, dYdX vaults, etc): ada
- **Insurance spesifik untuk AI copy trading strategy**: **belum ada di 0G ekosistem, belum ada submission hackathon sebelumnya**

Kombinasi tiga primitive ini baru feasible sekarang karena TEE inference baru matured.

