use anchor_lang::prelude::*;

#[error_code]
pub enum InvoiceError {
    #[msg("The invoice is not in the funding stage.")]
    NotFunding,
    #[msg("The contribution amount is too large.")]
    AmountTooLarge,
    #[msg("The maximum number of contributors has been reached.")]
    ContributorLimitExceeded,
}