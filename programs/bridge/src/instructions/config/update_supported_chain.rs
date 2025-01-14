use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;

use crate::{
    errors::ErrorCode,
    utils,
    SupportedChainConfig,
    UpdateSupportedChainMessage, // 反序列化后的结构, 包含 chain_id, new_supported 等
};

/// 多签验证后，更新某个链的 supported 状态或其他字段
pub fn update_supported_chain_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpdateSupportedChain<'info>>,
    msg: UpdateSupportedChainMessage,
    number_of_signatures: u8,
) -> Result<()> {
    // 1) 检查签名数量
    if number_of_signatures < 1 {
        return err!(ErrorCode::InsufficientSignatures);
    }

    // 2) 遍历签名
    for i in 0..number_of_signatures {
        // (signer_pubkey, data) = 读取第 i 条验证指令
        let (_signer_pubkey, data) =
            utils::resolve_secp256k1_with_index(&ctx.accounts.instructions_sysvar, i as usize)?;
        // 反序列化出一份 message
        let message_of_signer = utils::deserialize_update_supported_chain_message(&data)?;

        // 如果签名消息与本次提交的 msg 不一致，则报错
        if message_of_signer != msg {
            return err!(ErrorCode::MessageMismatch);
        }
    }

    // 3) update chain_config
    let chain_config = &mut ctx.accounts.chain_config;

    // 根据 msg 的内容更新 supported 字段或其他需要更新的字段
    chain_config.supported = msg.supported;

    // 如果还想更新别的字段，可以继续写:
    // chain_config.is_initialized = true;  // 仅示例

    msg!(
        "Chain {} updated: supported={}",
        chain_config.chain_id,
        chain_config.supported
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(msg: UpdateSupportedChainMessage, number_of_signatures: u8)]
pub struct UpdateSupportedChain<'info> {
    /// 要更新的 SupportedChain PDA
    #[account(
        mut,
        seeds = [
            crate::constants::SUPPORTED_CHAINS_CONFIG.as_bytes(),
            &msg.chain_id.to_be_bytes()
        ],
        bump,
        constraint = chain_config.is_initialized == true @ ErrorCode::SupportedChainNotInitialized
    )]
    pub chain_config: Account<'info, SupportedChainConfig>,

    /// 由某个管理员或硬编码地址来操作
    #[account(
        mut,
        address = crate::constants::HARDCODED_PUBKEY @ ErrorCode::InvalidAdminAddress
    )]
    pub payer: Signer<'info>,

    /// CHECK: Sysvar Instruction, 用来读取多条指令
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
