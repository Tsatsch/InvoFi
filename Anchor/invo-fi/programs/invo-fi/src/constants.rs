use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const MIN_RISK_RATING: u8 = 1;

#[constant]
pub const MAX_RISK_RATING: u8 = 10;
