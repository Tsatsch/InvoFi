use crate::error::InvoiceError;
use crate::state::invoice::{Invoice, InvoiceStatus};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

#[derive(Accounts)]
pub struct RepayAndDistribute<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
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

pub fn handler(ctx: Context<RepayAndDistribute>) -> Result<()> {
    // 1) Debtor repays the full invoice amount into the vault
    let total_amount_to_repay = ctx.accounts.invoice_account.load()?.total_amount;
    let cpi_accounts_repay = token::Transfer {
        from: ctx.accounts.payer_usdc_account.to_account_info(),
        to: ctx.accounts.usdc_vault.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_context_repay = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_repay,
    );
    token::transfer(cpi_context_repay, total_amount_to_repay)?;

    // 2) Copy the invoice data we need and release the loader borrow
    let (total_profit, contributor_count, purchase_price, contributors) = {
        let invoice = ctx.accounts.invoice_account.load()?;
        require!(
            invoice.status == InvoiceStatus::Financed as u8,
            InvoiceError::NotFunding
        );
        (
            invoice
                .total_amount
                .checked_sub(invoice.purchase_price)
                .unwrap(),
            invoice.contributor_count as usize,
            invoice.purchase_price,
            invoice.contributors,
        )
    };

    // We pass CPI accounts exclusively via remaining_accounts to avoid lifetime issues.
    // Layout: [0] token_program, [1] vault (from), [2] invoice PDA (authority), [3..] contributor ATAs
    require!(
        ctx.remaining_accounts.len() == contributor_count + 3,
        InvoiceError::ContributorLimitExceeded
    );

    // 3) Prepare signer seeds for the invoice PDA
    let invoice_mint_key = ctx.accounts.invoice_account.load()?.invoice_mint.key();
    let invoice_bump = ctx.bumps.invoice_account;
    let seeds = &[
        b"invoice".as_ref(),
        invoice_mint_key.as_ref(),
        &[invoice_bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // 4) Fan-out distribution: principal + pro-rata profit
    let token_program_ai = ctx.remaining_accounts[0].clone();
    let vault_ai = ctx.remaining_accounts[1].clone();
    let authority_ai = ctx.remaining_accounts[2].clone();

    // Clone the contributor ATAs to owned AccountInfos, so we can use them outside of the ctx borrow
    let contributor_accounts: Vec<AccountInfo> = ctx.remaining_accounts[3..(3 + contributor_count)]
        .iter()
        .cloned()
        .collect();

    let mut total_profit_distributed: u64 = 0;
    for i in 0..contributor_count {
        let contributor_data = &contributors[i];
        let contributor_token_account_info = &contributor_accounts[i];

        // The last contributor receives any rounding remainder
        let profit_share = if i == contributor_count - 1 {
            total_profit.checked_sub(total_profit_distributed).unwrap()
        } else {
            let share = (total_profit as u128)
                .checked_mul(contributor_data.amount as u128)
                .unwrap()
                .checked_div(purchase_price as u128)
                .unwrap();
            total_profit_distributed += share as u64;
            share as u64
        };

        let payout_amount = contributor_data.amount.checked_add(profit_share).unwrap();

        let cpi_accounts_distribute = token::Transfer {
            from: vault_ai.clone(),
            to: contributor_token_account_info.clone(),
            authority: authority_ai.clone(),
        };
        let cpi_context_distribute = CpiContext::new_with_signer(
            token_program_ai.clone(),
            cpi_accounts_distribute,
            signer_seeds,
        );
        token::transfer(cpi_context_distribute, payout_amount)?;
    }

    // 5) Mark the invoice as fully repaid
    let mut invoice_mut = ctx.accounts.invoice_account.load_mut()?;
    invoice_mut.status = InvoiceStatus::Repaid as u8;
    msg!("Invoice repaid and profits distributed via USDC. Final status: Repaid.");

    Ok(())
}
