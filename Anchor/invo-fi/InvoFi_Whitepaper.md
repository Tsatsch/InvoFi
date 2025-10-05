# InvoFi: Instant Liquidity for Real-World Invoices on Solana

## 1) Abstract
InvoFi is a Solana-based protocol that converts verified invoices into on-chain assets and finances them instantly via pooled liquidity. Capital flows through a program-controlled escrow (PDA), while repayments from debtors (fiat or on-chain) are routed back into the same escrow and distributed to liquidity providers (LPs). The MVP prioritizes risk discipline and transparency over speculative APY, enabling MSMEs to bridge working-capital gaps and LPs to earn yield from short-dated, real-world receivables.

## 2) Problem
- MSMEs chronically face working-capital gaps (30–90 days) between delivery and payment.
- Traditional invoice financing is slow, manual, opaque, and expensive.
- DeFi yields often rely on reflexive tokenomics instead of real cash flows and lack transparent, enforceable repayment paths.

## 3) Solution
- Tokenize invoices (metadata + legal assignment reference) and finance them at a discount (Purchase Price < Face Value).
- Program-controlled escrow (PDA) collects contributions, releases funds to issuers only at 100% funding, and enforces on-chain repayment distribution.
- Clear risk rails: advance rate cap, issuer first‑loss stake, debtor confirmation, reserve fund, concentration limits, transparent late fees and default workflow.

## 4) Protocol Architecture (MVP)
### 4.1 Accounts
- InvoiceAccount (PDA): issuer, face_value, advance_rate, purchase_price, due_ts, grace_days, status, issuer_stake, funded_amount, reserve_pointer, risk_tags.
- ContributionAccount (PDA per LP): invoice_ref, lp, amount.
- ReserveAccount (PDA): pooled reserve for partial default coverage (optional in MVP).

### 4.2 Core Instructions
- list_invoice(): create InvoiceAccount, set terms (advance_rate, purchase_price), lock issuer_stake.
- contribute(amount): accept LP funds into Invoice PDA; write ContributionAccount; flip status to Financed at 100%.
- claim_funding(): release purchase_price to issuer once Financed.
- repay_and_distribute(): accept repayment (USDC/SOL or oracle-verified fiat), distribute pro‑rata to LPs; return issuer_stake; mark Repaid.
- mark_past_due()/mark_default(): start late-fee accrual; slash issuer_stake; waterfall from reserve; queue recoveries.

### 4.3 Fiat-to-Chain Bridge
- Legal: assignment/notice to debtor mandates payment to designated account.
- Fiat rails: virtual IBAN/ABA by PSP; webhook → oracle attestation → on-chain event → distribution.
- On-chain alternative: debtor pays in USDC/SOL to Invoice PDA allowlist.

## 5) Risk Framework (MVP Defaults)
- Advance rate: 70–85% (buffer protects LPs).
- Issuer first‑loss stake: 5% of purchase_price (slashed on default).
- Debtor confirmation: notice of assignment + allowlisted payer; or PSP/oracle attestation.
- Late fees: e.g., 20–30% APR during grace; after grace → default.
- Default waterfall: penalties → slash issuer_stake → reserve fund → junior tranche (future) → senior LPs.
- Concentration limits (enforced at contribute):
  - Per issuer ≤10% pool, per debtor ≤5%, sector ≤30%, tenor >90d ≤X%, per LP ≤10% per invoice.
- Transparency: on-chain status events (Created, Financed, PastDue, GraceStart/End, Defaulted, RecoveryPayment, Repaid).

## 6) Pricing and Fair Price Discovery
- MVP pricing: fixed discount set at listing (based on risk and time to due).
- Optional V2: discrete early-bird tiers (e.g., 15%/12%/10% discount bands as fill% increases) to reward early liquidity without gambling dynamics.
- Why fair price discovery matters:
  - Prevents whale capture and manipulative starts.
  - Broad participation → lower cost of capital for issuers, healthier secondary market, sustainable yields for LPs.

