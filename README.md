# InvoFi

<img src="invofi/public/invofi.svg" alt="InvoFi Logo" width="50" align="left" style="margin-right: 10px;">

## What is InvoFi?
InvoFi is a decentralized platform that transforms unpaid invoices into blockchain-based digital assets. Verified invoices are tokenized as NFTs and instantly financed through a decentralized liquidity pool powered by an Automated Market Maker (AMM) — enabling businesses to unlock working capital in minutes, not months.

For more details on how the AMM works, see [How the AMM Works](docs/how_the_amm_works.md).

Instead of relying on banks or waiting for slow invoice payments, businesses upload verified receivables and receive immediate funding at transparent, market-driven rates. InvoFi reimagines invoice factoring through a **DeFi-native, programmable**, and **fraud-resistant** protocol.

## 🚀 Why We Built InvoFi

### Traditional Invoice Financing
The problems we're solving:

- Slow and manual processes
- Opaque pricing structures
- Designed for large corporations
- Excludes many legitimate businesses

**InvoFi Solution**

Our key features:

- Instant liquidity through AMM
- Decentralized capital access
- Fraud-resistant verification
- Transparent & trustless system

---

## Why This Makes Sense for Banks

InvoFi opens a new, DeFi-native channel for financing real-world receivables and creates multiple roles where financial institutions can participate and profit.

For more details on why this makes sense for banks, check [Why This Makes Sense for Banks](docs/why_this_makes_sense_for_banks.md).


## 💡The Vision

InvoFi's mission is to democratize invoice financing by building a protocol that is:

- Transparent and programmable
- Efficient and scalable
- Inclusive of businesses traditionally overlooked

By converting receivables into digital assets and enabling real-time financing through DeFi liquidity pools, we're unlocking trillions in trapped working capital across the global B2B economy.

InvoFi is not just an app — it's the foundation for **decentralized trade finance**.

---

---

How to launch:
In InvoFi/invofi/lib/config.ts
1. Set devnet HELIUS_API_KEY = "";
2. Set SOLANA_WALLET_PATH to your local (Devnet) Solana wallet
3. cd invofi 
4. npm run dev:resetdb
