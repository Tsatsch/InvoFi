use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Slippage tolerance exceeded.")]
    SlippageExceeded,
}
