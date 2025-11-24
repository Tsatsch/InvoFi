#[path = "support/mod.rs"]
mod support;

use invo_fi::{error::InvoiceError, state::invoice::InvoiceStatus};
use support::*;

fn setup_fixture_with_lps(contributions: Vec<u64>) -> TestResult<Option<InvoiceFixture>> {
    let config = ScenarioConfig::default().with_lp_contributions(contributions);
    match InvoiceFixture::setup(config)? {
        Some(mut fixture) => {
            fixture.list_invoice()?;
            Ok(Some(fixture))
        }
        None => Ok(None),
    }
}

#[test]
fn zero_amount_is_rejected() -> TestResult {
    let Some(mut fixture) = setup_fixture_with_lps(vec![1_000_000])? else {
        return Ok(());
    };

    let err = fixture.contribute_lp_raw(0, 0).unwrap_err();
    assert_anchor_error(err, InvoiceError::ZeroContribution);
    Ok(())
}

#[test]
fn amount_above_remaining_is_rejected() -> TestResult {
    let Some(mut fixture) = setup_fixture_with_lps(vec![2_000_000])? else {
        return Ok(());
    };
    let purchase_price = fixture.config.invoice_terms.purchase_price;
    let err = fixture
        .contribute_lp_raw(0, purchase_price.saturating_add(1))
        .unwrap_err();
    assert_anchor_error(err, InvoiceError::AmountTooLarge);
    Ok(())
}

#[test]
fn duplicate_contributor_is_rejected() -> TestResult {
    let Some(mut fixture) = setup_fixture_with_lps(vec![600_000, 400_000])? else {
        return Ok(());
    };

    fixture.contribute_lp_raw(0, 600_000).unwrap();
    let err = fixture.contribute_lp_raw(0, 100).unwrap_err();
    assert_anchor_error(err, InvoiceError::DuplicateContributor);
    Ok(())
}

#[test]
fn contributor_limit_enforced() -> TestResult {
    let contributions = vec![10_000; 65];
    let Some(mut fixture) = setup_fixture_with_lps(contributions)? else {
        return Ok(());
    };

    for idx in 0..64 {
        fixture.contribute_lp_raw(idx, 10_000).unwrap();
    }

    let err = fixture.contribute_lp_raw(64, 10_000).unwrap_err();
    assert_anchor_error(err, InvoiceError::ContributorLimitExceeded);
    Ok(())
}

#[test]
fn invoice_stays_funding_until_full_purchase() -> TestResult {
    let Some(mut fixture) = setup_fixture_with_lps(vec![100_000, 200_000])? else {
        return Ok(());
    };

    fixture.contribute_lp_raw(0, 100_000).unwrap();
    let invoice = fixture.invoice_state();
    assert_eq!(invoice.status, InvoiceStatus::Funding as u8);
    Ok(())
}
