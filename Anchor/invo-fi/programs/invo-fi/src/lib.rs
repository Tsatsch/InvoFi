use anchor_lang::prelude::*;
use instructions::*;

declare_id!("inVoK3cvQJ2y2xR26N62q21sJcTj1S2tV4gys1mXg2T");

mod constants;
mod instructions;
mod state;

#[program]
pub mod invo_fi {
    use super::*;

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
