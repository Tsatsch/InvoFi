use anchor_lang::prelude::*;


#[account]
#[derive(InitSpace)]
pub struct AmmConfig {
    pub seed: u64,
    pub authority: Pubkey,
    pub mint_x: Pubkey,
    pub mint_y: Pubkey,
    pub vault_x: Pubkey,
    pub vault_y: Pubkey,
    pub lp_mint: Pubkey,
    pub fee: u16,
    pub bump: u8,
}