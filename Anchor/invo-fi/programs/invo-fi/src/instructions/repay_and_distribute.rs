use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::invoice::{Invoice, InvoiceStatus};
use crate::error::InvoiceError;

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
    // --- 1. Load data and define PDA signer seeds ---
    let invoice = ctx.accounts.invoice_account.load()?;
    
    let invoice_mint_key = invoice.invoice_mint.key();
    let invoice_bump = ctx.bumps.invoice_account;
    let seeds = &[
        b"invoice".as_ref(),
        invoice_mint_key.as_ref(),
        &[invoice_bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // --- 2. Repay the full invoice amount to the vault ---
    let total_amount_to_repay = invoice.total_amount;
    let cpi_accounts_repay = token::Transfer {
        from: ctx.accounts.payer_usdc_account.to_account_info(),
        to: ctx.accounts.usdc_vault.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_context_repay = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts_repay);
    token::transfer(cpi_context_repay, total_amount_to_repay)?;

    // --- 3. Reload mutable invoice account, validate, and COPY data ---
    // We scope this mutable borrow so it's released before the distribution loop.
    let (total_profit, contributor_count, purchase_price, contributors) = {
        let invoice_mut = ctx.accounts.invoice_account.load_mut()?;
        require!(invoice_mut.status == InvoiceStatus::Financed as u8, InvoiceError::NotFunding);

        let total_profit = total_amount_to_repay.checked_sub(invoice_mut.purchase_price).unwrap();
        let contributor_count = invoice_mut.contributor_count as usize;
        let purchase_price = invoice_mut.purchase_price;
        // This copy is the key to releasing the borrow.
        let contributors = invoice_mut.contributors;
        
        (total_profit, contributor_count, purchase_price, contributors)
    };
    
    require!(ctx.remaining_accounts.len() == contributor_count, InvoiceError::ContributorLimitExceeded);

    // --- 4. Distribute funds to contributors ---
    let mut total_profit_distributed = 0;
    for i in 0..(contributor_count.saturating_sub(1)) {
        let contributor_data = &contributors[i];
        // Clone the AccountInfo to get an owned value, resolving lifetime issues.
        let contributor_token_account_info = ctx.remaining_accounts[i].clone();
        
        require!(contributor_data.contributor == *contributor_token_account_info.owner, InvoiceError::ContributorLimitExceeded);

        let profit_share = (total_profit as u128)
            .checked_mul(contributor_data.amount as u128).unwrap()
            .checked_div(purchase_price as u128).unwrap() as u64;
        total_profit_distributed += profit_share;   

        let payout_amount = contributor_data.amount.checked_add(profit_share).unwrap();

        let cpi_accounts_distribute = token::Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: contributor_token_account_info,
            authority: ctx.accounts.invoice_account.to_account_info(),
        };
        let cpi_context_distribute = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_distribute,
            signer_seeds
        );
        token::transfer(cpi_context_distribute, payout_amount)?;
    }
    
    if contributor_count > 0 {
        let last_idx = contributor_count - 1;
        let last_contributor_data = &contributors[last_idx];
        // Clone the AccountInfo to get an owned value.
        let last_contributor_token_account_info = ctx.remaining_accounts[last_idx].clone();

        require!(last_contributor_data.contributor == *last_contributor_token_account_info.owner, InvoiceError::ContributorLimitExceeded);

        let remaining_profit = total_profit.checked_sub(total_profit_distributed).unwrap();
        let final_payout = last_contributor_data.amount.checked_add(remaining_profit).unwrap();

        let cpi_accounts_final = token::Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: last_contributor_token_account_info,
            authority: ctx.accounts.invoice_account.to_account_info(),
        };
        let cpi_context_final: CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_final,
            signer_seeds
        );
        token::transfer(cpi_context_final, final_payout)?;
    }
    
    // --- 5. Update Status ---
    let mut invoice_mut = ctx.accounts.invoice_account.load_mut()?;
    invoice_mut.status = InvoiceStatus::Repaid as u8;
    msg!("Invoice repaid and profits distributed via USDC. Final status: Repaid.");

    Ok(())
}
