/// Creates a new bridge configuration.
use crate::{
    constants::{ DECIMALS9, GLOBAL_CONFIG, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG },
    errors::ErrorCode,
    BridgeConfig,
    SupportedChainConfig,
    TokenConfig,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;


pub fn add_chain_token<'info>(
    ctx: Context<'_, '_, 'info, 'info, AddChainToken<'info>>,
    _chain_id: u8,
    supported_chain_id: u8,
    token_id: u8,
    token_fee_percentages: u64,
    token_min_amount: u64,
    withdraw_paused: bool
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    let token_config = &mut ctx.accounts.token_config;

    if bridge_config.chain_id == supported_chain_id {
        return err!(ErrorCode::ChainIdShouldDiffFromSolanaChainId);
    }
    if !token_config.is_initialized {
        token_config.chain_id = supported_chain_id;
        token_config.token_id = token_id;
        token_config.token_fee_percentage = token_fee_percentages;
        token_config.token_min_amount = token_min_amount;
        token_config.native = false;
        token_config.mint_total = 0;
        token_config.decimal = DECIMALS9;
        token_config.withdraw_paused = withdraw_paused;
        token_config.is_initialized = true;
    } else {
        token_config.token_fee_percentage = token_fee_percentages;
        token_config.token_min_amount = token_min_amount;
        token_config.withdraw_paused = withdraw_paused;
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(_chain_id: u8,supported_chain_id:u8, token_id: u8)]
pub struct AddChainToken<'info> {
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
        seeds = [SUPPORTED_CHAINS_CONFIG.as_ref(), supported_chain_id.to_be_bytes().as_ref()],
        bump
    )]
    pub supported_chain_config: Box<Account<'info, SupportedChainConfig>>,

    #[account(
        init_if_needed,
        payer = payer,
        space = TokenConfig::LEN,
        seeds = [
            TOKEN_CONFIG.as_ref(),
            supported_chain_id.to_be_bytes().as_ref(),
            token_id.to_be_bytes().as_ref(),
        ],
        bump
    )]
    pub token_config: Box<Account<'info, TokenConfig>>,

    pub system_program: Program<'info, System>,
}
