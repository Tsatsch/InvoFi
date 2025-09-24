use anchor_lang::prelude::*;
use crate::state::config::*;
use crate::constants::CONFIG_SEED;
use anchor_spl::token::{Mint, TokenAccount,Token};

#[derive(Accounts)]
#[instruction(seed: u64, fee: u16)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, //разрешаем менять баланс, чтбоы он смог платить за аренду новых аккаунтов
    #[account(
        init,
        payer=payer,
        space = 8 + AmmConfig::INIT_SPACE, //8 byte Discriminator + Datastructure size
        seeds = [CONFIG_SEED, seed.to_le_bytes().as_ref()],
        bump
    )]
    pub config: Account<'info, AmmConfig>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,
    #[account(
        init,
        payer=payer,
        token::mint = mint_x, //для какого токна это хранилище%?
        token::authority = config //назначаем владельцем наше PDA
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        init,
        payer=payer,
        token::mint = mint_y,
        token::authority = config
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        init, // 1. Сказали "создать"
        payer = payer, // 2. Сказали, кто платит
        mint::decimals = 6, // 3. Указали кол-во знаков после запятой
        mint::authority = config, // 4. Назначаем владельцем (то есть тем, кто может выпускать новые LP-токены) нашего PDA
    )]
    pub lp_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>
}

pub fn handler(ctx: Context<Initialize>, seed:u64, fee:u16) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    let config = &mut ctx.accounts.config;


    config.seed = seed;
    config.authority = ctx.accounts.payer.key();
    config.mint_x = ctx.accounts.mint_x.key();
    config.mint_y = ctx.accounts.mint_y.key();
    config.vault_x = ctx.accounts.vault_x.key();
    config.vault_y = ctx.accounts.vault_y.key();
    config.lp_mint = ctx.accounts.lp_mint.key();
    config.fee = fee;
    config.bump = ctx.bumps.config;

    msg!("AMM Configured!");
    Ok(())
}


// pub fn init_config_account(config: Context<)

// pub fn init_invoice_nft(mint_asset: Context<MintAsset>) -> Result<()> {
//     mint_invoice_nft::MintAsset::mint_core_asset(&mut mint_asset);
//     msg!("Invoice NFT minted");
//     Ok(())
// }
