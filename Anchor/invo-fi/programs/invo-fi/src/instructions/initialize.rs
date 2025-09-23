use anchor_lang::prelude::*;
use crate::state::config::*;
use anchor_spl::token::{Mint, TokenAccount,Token};

#[derive(Accounts)]
pub struct Initialize<'info> {
    payer: Signer<'info>,
    config: Account<'info, AmmConfig>,
    mint_x: InterfaceAccount<'info, Mint>,
    mint_y: InterfaceAccount<'info, Mint>,
    vault_x: Program<'info, Token>,
    vault_y: Program<'info, Token>,
    lp_mint: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, fee: u16, seed:u64) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
}


// pub fn init_config_account(config: Context<)

// pub fn init_invoice_nft(mint_asset: Context<MintAsset>) -> Result<()> {
//     mint_invoice_nft::MintAsset::mint_core_asset(&mut mint_asset);
//     msg!("Invoice NFT minted");
//     Ok(())
// }
