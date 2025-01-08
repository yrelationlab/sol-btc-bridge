use anchor_lang::prelude::*;

// 这个当参数测试跑不过，不知道为啥
#[account]
// #[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MemooConfigParam {
    /// The primary key of the MemooConfig
    pub id: Pubkey,

    /// 1 of 1/7
    pub platform_fee_rate_ido: u16,

    /// 7 of 1/7
    pub platform_fee_rate_denominator_ido: u16,

    /// the fee of create meme
    pub platform_fee_create_meme: u16,

    ///  3000
    pub ido_creator_buy_limit: u16,

    ///  500
    pub token_allocation_creator: u16,

    ///  3500
    pub token_allocation_ido: u16,

    ///  5500
    pub token_allocation_lp: u16,

    ///  200
    pub token_allocation_airdrop: u16,

    ///  300
    pub token_allocation_platform: u16,

    /// idoPrice
    pub ido_price: u64,

    /// idoPrice
    pub airdrop_price: u64,

    /// totalSupply
    pub total_supply: u64,

    /// idoUserBuyLimit
    pub ido_user_buy_limit: u64,
}
