use anchor_lang::prelude::*;

/// use update method to update
#[account]
#[derive(Default)]
pub struct GlobalMemooConfig {
    /// The primary key of the MemooConfig
    pub id: Pubkey,

    /// Account that has admin authority over the MemooConfig
    pub admin: Pubkey,

    /// Account that has platform authority over the MemooConfig
    pub platform: Pubkey,

    /// createFee, idoFee
    pub platform_fee_recipient: Pubkey,

    /// 1 - 1 of 1/7
    pub platform_fee_rate_ido: u16,

    /// 2 - 7 of 1/7
    pub platform_fee_rate_denominator_ido: u16,

    /// 3 - 3000
    pub ido_creator_buy_limit: u16,

    /// 4 - 500
    pub token_allocation_creator: u16,

    /// 5 - 3500
    pub token_allocation_ido: u16,

    /// 6 - 5500
    pub token_allocation_lp: u16,

    /// 7 - 200
    pub token_allocation_airdrop: u16,

    ///  8 - 300
    pub token_allocation_platform: u16,

    /// 9 -idoUserBuyLimit
    pub ido_user_buy_limit: u16,

    /// idoPrice
    pub ido_price: u64,

    /// idoPrice
    pub airdrop_price: u64,

    /// 10 - the fee of create meme
    pub platform_fee_create_meme_sol: u64,

    // Raydium open time
    pub open_time: i64,

    /// totalSupply
    /// 340282366920938463463374607431768211455
    pub total_supply: u128,

     /// 11 - the fee of create meme
     pub share_create_fee_number: u64, //use one padding

    /// padding
    pub padding: [u64; 15], 
}

impl GlobalMemooConfig {
    pub const LEN: usize = 8 + 32 * 4 + 2 * 9 + 8 * 4 + 16 * 1 + 8 * 16;
}

/// update many times
#[account]
#[derive(Default)]
pub struct MemeConfig {
    /// check ido_end
    pub ido_end: bool, // 1 byte

    /// init or check id
    pub is_initialized: bool, // 1 byte

    /// The primary key of the Meme,
    pub id: Pubkey,

    /// Account that has admin authority
    pub admin: Pubkey,

    /// Account that has platform authority over the MemooConfig
    pub platform: Pubkey,

    /// pool a
    pub pool_a: Pubkey,

    /// pool wsol
    pub pool_wsol: Pubkey,

    /// Account of User
    pub creator: Pubkey,

    /// mint token address
    pub mint_token_address: Pubkey,

    /// Creator lock total
    pub creator_total: u64,

    /// Platform lock total
    pub platform_total: u64,

    /// Meme Create Timestamp
    pub create_timestamp: i64,

    /// preLaunch Second
    pub pre_launch_second: i64,

    /// ido count
    pub meme_ido_count: u64,

    /// airdrop count
    pub meme_airdrop_count: u64,

    /// airdrop count
    pub meme_airdrop_total: u64,

    /// ido money
    pub meme_ido_money: u64,

    /// totalSupply, may be samller than GlobalMemooConfig.total_supply
    pub total_supply: u128,

    pub platform_fee_ido_wsol: u64, // use one padding

    pub platform_fee_ido_token: u64, // use one padding

    pub init_lp: Pubkey, // 32 = use 4 padding * 8

    pub share_create_fee_number: u64, // use 1 padding

    pub share_create_fee: u64, // use 1 padding

    pub refund_flag: u64, // use 1 padding, 0 is not refundable, 1 is refundable

    /// padding
    pub padding: [u64; 7],
}

impl MemeConfig {
    pub const LEN: usize = 8 + 1 * 2 + 32 * 7 + 8 * 8 + 16 * 1 + 8 * 16;
}

#[account]
#[derive(Default)]
pub struct MemeUserIdoData {
    /// init or check id
    pub is_initialized: bool, // 1 byte

    /// The primary key of the Meme, this is key
    pub meme_id: Pubkey,

    /// Account of User, this is key
    pub user: Pubkey,

    /// ido buy count
    pub meme_user_ido_count: u64, // 8 bytes

    /// ido buy count, have been claimed
    pub meme_user_ido_claimed_count: u64, // 8 bytes

    /// Spend money
    pub meme_user_ido_money: u64,

    /// Creator unlock total (amount of token has been claimed by creator)
    pub creator_unlock_count: u64, // 8 bytes

    /// Creator unlock count permission
    pub creator_unlock_count_permission: u64, // 8 bytes

    /// Creator lock period
    pub creator_unlock_period: u64, // 8 bytes

    /// ido buy count
    pub meme_user_airdrop_claimed_count: u64, // 8 bytes

    /// ido buy fee
    pub share_create_fee: u64, // use one padding

    pub refund: u64, // use 1 padding, 0 is not refundable, 1 is refundable

    // creator set team whitelist to share tokens
    pub creator_team_count : u64, // use one padding

    pub creator_team_money : u64, // use one padding

    pub creator_team_count_claimed : u64, // use one padding

    /// padding
    pub padding: [u64; 11],
}

impl MemeUserIdoData {
    pub const LEN: usize = 8 + 1 + 32 * 2 + 8 * 7 + 8 * 16;
}
