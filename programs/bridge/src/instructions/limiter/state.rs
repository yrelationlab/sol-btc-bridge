use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ChainTokenLimiter {
    pub is_initialized: bool, // 1 byte
    pub chain_id: u8,
    pub token_id: u8,
    pub total_limit: u64, // 24小时总限额
    pub oldest_hour: u32, // 环形缓冲区起点时间戳（小时单位）
    pub hourly_transfers: [u64; 24], // 24小时环形缓冲区
}

// 实现辅助函数
impl ChainTokenLimiter {
    pub const LEN: usize =
        8 +
        1 + // is_initialized
        1 + // chain_id
        1 + //token_id
        8 + //total_limit
        4 + //oldest_hour
        24 * 8; // 计算账户大小
}
