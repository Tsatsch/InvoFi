use crate::error::InvoiceError;
use crate::state::invoice::{Contribution, Invoice, InvoiceStatus};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

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
    // With SPL token transfers we can keep a single mutable borrow of the invoice
    // for the whole instruction. There is no double-borrow CPI pattern here.
    let invoice_account = &mut ctx.accounts.invoice_account.load_mut()?;

    // 1) Basic sanity checks before taking any funds
    require!(
        invoice_account.status == InvoiceStatus::Funding as u8,
        InvoiceError::NotFunding
    );
    require!(amount > 0, InvoiceError::ZeroContribution);

    let remaining_amount = invoice_account
        .purchase_price
        .checked_sub(invoice_account.total_funded_amount)
        .unwrap();
    require!(amount <= remaining_amount, InvoiceError::AmountTooLarge);

    let existing = invoice_account.contributors[..invoice_account.contributor_count as usize]
        .iter()
        .any(|entry| entry.contributor == ctx.accounts.contributor.key());
    require!(!existing, InvoiceError::DuplicateContributor);

    let contributor_idx = invoice_account.contributor_count as usize;
    require!(
        contributor_idx < invoice_account.contributors.len(),
        InvoiceError::ContributorLimitExceeded
    );

    // 2) Move USDC from the contributor to the invoice vault (escrow)
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.contributor_usdc_account.to_account_info(),
        to: ctx.accounts.usdc_vault.to_account_info(),
        authority: ctx.accounts.contributor.to_account_info(),
    };
    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_context, amount)?;

    // 3) Persist contribution on-chain
    invoice_account.total_funded_amount = invoice_account
        .total_funded_amount
        .checked_add(amount)
        .unwrap();

    invoice_account.contributors[contributor_idx] = Contribution {
        contributor: ctx.accounts.contributor.key(),
        amount,
    };
    invoice_account.contributor_count = invoice_account
        .contributor_count
        .checked_add(1)
        .ok_or(InvoiceError::ContributorLimitExceeded)?;

    // 4) If we’ve reached the purchase price, mark the invoice as financed
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
