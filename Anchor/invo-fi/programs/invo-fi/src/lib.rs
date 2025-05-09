pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("FhKUDgBS3SzUVvRHKDVKwmzdEkAwo4AgfeX82d5zchhA");



/// CHECK: compiler wanna some explanations about unsafe fields :)
#[program]
pub mod create_core_asset_examplse {
    use super::*;
    use mpl_core::{ID as MPL_CORE_ID};
    //pub fn create_core_asset(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {

    //    Ok(())
    //}
    pub fn mint_invoice_nft(ctx: Context<MintAsset>) -> Result<()> {
        
        //instructions::mint_invoice_nft::MintAsset::mint_core_asset();
        let _ = ctx.accounts.mint_core_asset();
        Ok(())
    }
}


#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct MintInvoiceNftArgs {

}
