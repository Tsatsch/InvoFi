#[path = "support/mod.rs"]
mod support;

use invo_fi::{constants, error::InvoiceError};
use solana_instruction::error::InstructionError;
use solana_transaction_error::TransactionError;
use support::*;

fn setup_fixture() -> TestResult<Option<InvoiceFixture>> {
    let config = ScenarioConfig::default().with_lp_contributions(vec![]);
    InvoiceFixture::setup(config)
}

#[test]
fn purchase_price_cannot_exceed_total_amount() -> TestResult {
    let Some(mut fixture) = setup_fixture()? else {
        return Ok(());
    };
    let mut terms = fixture.config.invoice_terms;
    terms.purchase_price = terms.total_amount.saturating_add(1);

    let err = fixture.list_invoice_with_terms_raw(terms).unwrap_err();
    assert_anchor_error(err, InvoiceError::InvalidPurchasePrice);
    Ok(())
}

#[test]
fn risk_rating_must_be_within_bounds() -> TestResult {
    let Some(mut fixture) = setup_fixture()? else {
        return Ok(());
    };
    let mut terms = fixture.config.invoice_terms;
    terms.risk_rating = constants::MAX_RISK_RATING.saturating_add(1);

    let err = fixture.list_invoice_with_terms_raw(terms).unwrap_err();
    assert_anchor_error(err, InvoiceError::InvalidRiskRating);
    Ok(())
}

#[test]
fn due_date_must_be_in_future() -> TestResult {
    let Some(mut fixture) = setup_fixture()? else {
        return Ok(());
    };
    let mut terms = fixture.config.invoice_terms;
    terms.due_date = -1;

    let err = fixture.list_invoice_with_terms_raw(terms).unwrap_err();
    assert_anchor_error(err, InvoiceError::InvalidDueDate);
    Ok(())
}

#[test]
fn duplicate_invoice_mint_is_rejected() -> TestResult {
    let Some(mut fixture) = setup_fixture()? else {
        return Ok(());
    };

    fixture.list_invoice()?;
    let err = fixture
        .list_invoice_with_terms_raw(fixture.config.invoice_terms)
        .unwrap_err();
    match err.err {
        TransactionError::InstructionError(_, InstructionError::AccountAlreadyInitialized) => {}
        TransactionError::AlreadyProcessed => {}
        other => panic!("expected account init failure, got {other:?}"),
    }
    Ok(())
}
