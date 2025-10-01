use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::state::invoice::{Invoice, InvoiceStatus};

#[derive(Accounts)]
pub struct ListInvoice<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        init,
        payer = issuer,
        space = 8 + std::mem::size_of::<Invoice>(),
        seeds = [b"invoice", invoice_mint.key().as_ref()],
        bump
    )]
    pub invoice_account: AccountLoader<'info, Invoice>,

    /// SPL mint used for funding and repayments (e.g. USDC)
    pub usdc_mint: Account<'info, Mint>,

    /// PDA-owned token account that will custody investor funds during funding
    #[account(
        init,
        payer = issuer,
        token::mint = usdc_mint,
        token::authority = invoice_account, // vault authority is the invoice PDA
        seeds = [b"vault", invoice_account.key().as_ref()],
        bump,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// Mint of the invoice NFT that represents this receivable
    pub invoice_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<ListInvoice>, 
    total_amount: u64,
    purchase_price: u64,
    due_date: i64,
    risk_rating: u8
) -> Result<()> {
    // Initialize invoice state in a single place
    let mut invoice_account = ctx.accounts.invoice_account.load_init()?;

    invoice_account.issuer = ctx.accounts.issuer.key();
    invoice_account.total_amount = total_amount;
    invoice_account.purchase_price = purchase_price;
    invoice_account.due_date = due_date;
    invoice_account.risk_rating = risk_rating;
    invoice_account.invoice_mint = ctx.accounts.invoice_mint.key();
    invoice_account.status = InvoiceStatus::Funding as u8;
    invoice_account.contributor_count = 0;
    // contributors array is zeroed by default; no extra init required

    msg!("Invoice {} listed for funding!", ctx.accounts.invoice_account.key());

    Ok(())
}
