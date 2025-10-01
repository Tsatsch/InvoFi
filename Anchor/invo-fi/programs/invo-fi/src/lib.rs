use anchor_lang::prelude::*;
use instructions::*;

declare_id!("inVoK3cvQJ2y2xR26N62q21sJcTj1S2tV4gys1mXg2T");

mod constants;
mod error;
mod instructions;
mod state;

#[program]
pub mod invo_fi {
    use super::*;

    pub fn repay_and_distribute(ctx: Context<RepayAndDistribute>) -> Result<()> {
        instructions::repay_and_distribute::handler(ctx)
    }

    pub fn claim_funding(ctx: Context<ClaimFunding>) -> Result<()> {
        instructions::claim_funding::handler(ctx)
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        instructions::contribute::handler(ctx, amount)
    }

    pub fn list_invoice(
        ctx: Context<ListInvoice>, 
        total_amount: u64,
        purchase_price: u64,
        due_date: i64,
        risk_rating: u8
    ) -> Result<()> {
        instructions::list_invoice::handler(ctx, total_amount, purchase_price, due_date, risk_rating)
    }
}
