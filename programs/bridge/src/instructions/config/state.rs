use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct BridgeConfig {
    pub is_initialized: bool, // 1 byte
    pub withdraw_paused: bool,
    pub chain_id: u8,
    pub admin: Pubkey,
    pub fee_recipient: Pubkey,
    pub sbtc_mint: Pubkey,
    /// padding
    pub padding: [u64; 10],
}
impl BridgeConfig {
    pub const LEN: usize = 8
        + 1 // isInitialized
        + 1 // withdraw_paused
        + 1 // chain_id
        + 32 // admin
        + 32 // fee_recipient
        + 32 // sbtc_mint
        + BridgeConfig::LEN_OF_PADDING * 8 // padding
        ;
    pub const LEN_OF_PADDING: usize = 10; //128 bytes padding
}
#[account]
#[derive(Default)]
pub struct TokenConfig {
    pub is_initialized: bool, // 1 byte
    pub withdraw_paused: bool,
    pub token_id: u8,
    pub chain_id: u8,
    pub native: bool,
    pub token_fee_percentage: u64,
    pub token_min_amount: u64,
    pub mint_total: u128,
    /// padding
    pub padding: [u64; 10],
}
impl TokenConfig {
    pub const LEN: usize = 8
    + 1 // isInitialized
    + 1 // withdraw_paused
    + 1 // chain_id
    + 1 // token_id
    + 1 // native
    + 8 // token_fee_percentage
    + 8 // token_min_amount
    + 16 // mint_total
    + TokenConfig::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 10; //128 bytes padding
}

#[account]
#[derive(Default)]
pub struct SupportedChainConfig {
    pub is_initialized: bool, // 1 byte
    pub chain_id: u8,
    pub supported: bool,
    pub mint_total: u128,
    /// padding
    pub padding: [u64; 10],
}
impl SupportedChainConfig {
    pub const LEN: usize = 8
    + 1 // isInitialized
    + 1 // chain_id
    + 1 // supported
    + 16 // mint_total
    + SupportedChainConfig::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 10; //128 bytes padding
}


#[account]
#[derive(Default)]
pub struct Nonces {
    pub is_initialized: bool, // 1 byte
    pub nonce: u64,
    /// padding
    pub padding: [u64; 10],
}
impl Nonces {
    pub const LEN: usize = 8
    + 1 // isInitialized
    + 8 // nonce
    + Nonces::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 10; //128 bytes padding
}
