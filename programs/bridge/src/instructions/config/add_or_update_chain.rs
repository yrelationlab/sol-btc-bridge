/// Creates a new bridge configuration.
use crate::{
    constants::{ GLOBAL_CONFIG, SUPPORTED_CHAINS_CONFIG },
    errors::ErrorCode,
    BridgeConfig,
    SupportedChainConfig,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;


pub fn add_or_update_chain<'info>(
    ctx: Context<'_, '_, 'info, 'info, AddChain<'info>>,
    _chain_id: u8,
    supported_chain_id: u8,
    supported: bool
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    let supported_chain_config = &mut ctx.accounts.supported_chain_config;

    if bridge_config.chain_id == supported_chain_id {
        return err!(ErrorCode::ChainIdShouldDiffFromSolanaChainId);
    }

    if !supported_chain_config.is_initialized {
        supported_chain_config.chain_id = supported_chain_id;
        supported_chain_config.mint_total = 0;
        supported_chain_config.supported = supported;
        supported_chain_config.is_initialized = true;
    } else {
        supported_chain_config.supported = supported;
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(_chain_id: u8, supported_chain_id:u8)]
pub struct AddChain<'info> {
    /// The account paying for all rents
    #[account(
        mut,
    )]
    pub payer: Signer<'info>,

    #[account(
        constraint = bridge_config.admin == payer.key() @ ErrorCode::InvalidAdminAddress,
        seeds = [GLOBAL_CONFIG.as_bytes(), &_chain_id.to_be_bytes()],
        bump
    )]
    pub bridge_config: Account<'info, BridgeConfig>,

    #[account(
        init_if_needed,
        payer = payer,
        space = SupportedChainConfig::LEN,
        seeds = [SUPPORTED_CHAINS_CONFIG.as_ref(), supported_chain_id.to_be_bytes().as_ref()],
        bump
    )]
    pub supported_chain_config: Box<Account<'info, SupportedChainConfig>>,

    pub system_program: Program<'info, System>,
}
