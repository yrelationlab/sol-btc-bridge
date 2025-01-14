use anchor_lang::prelude::*;
use solana_program::pubkey;
#[constant]
pub const GLOBAL_CONFIG: &str = "GLOBAL_CONFIG";
#[constant]
pub const NONCE_CONFIG: &str = "NONCE_CONFIG";
#[constant]
pub const TOKEN_CONFIG: &str = "TOKEN_CONFIG";
#[constant]
pub const COMMITTEE_CONFIG: &str = "COMMITTEE_CONFIG";
#[constant]
pub const COMMITTEE_SUBMITTER_CONFIG: &str = "COMMITTEE_SUBMITTER_CONFIG";
#[constant]
pub const SUPPORTED_CHAINS_CONFIG: &str = "SUPPORTED_CHAINS_CONFIG";
// #[constant]
// pub const AUTHORITY_SEED: &str = "authority";
#[constant]
pub const DECIMALS9: u8 = 9;
#[constant]
pub const ANCHOR_HEADER_LEN: usize = 8;

#[constant]
// Hardcoded pubkey for create memoo config
pub const HARDCODED_PUBKEY: Pubkey = pubkey!("admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV");