## 7) Social Mechanics Without Gambling
- Early-bird but bounded: per-wallet caps on early tier (≤1% of purchase_price), per-invoice cap (≤10% LP), per-tx cap; randomized start or commit–reveal; minimum hold (24–72h) before secondary sale of shares.
- Reputation loops: issuer on‑time streaks lower future discounts; LP badges for early fills and successful cohorts; public leaderboards by realized net IRR.
- Secondary market: invoice-share tokens tradeable (post-hold), enabling exit and arbitrage; anti-wash filters and daily volume caps.
- MEV fairness: priority fees permitted, but mitigated by commit–reveal/randomized windows + caps to prevent toxic sniping.
- “Meme” energy for invoices:
  - Narrative: verified sectors, real brand names (where permitted), impact tags (SME growth, green projects), transparent timers and fill bars.
  - Seasonal campaigns: point multipliers and fee rebates funded by protocol fees tied to verified on-time repayments.

## 8) Economics
- Issuer: receives purchase_price upfront; pays face_value at due; effective cost = discount + protocol fees + late fees (if any).
- LP: contributes at purchase_price; receives pro‑rata face_value + late fees on time/default scenarios; IRR driven by discount and time-to-cash.
- Protocol fees: origination (e.g., 0.5–1.0%), servicing (bps on outstanding), late-fee share; part funds reserve/insurance.
- Reserve/insurance: protocol reserve grows from fees; optional trade credit insurance for pools or specific invoices (third-party insurers).

## 9) Compliance Posture
### 9.1 Best‑Effort (Pre‑License)
- KYC/KYB/AML via provider; geo‑fencing; sanctions screening.
- Partnered PSP/custodian rails; segregated client funds; attestations.
- Clear disclosures; risk ratings; concentration policies and auditability.

### 9.2 Cost‑Sensitive Jurisdiction Path
- Entity for protocol IP (e.g., Delaware/BVI/Cayman); payments via EU/UK/ADGM PSP partners; use agent/appointed‑representative frameworks where available; apply to regulatory sandboxes later.
- Swiss DLT (robust, costly) as a phase‑2 option; start with partner‑based fiat rails.

## 10) Implementation Plan (Solana/Anchor)
### 10.1 Phase 1 (MVP, Devnet/Mainnet‑beta small cap)
- Fixed-discount pricing; per-invoice PDA escrow; ContributionAccount per LP.
- Issuer stake lock/slash; allowlist debtor or PSP oracle webhook.
- Events: Created, Financed, Repaid, PastDue, Defaulted, RecoveryPayment.
- Frontend: Marketplace, Invoice Details, LP Dashboard, Issuer Console.

### 10.2 Phase 2
- Early-bird tiers; secondary market for shares; reserve fund; tranche support (senior/junior).
- Compliance upgrades (additional PSPs, sandbox entry).
- Expanded concentration/risk configs via multisig governance.

### 10.3 Phase 3
- Insurance integrations; advanced oracles; cross-border settlements; standardized legal wrappers by region.

## 11) KPIs
- Default rate <1–2% by amount; avg time-to-repay <60–90 days; recovery time <30 days.
- Repeat issuers >50%; concentration within limits; transparent weekly cohort reporting.

## 12) Grant Use (example $5k)
- Smart-contract audit (targeted scope) — $2.5k.
- Scalability refactor (per-contribution accounts, reserve logic) — $1.5k.
- UX polish (Issuer/LP dashboards, invoice details, oracle events UI) — $1.0k.

## 13) Why Now on Solana
- Low-latency, low-fee settlement fits small ticket, high-frequency RWA financing.
- Mature wallet stack and MEV infra (priority fees) with fairness controls.
- Strong ecosystem support and grants to accelerate RWA adoption.

## Appendix: FAQ
**Why cap early tiers if we want fast liquidity?**
Caps prevent whale capture, distribute access, reduce concentration risk, and still allow fast fills via many participants; this strengthens secondary demand and retention.

**“Meme” effect without gambling?**
Social proof from real repayments, issuer streaks, visible progress meters, and leaderboards; lightweight incentives (points/fee rebates) tied to verified, non-random outcomes.

**Price discovery and fairness?**
Fair discovery yields stable costs for issuers, a broader LP base, and less manipulation—leading to sustainable growth instead of one-off spikes.


