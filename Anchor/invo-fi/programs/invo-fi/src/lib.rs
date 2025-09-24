pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6wG3H75vWDm7k6j72Ka5yGXTozz5rBxryZrMyLZ1KwGD");

/// Program for managing invoice NFTs using MPL Core
#[program]
pub mod invo_fi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, seed: u64, fee: u16) -> Result<()> {
        instructions::initialize::handler(ctx, seed, fee)
    }

    // /// Mint a new invoice NFT with the provided metadata
    // pub fn mint_invoice_nft(
    //     ctx: Context<MintAsset>,
    //     invoice_number: String,
    //     loan_amount: String,
    //     currency: String,
    //     issuer_name: String,
    //     recipient_name: String,
    //     issue_date: String,
    //     due_date: String,
    // ) -> Result<()> {
    //     ctx.accounts.mint_core_asset(
    //         invoice_number,
    //         loan_amount,
    //         currency,
    //         issuer_name,
    //         recipient_name,
    //         issue_date,
    //         due_date,
    //     )
    // }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct MintInvoiceNftArgs {
    pub invoice_number: String,
    pub loan_amount: String,
    pub currency: String,
    pub issuer_name: String,
    pub recipient_name: String,
    pub issue_date: String,
    pub due_date: String,
}
