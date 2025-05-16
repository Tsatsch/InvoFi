## How the AMM Works in InvoFi

InvoFi uses a custom **Automated Market Maker (AMM)** to price invoices based on factors like:

- Invoice term (e.g., 30, 60, 90 days)
- Creditworthiness of the debtor
- Time decay (closer to the due date = higher price)

### How it functions:
1. **Liquidity Providers (LPs)** deposit stablecoins (e.g., USDC) into a decentralized liquidity pool.
2. When a **verified invoice** is uploaded, **InvoFi tokenizes** it as a **non-fungible token (NFT)**. This tokenization process includes automatic **verification** of the invoice’s authenticity.
3. Once tokenized, the invoice is listed in the **AMM liquidity pool** marketplace, ready for **fractional financing**.
4. **One LP per invoice** will **buy** the invoice, but the capital for the purchase is pooled from **multiple liquidity providers** (LPs) who contribute to the financing of the invoice.
5. The invoice is transferred to the LP, and the business receives **immediate funding**.
6. When the invoice is paid by the debtor, the protocol **routes the repayment** to the liquidity pool, distributing the payment to the **fractional contributors** based on their share of the financing pool.

This system allows for **one LP per invoice**, with the financing being **fractionalized** among multiple LPs, offering capital efficiency and risk diversification.

