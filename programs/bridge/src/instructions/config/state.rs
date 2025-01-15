use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct BridgeConfig {
    pub is_initialized: bool, // 1 byte
    pub chain_id: u8,
    pub admin: Pubkey,
    pub fee_recipient: Pubkey,
    /// padding
    pub padding: [u64; 16],
}
impl BridgeConfig {
    pub const LEN: usize = 8
        + 1 // isInitialized
        + 1 // chain_id
        + 32 // admin
        + 32 // fee_recipient
        + BridgeConfig::LEN_OF_PADDING * 8 // padding
        ;
    pub const LEN_OF_PADDING: usize = 16; //128 bytes padding
}
#[account]
#[derive(Default)]
pub struct TokenConfig {
    pub is_initialized: bool, // 1 byte
    pub token_id: u8,
    pub chain_id: u8,
    pub token_address: Pubkey,
    pub decimal: u8,
    pub native: bool,
    pub token_price: u64,
    pub token_fee_percentage: u64,
    pub token_min_amount: u64,
    /// padding
    pub padding: [u64; 16],
}
impl TokenConfig {
    pub const LEN: usize = 8
    + 1 // isInitialized
    + 1 // chain_id
    + 1 // token_id
    + 32 // token_address
    + 1 // decimal
    + 1 // native
    + 8 // token_price
    + 8 // token_fee_percentage
    + 8 // token_min_amount
    + TokenConfig::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 16; //128 bytes padding
}

#[account]
#[derive(Default)]
pub struct SupportedChainConfig {
    pub is_initialized: bool, // 1 byte
    pub chain_id: u8,
    pub supported: bool,
    pub mint_total: u128,
    /// padding
    pub padding: [u64; 16],
}
impl SupportedChainConfig {
    pub const LEN: usize = 8
    + 1 // isInitialized
    + 1 // chain_id
    + 1 // supported
    + 16 // mint_total
    + SupportedChainConfig::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 16; //128 bytes padding
}


#[account]
#[derive(Default)]
pub struct Nonces {
    pub is_initialized: bool, // 1 byte
    pub nonce: u64,
    /// padding
    pub padding: [u64; 16],
}
impl Nonces {
    pub const LEN: usize = 8
    + 1 // isInitialized
    + 8 // nonce
    + Nonces::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 16; //128 bytes padding
}
