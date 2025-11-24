use anchor_lang::prelude::*;

#[error_code]
pub enum InvoiceError {
    #[msg("The invoice is not in the funding stage.")]
    NotFunding,
    #[msg("The contribution amount is too large.")]
    AmountTooLarge,
    #[msg("The maximum number of contributors has been reached.")]
    ContributorLimitExceeded,
    #[msg("The purchase price cannot exceed the total amount.")]
    InvalidPurchasePrice,
    #[msg("The provided risk rating is out of bounds.")]
    InvalidRiskRating,
    #[msg("The invoice due date must be in the future.")]
    InvalidDueDate,
    #[msg("Contribution amount must be greater than zero.")]
    ZeroContribution,
    #[msg("Contributor has already participated.")]
    DuplicateContributor,
}
