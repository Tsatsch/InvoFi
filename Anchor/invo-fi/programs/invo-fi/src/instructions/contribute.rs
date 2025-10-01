
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::invoice::{Invoice, InvoiceStatus, Contribution};
use crate::error::InvoiceError;

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,

    #[account(mut)]
    pub contributor_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub invoice_account: AccountLoader<'info, Invoice>,

    #[account(
        mut,
        seeds = [b"vault", invoice_account.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    // With token transfers, we don't have the `AccountBorrowFailed` issue,
    // so we can go back to a single mutable borrow for the whole function.
    let invoice_account = &mut ctx.accounts.invoice_account.load_mut()?;

    // --- Validation Checks ---
    require!(invoice_account.status == InvoiceStatus::Funding as u8, InvoiceError::NotFunding);

    let remaining_amount = invoice_account.purchase_price.checked_sub(invoice_account.total_funded_amount).unwrap();
    require!(amount <= remaining_amount, InvoiceError::AmountTooLarge);
    
    let contributor_idx = invoice_account.contributor_count as usize;
    require!(contributor_idx < invoice_account.contributors.len(), InvoiceError::ContributorLimitExceeded);

    // --- CPI to transfer USDC ---
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.contributor_usdc_account.to_account_info(),
        to: ctx.accounts.usdc_vault.to_account_info(),
        authority: ctx.accounts.contributor.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_context, amount)?;

    // --- Update State ---
    invoice_account.total_funded_amount = invoice_account.total_funded_amount.checked_add(amount).unwrap();
    
    invoice_account.contributors[contributor_idx] = Contribution {
        contributor: ctx.accounts.contributor.key(),
        amount,
    };
    invoice_account.contributor_count += 1;

    // --- Check if fully funded ---
    if invoice_account.total_funded_amount == invoice_account.purchase_price {
        invoice_account.status = InvoiceStatus::Financed as u8;
        msg!("Invoice fully financed!");
    }

    msg!(
        "Contribution of {} successful. Total funded: {}/{}",
        amount,
        invoice_account.total_funded_amount,
        invoice_account.purchase_price
    );
    
    Ok(())
}