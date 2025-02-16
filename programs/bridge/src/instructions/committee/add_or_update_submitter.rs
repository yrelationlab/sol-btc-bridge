use crate::{
    bridge::BridgeConfig,
    constants::{ COMMITTEE_SUBMITTER_CONFIG, GLOBAL_CONFIG },
    errors::ErrorCode,
    Submitter,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;

pub fn add_or_update_submitter<'info>(
    ctx: Context<'_, '_, 'info, 'info, AddOrUpdateSubmitter<'info>>,
    _chian_id: u8,
    is_submitter: bool
) -> Result<()> {
    // submitter
    if !ctx.accounts.submitter_pda.is_initialized {
        ctx.accounts.submitter_pda.submitter = ctx.accounts.submitter.key();
        ctx.accounts.submitter_pda.is_submitter = is_submitter;
    } else {
        ctx.accounts.submitter_pda.is_submitter = is_submitter;
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(_chain_id: u8)]
pub struct AddOrUpdateSubmitter<'info> {
    #[account(mut, )]
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
        space = Submitter::LEN,
        seeds = [COMMITTEE_SUBMITTER_CONFIG.as_ref(), submitter.key().as_ref()],
        bump
    )]
    pub submitter_pda: Box<Account<'info, Submitter>>,

    /// CHECK: Read only
    pub submitter: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
