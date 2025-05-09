use anchor_lang::prelude::*;

mod mint_invoice_nft;
use mint_invoice_nft::*;

#[derive(Accounts)]
pub struct Initialize {}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
}

pub fn init_invoice_nft(mint_asset: Context<MintAsset>) -> Result<()> {
    mint_invoice_nft::MintAsset::mint_core_asset(&mut mint_asset);
    msg!("Invoice NFT minted");
    Ok(())
}
