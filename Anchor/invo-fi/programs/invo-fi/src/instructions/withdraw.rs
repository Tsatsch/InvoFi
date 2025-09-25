use anchor_lang::prelude::*;
use anchor_spl::token::{self, spl_token, Burn, Mint, Token, TokenAccount, Transfer};
use crate::state::config::AmmConfig;
use crate::constants::CONFIG_SEED;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED, config.seed.to_le_bytes().as_ref()],
        bump = config.bump,
        has_one = vault_x,
        has_one = vault_y,
        has_one = lp_mint
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
    
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_lp_wallet: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Withdraw>, lp_amount: u64) -> Result<()> {
    let amount_x_to_return = (lp_amount as u128 * ctx.accounts.vault_x.amount as u128) / ctx.accounts.lp_mint.supply as u128;
    let amount_y_to_return = (lp_amount as u128 * ctx.accounts.vault_y.amount as u128) / ctx.accounts.lp_mint.supply as u128;
    
    let seeds = 
        &[CONFIG_SEED,
        &ctx.accounts.config.seed.to_le_bytes()[..],
        &[ctx.accounts.config.bump]
        ];
    let signer_seed = &[&seeds[..]];
    let burn_accounts = token::Burn{
        mint: ctx.accounts.lp_mint.to_account_info(), 
        from: ctx.accounts.user_lp_wallet.to_account_info(), 
        authority: ctx.accounts.user.to_account_info()};

    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        burn_accounts
    );

    token::burn(cpi_context, lp_amount)?;

    // X trnsfer
    let transfer_x_accounts = Transfer {
        from: ctx.accounts.vault_x.to_account_info(),
        to: ctx.accounts.user_vault_x.to_account_info(),
        authority: ctx.accounts.config.to_account_info(),
    };
    let cpi_context_x = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_x_accounts,
        signer_seed
    );
    token::transfer(cpi_context_x, amount_x_to_return as u64)?;

    // Y transfer
    let transfer_y_accounts = Transfer {
        from: ctx.accounts.vault_y.to_account_info(),
        to: ctx.accounts.user_vault_y.to_account_info(),
        authority: ctx.accounts.config.to_account_info(),
    };
    let cpi_context_y = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_y_accounts,
        signer_seed
    );
    token::transfer(cpi_context_y, amount_y_to_return as u64)?;

    Ok(())
}
