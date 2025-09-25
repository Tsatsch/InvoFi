use anchor_lang::prelude::*;

#[account]
pub struct Invoice {
    // --- Static Invoice Data ---
    pub issuer: Pubkey,      // The company that created the invoice
    pub total_amount: u64,   // The full value of the invoice to be repaid
    pub due_date: i64,       // Unix timestamp of the due date
    pub risk_rating: u8,     // Enum or integer for risk (e.g., 0=Low, 1=Medium, 2=High)
    pub invoice_mint: Pubkey, // The mint address of the Invoice NFT

    // --- Dynamic Funding Data ---
    pub total_funded_amount: u64, // The total capital raised from investors so far
    pub purchase_price: u64, // The target amount to be collected (Total Amount - Average Discount)
    // Using a fixed-size array for the MVP to avoid Vec complexities
    pub contributors: [Contribution; 50],
    pub contributor_count: u8,
    pub status: InvoiceStatus, // Enum: {Funding, Financed, Repaid, Defaulted}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct Contribution {
    pub contributor: Pubkey,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum InvoiceStatus {
    Funding,      // Actively collecting funds
    Financed,     // Funding complete, waiting for repayment
    Repaid,       // Repayment received and distributed
    Defaulted,    // Due date passed without repayment
}

impl Default for InvoiceStatus {
    fn default() -> Self {
        Self::Funding
    }
}
