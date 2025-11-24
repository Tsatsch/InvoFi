#[path = "support/mod.rs"]
mod support;

use invo_fi::state::invoice::InvoiceStatus;
use support::*;

#[test]
fn list_invoice_initializes_state() -> TestResult {
    let config = ScenarioConfig::default();
    let Some(mut fixture) = InvoiceFixture::setup(config)? else {
        return Ok(());
    };

    fixture.list_invoice()?;

    let invoice = fixture.invoice_state();
    let terms = fixture.config.invoice_terms;
    assert_eq!(invoice.issuer, to_anchor_pubkey(&fixture.issuer.pubkey()));
    assert_eq!(invoice.total_amount, terms.total_amount);
    assert_eq!(invoice.purchase_price, terms.purchase_price);
    assert_eq!(invoice.due_date, terms.due_date);
    assert_eq!(invoice.risk_rating, terms.risk_rating);
    assert_eq!(invoice.status, InvoiceStatus::Funding as u8);
    assert_eq!(invoice.total_funded_amount, 0);
    assert_eq!(invoice.contributor_count, 0);

    let vault = fixture
        .harness
        .account(&fixture.usdc_vault)
        .expect("vault exists");
    assert_eq!(vault.owner, to_solana_pubkey(&anchor_spl::token::ID));

    Ok(())
}

#[test]
fn full_finance_and_repayment_flow() -> TestResult {
    let config = ScenarioConfig::default()
        .with_lp_contributions(vec![600_000, 400_000])
        .with_terms(InvoiceTerms {
            total_amount: 1_200_000,
            purchase_price: 1_000_000,
            ..InvoiceTerms::default()
        })
        .with_debtor_balance(1_200_000);

    let Some(mut fixture) = InvoiceFixture::setup(config)? else {
        return Ok(());
    };

    fixture.list_invoice()?;
    fixture.contribute_all()?;
    fixture.claim_funding()?;
    fixture.repay_full()?;

    let invoice = fixture.invoice_state();
    assert_eq!(invoice.status, InvoiceStatus::Repaid as u8);

    let issuer_balance = fixture.token_amount(&fixture.issuer.usdc_account);
    assert_eq!(issuer_balance, fixture.config.invoice_terms.purchase_price);

    let lp_balances: Vec<u64> = fixture
        .lps
        .iter()
        .map(|lp| fixture.token_amount(&lp.wallet.usdc_account))
        .collect();
    assert_eq!(lp_balances[0], 720_000);
    assert_eq!(lp_balances[1], 480_000);

    Ok(())
}
