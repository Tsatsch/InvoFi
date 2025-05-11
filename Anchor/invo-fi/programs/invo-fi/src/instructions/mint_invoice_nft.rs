use anchor_lang::prelude::*;


use mpl_core::{instructions::CreateV1CpiBuilder, types::{Attribute, Attributes, DataState, PluginAuthorityPair}};


#[derive(Accounts)]
pub struct MintAsset<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the mint account that will be created by the MPL Core program
    #[account(mut, signer)]
    pub mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is the MPL Core program ID which we verify is correct
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

impl<'info> MintAsset<'info> {
    pub fn mint_core_asset(&mut self, invoice_number: String, loan_amount: String, currency: String, issuer_name: String, recipient_name: String, issue_date: String, due_date: String) -> Result<()> {
        CreateV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
        .asset(&self.mint.to_account_info())
        .collection(None)
        .authority(Some(&self.user.to_account_info()))
        .payer(&self.user.to_account_info())
        .owner(Some(&self.user.to_account_info()))
        .update_authority(Some(&self.user))
        .system_program(&self.system_program.to_account_info())
        .data_state(DataState::AccountState)
        .name("Invoice NFT".to_string()) //:TODO Nikita paste invoice name here
        .uri("https://invo.fi/invoice/".to_string()) // link to walrus or arweave
        .plugins(vec![PluginAuthorityPair {
            plugin: mpl_core::types::Plugin::Attributes(Attributes { attribute_list: 
                vec![
                    Attribute { 
                        //:TODO UNhardcode this, put the arguments in the instruction
                        key: "InvoiceNumber".to_string(),
                        value: invoice_number},
                    Attribute {
                        key: "LoanAmount".to_string(),
                        value: loan_amount},
                    Attribute {
                        key: "Currency".to_string(),
                        value: currency},
                    Attribute {
                        key: "issuerName".to_string(),
                        value: issuer_name},
                    Attribute {
                        key: "recipientName".to_string(),
                        value: recipient_name},
                    Attribute {
                        key: "issueDate".to_string(),
                        value: issue_date},
                    Attribute {
                        key: "dueDate".to_string(),
                        value: due_date}
                    
                ]
            }), 
            authority: None
        }])
        .invoke()?;


        Ok(())
    }

}