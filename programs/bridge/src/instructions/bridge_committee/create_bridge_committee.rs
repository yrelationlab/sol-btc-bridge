use crate::{
    constants::{
        DECIMALS9, GLOBAL_CONFIG, HARDCODED_PUBKEY, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG
    }, create_or_allocate_account, errors::BridgeError, BridgeConfig, SupportedChainConfig, TokenConfig
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::{prelude::*, Discriminator};


pub fn create_bridge_committee<'info>(
    ctx: Context<'_, '_, 'info, 'info, CreateBridgeCommittee<'info>>,
    committee: Vec<Pubkey>,      
    stake: Vec<u16>,             
    min_stake_required: u16,     
    submitter: Pubkey,       
) -> Result<()> {
    let committee_length = committee.len();
    
    require!(
        committee_length < 256,
        BridgeError::CommitteeLengthExceedsLimit
    );

    require!(
        committee_length == stake.len(),
        BridgeError::CommitteeAndStakeLengthMismatch
    );

    let mut total_stake: u16 = 0;
    for (i, member) in committee.iter().enumerate() {

        total_stake += stake[i];
    }

    // 检查总权益是否满足最低要求
    require!(
        total_stake >= min_stake_required,
        BridgeError::InsufficientTotalStake
    );

    Ok(())
}

#[derive(Accounts)]
pub struct CreateBridgeCommittee<'info> {
   
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
