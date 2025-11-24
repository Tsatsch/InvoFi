use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};

#[account(zero_copy)]
#[repr(C)]
pub struct Invoice {
    // --- 8-byte aligned fields first ---
    pub issuer: Pubkey,
    pub total_amount: u64, // how much in total is needed
    pub due_date: i64,
    pub invoice_mint: Pubkey,
    /// dynamic funding data, how much has been funded so far
    pub total_funded_amount: u64,
    /// The price at which investors purchase this invoice (usually less than total_amount, allowing them to earn a return)
    pub purchase_price: u64, // the amount to be raised for financing (invoice purchase price)
    pub contributors: [Contribution; 64],

    // --- 1-byte aligned fields last ---
    pub risk_rating: u8,
    pub contributor_count: u8,
    pub status: u8,

    // Add padding to make the account size a multiple of 8
    pub _padding: [u8; 5],
}

#[zero_copy]
#[repr(C)]
pub struct Contribution {
    pub contributor: Pubkey,
    pub amount: u64,
}

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum InvoiceStatus {
    Funding,   // 0
    Financed,  // 1
    Repaid,    // 2
    Defaulted, // 3
}
