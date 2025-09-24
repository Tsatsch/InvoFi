use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use crate::state::config::AmmConfig;
use crate::constants::CONFIG_SEED;

#[derive(Accounts)]
pub struct Deposit<'info> {
    // Пользователь, который платит за транзакцию и владеет user_vault_x/y
    #[account(mut)]
    pub user: Signer<'info>,

    // Аккаунт конфига. Проверяем его PDA и то, что он владеет хранилищами.
    #[account(
        mut,
        seeds = [CONFIG_SEED, config.seed.to_le_bytes().as_ref()],
        bump = config.bump,
        has_one = vault_x,
        has_one = vault_y,
        has_one = lp_mint
    )]
    pub config: Account<'info, AmmConfig>,

    // Хранилища программы. Они будут изменяться.
    #[account(mut)]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_y: Account<'info, TokenAccount>,

    // Кошельки пользователя. Они тоже будут изменяться (баланс уменьшится).
    #[account(mut)]
    pub user_vault_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_vault_y: Account<'info, TokenAccount>,
    
    // Мята LP-токенов. Будем выпускать новые токены, поэтому mut.
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    // LP-кошелек пользователя. Баланс увеличится.
    #[account(mut)]
    pub user_lp_wallet: Account<'info, TokenAccount>,
    
    // Указатель на Токен-Программу
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Deposit>, amount_x: u64, amount_y: u64) -> Result<()> {
    // Здесь будет ваш код
    //сначала нужно описать какие аккаунты учавствуют в переводе:
    
    let seeds = &[
        CONFIG_SEED,
        &ctx.accounts.config.seed.to_le_bytes()[..],
        &[ctx.accounts.config.bump]
    ];
    let signer_seeds = &[&seeds[..]];
    
    let transfer_x_accounts = Transfer{
        from: ctx.accounts.user_vault_x.to_account_info(), 
    to: ctx.accounts.vault_x.to_account_info(), 
    authority: ctx.accounts.user.to_account_info()}; // Owner::owner()

    let mint_to_accounts = MintTo { 
        mint: ctx.accounts.lp_mint.to_account_info(),
        to: ctx.accounts.user_lp_wallet.to_account_info(),
        authority: ctx.accounts.config.to_account_info()
    };
    let cpi_call_x = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_x_accounts);
    let result_x = token::transfer(cpi_call_x, amount_x)?;

    let transfer_y_accounts = Transfer {
        from: ctx.accounts.user_vault_y.to_account_info(),
        to: ctx.accounts.vault_y.to_account_info(),
        authority: ctx.accounts.user.to_account_info()
    };
    let cpi_call_y = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_y_accounts);
    let result_y = token::transfer(cpi_call_y, amount_y)?;

    //for signing the PDA transaction
    let cpi_mint = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), 
    mint_to_accounts, signer_seeds);
    Ok(())
}
