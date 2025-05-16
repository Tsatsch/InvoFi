# InvoFi

<img src="invofi/public/invofi.svg" alt="InvoFi Logo" width="50" align="left" style="margin-right: 10px;">

## What is InvoFi?
InvoFi is a decentralized platform that transforms unpaid invoices into blockchain-based digital assets. Verified invoices are tokenized as NFTs and instantly financed through a decentralized liquidity pool powered by an Automated Market Maker (AMM) — enabling businesses to unlock working capital in minutes, not months.

Instead of relying on banks or waiting for slow invoice payments, businesses upload verified receivables and receive immediate funding at transparent, market-driven rates. InvoFi reimagines invoice factoring through a **DeFi-native, programmable**, and **fraud-resistant** protocol.

## 🚀 Why We Built InvoFi

### Traditional Invoice Financing

The problems we're solving:
- Slow and manual processes
- Opaque pricing structures
- Designed for large corporations
- Excludes many legitimate businesses

### InvoFi

Our key features:
- Instant liquidity through AMM
- Decentralized capital access
- Fraud-resistant verification
- Transparent & trustless system

## 🔐 How We Verify Invoices

Trust is essential for financing real-world assets. InvoFi ensures that every invoice entering the protocol is legitimate through a 3-step verification process:

1. **On-chain debtor confirmation**
2. **Automated checks using our internal engine**
3. **Decentralized manual review**

For full details, see [Invoice Verification Process](docs/invoice_verification.md).

## ⚙️ AMM-Powered Instant Financing
InvoFi uses a custom Automated Market Maker (AMM) to instantly price and finance tokenized invoices. The pricing is inherited based on multiple factors such as risk score, payment due time etc.

Each verified invoice is matched with a single LP, while capital is fractionally sourced from a decentralized pool, enabling real-time, market-driven financing without intermediaries.

For more details on how the AMM works, see [How the AMM Works](docs/how_the_amm_works.md).

## 🏦 Why This Makes Sense for Banks

InvoFi opens a new, DeFi-native channel for financing real-world receivables and creates multiple roles where financial institutions can participate and profit.

For more details on why this makes sense for banks, check [Why This Makes Sense for Banks](docs/why_this_makes_sense_for_banks.md).


## 🧱 Tech Stack & Implementation

InvoFi is engineered as a modular, DeFi-native protocol designed for scale, trust, and performance. The platform leverages Solana’s speed, modern smart contract frameworks, and decentralized storage to securely tokenize and finance invoices.

### Core Technologies

- **Blockchain:** [Solana](https://solana.com) — high throughput, low-cost transactions.
- **Smart Contracts:** [Anchor Framework](https://book.anchor-lang.com/) — secure, fast Solana smart contract development.
- **Invoice NFTs:** [MPL Core (Metaplex)](https://docs.metaplex.com/) — flexible digital asset standard for invoices.
- **Off-chain Storage:** [Supabase](https://supabase.com) — PostgreSQL-powered backend for user data and mutable invoice states.
- **Immutable Storage:** [Arweave](https://www.arweave.org) via [Irys](https://irys.xyz) — decentralized, permanent invoice PDF and metadata hosting.
- **Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn UI — modern and composable frontend architecture.
- **Wallet Support:** `@solana/wallet-adapter-react` — seamless multi-wallet integration (Phantom, Solflare, etc.).
- **JS/TS Dev Tools:** [UMI (Metaplex)](https://umi.metaplex.com) — simplified program and Arweave interaction layer.

### How to launchs

How to launch:
In InvoFi/invofi/lib/config.ts
- 1. Set devnet HELIUS_API_KEY = "";
- 2. Set SOLANA_WALLET_PATH to your local (Devnet) Solana wallet
- 3. Make sure to set your ANON_KEY for the supabase
- 4. cd invofi 
- 5. npm run dev:resetdb



### Implementation Overview

InvoFi is being developed in **phases**:
- **Phase 1:** Secure invoice creation, verification, and NFT tokenization on Solana.
- **Phase 2:** Financialization via AMM integration, vault-controlled liquidity flows, fractionalization, and lending mechanics.

👉 Dive into the full technical architecture and phased design in our [Technical Implementation Doc](docs/tech_implementation.md).

## 💡The Vision

InvoFi's mission is to democratize invoice financing by building a protocol that is:

- Transparent and programmable
- Efficient and scalable
- Inclusive of businesses traditionally overlooked

By converting receivables into digital assets and enabling real-time financing through DeFi liquidity pools, we're unlocking trillions in trapped working capital across the global B2B economy.

InvoFi is not just an app — it's the foundation for **decentralized trade finance**.

---

**Built with ❤️ at [Solana Breakout 2025 Hackathon](https://www.colosseum.org/breakout).**

**We’re just getting started.** 

Follow us on X for updates: [@invo_fi](https://x.com/invo_fi)

