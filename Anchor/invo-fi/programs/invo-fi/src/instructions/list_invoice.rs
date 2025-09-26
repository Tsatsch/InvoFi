use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::invoice::Invoice;

#[derive(Accounts)]
pub struct ListInvoice<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    // Initialize the Invoice account
    #[account(
        init,
        payer = issuer,
        space = 8 + std::mem::size_of::<Invoice>(), // 8 bytes for discriminator
        // Seeds for PDA: "invoice" + mint address of the NFT
        seeds = [b"invoice", invoice_mint.key().as_ref()],
        bump
    )]
    pub invoice_account: Account<'info, Invoice>,

    // The mint account of the NFT representing the invoice
    pub invoice_mint: Account<'info, Mint>,

    // System Program required to create new accounts
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ListInvoice>, 
    total_amount: u64,
    purchase_price: u64,
    due_date: i64,
    risk_rating: u8
) -> Result<()> {
    let invoice_account = &mut ctx.accounts.invoice_account;

    invoice_account.issuer = ctx.accounts.issuer.key();
    invoice_account.total_amount = total_amount;
    invoice_account.purchase_price = purchase_price;
    invoice_account.due_date = due_date;
    invoice_account.risk_rating = risk_rating;
    invoice_account.invoice_mint = ctx.accounts.invoice_mint.key();
    invoice_account.status = crate::state::invoice::InvoiceStatus::Funding;
    invoice_account.contributor_count = 0;
    // We don't need to initialize the contributors array, it's default value is fine.

    msg!("Invoice {} listed for funding!", invoice_account.key());

    Ok(())
}
