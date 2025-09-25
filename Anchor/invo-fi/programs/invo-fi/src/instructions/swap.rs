use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::config::AmmConfig;
use crate::constants::CONFIG_SEED;
use crate::error::AmmError;

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED, config.seed.to_le_bytes().as_ref()],
        bump = config.bump,
        has_one = vault_x,
        has_one = vault_y
    )]
    pub config: Account<'info, AmmConfig>,

    #[account(mut)]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_vault_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_vault_y: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
    // Fee calculation (e.g., fee=25 means 0.25%)
    let fee_amount = (amount_in as u128 * ctx.accounts.config.fee as u128 / 10000) as u64;
    let amount_in_after_fee = amount_in.checked_sub(fee_amount).unwrap();

    // AMM logic: x * y = k
    let k = ctx.accounts.vault_x.amount as u128 * ctx.accounts.vault_y.amount as u128;
    let amount_out = k.checked_div(ctx.accounts.vault_x.amount as u128 + amount_in_after_fee as u128)
                     .unwrap();
    let amount_out = ctx.accounts.vault_y.amount - amount_out as u64;


    // Slippage check
    require!(amount_out >= min_amount_out, AmmError::SlippageExceeded);

    // CPI: Transfer from user to vault
    let transfer_accounts_user_to_vault = Transfer {
        from: ctx.accounts.user_vault_x.to_account_info(),
        to: ctx.accounts.vault_x.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_user_to_vault = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts_user_to_vault,
    );
    token::transfer(cpi_user_to_vault, amount_in)?;

    // CPI: Transfer from vault to user (with PDA signer)
    let seeds = &[
        CONFIG_SEED,
        &ctx.accounts.config.seed.to_le_bytes()[..],
        &[ctx.accounts.config.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_accounts_vault_to_user = Transfer {
        from: ctx.accounts.vault_y.to_account_info(),
        to: ctx.accounts.user_vault_y.to_account_info(),
        authority: ctx.accounts.config.to_account_info(),
    };
    let cpi_vault_to_user = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts_vault_to_user,
        signer_seeds,
    );
    token::transfer(cpi_vault_to_user, amount_out)?;
    
    Ok(())
}
