use anchor_lang::prelude::*;
use instructions::*;

declare_id!("inVoK3cvQJ2y2xR26N62q21sJcTj1S2tV4gys1mXg2T");

mod constants;
mod error;
mod instructions;
mod state;

#[program]
pub mod invo_fi {
    use super::*;

    pub fn mint_invoice_nft(
        ctx: Context<MintInvoiceNft>,
        name: String,
        uri: String,
    ) -> Result<()> {
        instructions::mint_invoice_nft::handler(ctx, name, uri)
    }
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
