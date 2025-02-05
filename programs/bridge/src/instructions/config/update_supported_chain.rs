use anchor_lang::prelude::*;

use crate::{
    constants::{HARDCODED_PUBKEY, SUPPORTED_CHAINS_CONFIG},
    errors::ErrorCode,
    SupportedChainConfig,
};

/// 由硬编码的管理员更新某个链的 supported 状态或其他字段
pub fn update_supported_chain<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpdateSupportedChain<'info>>,
    _chain_id: u8,
    supported: bool,
) -> Result<()> {
    let chain_config = &mut ctx.accounts.chain_config;

    chain_config.supported = supported;

    msg!(
        "Chain {} updated: supported={}",
        chain_config.chain_id,
        chain_config.supported
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(_chain_id: u8)]
pub struct UpdateSupportedChain<'info> {
    #[account(
        mut,
        seeds = [
            SUPPORTED_CHAINS_CONFIG.as_bytes(),
            &_chain_id.to_be_bytes()
        ],
        bump,
        constraint = chain_config.is_initialized == true @ ErrorCode::SupportedChainNotInitialized
    )]
    pub chain_config: Account<'info, SupportedChainConfig>,

    #[account(
        address = HARDCODED_PUBKEY @ ErrorCode::InvalidAdminAddress
    )]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}
