use crate::{
    bridge::BridgeConfig,
    constants::{ COMMITTEE_CONFIG, GLOBAL_CONFIG },
    errors::ErrorCode,
    Submitter,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;

use super::Committee;

pub fn add_or_update_committee<'info>(
    ctx: Context<'_, '_, 'info, 'info, AddOrUpdateCommittee<'info>>,
    _chian_id: u8,
    committee: Pubkey,
    stake: u16,
    is_blocklisted: bool
) -> Result<()> {   
    // submitter
    let committee_config = &mut ctx.accounts.committee_config;
    if !committee_config.is_initialized {
        ctx.accounts.committee_config.is_initialized = true;
        ctx.accounts.committee_config.index = committee;
        ctx.accounts.committee_config.stake_amount = stake;
        ctx.accounts.committee_config.is_blocklisted = is_blocklisted;
    } else {
        ctx.accounts.committee_config.index = committee;
        ctx.accounts.committee_config.stake_amount = stake;
        ctx.accounts.committee_config.is_blocklisted = is_blocklisted;
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(_chain_id: u8, committee:Pubkey)]
pub struct AddOrUpdateCommittee<'info> {
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
        space = Committee::LEN,
        seeds = [COMMITTEE_CONFIG.as_ref(), committee.key().as_ref()],
        bump
    )]
    pub committee_config: Box<Account<'info, Committee>>,

    pub system_program: Program<'info, System>,
}
