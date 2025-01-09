
use anchor_lang::prelude::*;

#[account]
pub struct BridgeConfig {
    pub chain_id: u8,
    pub admin: Pubkey,
    pub fee_recipient: Pubkey,
    /// padding
    pub padding: [u8; 128],
}
impl BridgeConfig {
    pub const LEN: usize = 8
        + 1 // chain_id
        + 32 // admin
        + 32 // fee_recipient
        + 128 // padding
        ;
}
#[account]
pub struct BridgeConfigOfToken {
    pub chain_id: u8,
    pub token_address: Pubkey,
    pub decimal: u8,
    pub native: bool,
    pub token_price: u64,
    pub token_fee_percentage: u64,
    pub token_min_amount: u64,
    /// padding
    pub padding: [u8; 128],
}
impl BridgeConfigOfToken {
    pub const LEN: usize = 8
    + 32 // token_address
    + 1 // decimal
    + 1 // native
    + 8 // token_price
    + 8 // token_min_amount
    + BridgeConfigOfToken::LEN_OF_PADDING // padding
    ;
    pub const LEN_OF_PADDING: usize = 128; //128 bytes padding
}
