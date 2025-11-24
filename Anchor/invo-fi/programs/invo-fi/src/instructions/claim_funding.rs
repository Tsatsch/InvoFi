use crate::error::InvoiceError;
use crate::state::invoice::{Invoice, InvoiceStatus};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

#[derive(Accounts)]
pub struct ClaimFunding<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(mut)]
    pub issuer_usdc_account: Account<'info, TokenAccount>,

    #[account(
        has_one = issuer,
        seeds = [b"invoice", invoice_account.load()?.invoice_mint.as_ref()],
        bump
    )]
    pub invoice_account: AccountLoader<'info, Invoice>,

    #[account(
        mut,
        seeds = [b"vault", invoice_account.key().as_ref()],
        bump,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimFunding>) -> Result<()> {
    let invoice_account = ctx.accounts.invoice_account.load()?;

    require!(
        invoice_account.status == InvoiceStatus::Financed as u8,
        InvoiceError::NotFunding
    );

    let amount_to_transfer = invoice_account.total_funded_amount;

    let invoice_mint_key = invoice_account.invoice_mint.key();
    let invoice_bump = ctx.bumps.invoice_account;
    let seeds = &[
        b"invoice".as_ref(),
        invoice_mint_key.as_ref(),
        &[invoice_bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = token::Transfer {
        from: ctx.accounts.usdc_vault.to_account_info(),
        to: ctx.accounts.issuer_usdc_account.to_account_info(),
        authority: ctx.accounts.invoice_account.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_context, amount_to_transfer)?;

    msg!(
        "{} USDC transferred from vault to issuer.",
        amount_to_transfer
    );

    Ok(())
}
