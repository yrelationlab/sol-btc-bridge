use anchor_lang::prelude::*;


#[account]
#[derive(Default)]
pub struct ChainTokenLimiter {
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
        1 + // chain_id
        1 + //token_id
        8 + //total_limit
        4 + //oldest_hour
        24 * 8; // 计算账户大小

    // fn update_time_window(limiter: &mut ChainTokenLimiter) -> Result<(), ProgramError> {
    //     let current_hour = current_hour_timestamp()?;
    //     let hours_passed = current_hour.saturating_sub(limiter.oldest_hour);

    //     match hours_passed {
    //         0 => {} // 无需更新
    //         1..=23 => {
    //             // 部分滚动
    //             limiter.hourly_transfers.rotate_left(hours_passed as usize);
    //             // 清零新时段
    //             for i in (24 - hours_passed) as usize..24 {
    //                 limiter.hourly_transfers[i] = 0;
    //             }
    //             limiter.oldest_hour = current_hour;
    //         }
    //         _ => {
    //             // 超过24小时，完全重置
    //             limiter.hourly_transfers = [0; 24];
    //             limiter.oldest_hour = current_hour;
    //         }
    //     }
    //     Ok(())
    // }
}

// fn current_hour_timestamp() -> Result<u32, ProgramError> {
//     Clock::get()?
//         .unix_timestamp
//         .checked_div(3600)
//         .and_then(|h| h.try_into().ok())
//         .ok_or(ErrorCode::TimeError.into())
// }

// fn check_limit(limiter: &ChainTokenLimiter, amount: u64) -> Result<(), ProgramError> {
//     let window_total = limiter.hourly_transfers.iter().sum::<u64>();
//     require!(
//         window_total + amount <= limiter.total_limit,
//         ErrorCode::TransferLimitExceeded
//     );
//     Ok(())
// }