/// Creates a new bridge configuration.
use crate::{
    bridge::{ verify, ChainTokenLimiter, Nonces, Operation, Submitter, SupportedChainConfig, TokenConfig, UpdateLimiterMsg },
    constants::{
        COMMITTEE_SUBMITTER_CONFIG,
        GLOBAL_CONFIG,
        LIMITER_CONFIG,
        NONCE_CONFIG,
        SUPPORTED_CHAINS_CONFIG,
        TOKEN_CONFIG,
    },
    errors::ErrorCode,
    BridgeConfig,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;

pub fn add_or_update_limiter_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, AddOrUpdateLimiter<'info>>,
    number_of_signatures: u8,
    msg: UpdateLimiterMsg
) -> Result<()> {
    let limiter = &mut ctx.accounts.limiter;

    let nonce_config = &mut ctx.accounts.nonce;

    verify(
        &ctx.remaining_accounts,
        &ctx.accounts.instructions_sysvar,
        ctx.program_id,
        number_of_signatures,
        &msg,
        Operation::UpdateBridgeLimit,
        nonce_config
    )?;

    if !limiter.is_initialized {
        limiter.is_initialized = true;
        limiter.chain_id = msg.chain_id;
        limiter.token_id = msg.token_id;
        limiter.total_limit = msg.total_limit;
        limiter.oldest_hour = current_hour();
        limiter.hourly_transfers = [0; 24];
    } else {
        limiter.total_limit = msg.total_limit;
    }
    emit!(LimitUpdated {
        chain_id: limiter.chain_id,
        token_id: limiter.token_id,
        total_limit: msg.total_limit,
    });
    Ok(())
}

// 事件定义
#[event]
pub struct LimitUpdated {
    pub chain_id: u8,
    pub token_id: u8,
    pub total_limit: u64,
}

#[derive(Accounts)]
#[instruction(number_of_signatures: u8, msg: UpdateLimiterMsg)]
pub struct AddOrUpdateLimiter<'info> {
    /// The submitter calls it
    #[account(mut)]
    pub submitter: Signer<'info>,

    #[account(
        constraint = submitter_account.is_submitter @ ErrorCode::NotSubmitter,
        seeds = [
            COMMITTEE_SUBMITTER_CONFIG.as_ref(),
            submitter.key().as_ref(),
        ],
        bump
    )]
    pub submitter_account: Box<Account<'info, Submitter>>,

    #[account(seeds = [GLOBAL_CONFIG.as_bytes(), &msg.chain_id.to_be_bytes()], bump)]
    pub bridge_config: Account<'info, BridgeConfig>,

    #[account(
        mut,
        seeds = [
            SUPPORTED_CHAINS_CONFIG.as_ref(),
            msg.target_chain_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = supported_chain_config.is_initialized @ ErrorCode::SupportedChainConfigNotInitialized,
        constraint = supported_chain_config.supported @ ErrorCode::SupportedChainConfigNoSupported,
    )]
    pub supported_chain_config: Box<Account<'info, SupportedChainConfig>>,

    #[account(
        mut,
        seeds = [
            TOKEN_CONFIG.as_ref(),
            msg.target_chain_id.to_be_bytes().as_ref(),
            msg.token_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = token_config.is_initialized @ ErrorCode::TokenConfigNotInitialized,
        constraint = !token_config.withdraw_paused @ ErrorCode::WithdrawPaused
    )]
    pub token_config: Box<Account<'info, TokenConfig>>,

    #[account(
        init_if_needed,
        payer = submitter,
        space = Nonces::LEN,
        seeds = [NONCE_CONFIG.as_ref(), Operation::UpdateBridgeLimit.to_bytes().as_slice()],
        bump
    )]
    pub nonce: Box<Account<'info, Nonces>>,

    #[account(
        init_if_needed,
        payer = submitter,
        space = ChainTokenLimiter::LEN,
        seeds = [
            LIMITER_CONFIG.as_bytes(),
            &msg.target_chain_id.to_be_bytes(),
            &msg.token_id.to_be_bytes(),
        ],
        bump
    )]
    pub limiter: Account<'info, ChainTokenLimiter>,
    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// 时间工具函数
fn current_hour() -> u32 {
    (Clock::get().unwrap().unix_timestamp as u32) / 3600
}

// 检查并记录转账
pub fn check_transfer<'info>(
    limiter: &mut Account<'info, ChainTokenLimiter>,
    amount: u64
) -> Result<()> {
    let current_h = current_hour();

    // 计算经过的小时数（处理 u32 溢出）
    let hours_passed = current_h.wrapping_sub(limiter.oldest_hour);

    if hours_passed > 0 {
        // 计算需要清除的槽位数量（最多24小时）
        let slots_to_clear = std::cmp::min(hours_passed, 24) as usize;

        // 环形缓冲区索引计算
        let start_idx = (limiter.oldest_hour % 24) as usize;

        // 清除过期数据并推进起始时间
        for i in 0..slots_to_clear {
            let idx = (start_idx + i) % 24;
            limiter.hourly_transfers[idx] = 0;
        }

        limiter.oldest_hour = limiter.oldest_hour.wrapping_add(slots_to_clear as u32);
    }

    // 获取当前小时对应的槽位
    let current_slot = (current_h % 24) as usize;

    // 检查总限额
    let total: u64 = limiter.hourly_transfers.iter().sum();
    require!(total + amount <= limiter.total_limit, ErrorCode::TransferLimitExceeded);

    // 更新当前小时数据
    limiter.hourly_transfers[current_slot] += amount;

    Ok(())
}
