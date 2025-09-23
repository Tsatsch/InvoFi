use anchor_lang::prelude::*;


#[account]
#[derive(InitSpace)]
pub struct AmmConfig {
    seed: u64,
    authority: Pubkey,
    mint_x: Pubkey,
    mint_y: Pubkey,
    vault_x: Pubkey,
    vault_y: Pubkey,
    lp_mint: Pubkey,
    fee: u16,
}