use crate::{
    constants::{ANCHOR_HEADER_LEN, COMMITTEE_CONFIG, COMMITTEE_SUBMITTER_CONFIG},
    create_account,
    errors::ErrorCode,
    find_ata_in_accounts, get_commitee_account, get_committee_config_pda_bump_seeds, Committee,
    Submitter,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::{prelude::*, Discriminator};

pub fn create_bridge_committee<'info>(
    ctx: Context<'_, '_, 'info, 'info, CreateBridgeCommittee<'info>>,
    committee: Vec<Pubkey>,
    stake: Vec<u16>,
    min_stake_required: u16,
) -> Result<()> {
    let committee_length = committee.len();

    require!(
        committee_length < 256,
        ErrorCode::CommitteeLengthExceedsLimit
    );

    require!(
        committee_length == stake.len(),
        ErrorCode::CommitteeAndStakeLengthMismatch
    );

    let mut total_stake: u16 = 0;
    for (i, committee_address) in committee.iter().enumerate() {
        total_stake += stake[i];
        let (signer_seeds, pda_of_committee_config) = get_commitee_account(
            &ctx.program_id,
            ctx.remaining_accounts.to_vec(),
            committee_address,
        )?;
        create_account(
            &ctx.program_id,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            pda_of_committee_config.clone(),
            &signer_seeds
                .iter()
                .map(|v| v.as_slice())
                .collect::<Vec<&[u8]>>()
                .as_slice(),
            Committee::LEN,
        )?;
        let bridge_committee = Committee {
            is_initialized: true,
            index: i as u8,
            stake_amount: stake[i],
            is_blocklisted: false,
            padding: [0u64; Committee::LEN_OF_PADDING],
        };
        let account_data = &mut *pda_of_committee_config.try_borrow_mut_data()?;
        account_data[..ANCHOR_HEADER_LEN].copy_from_slice(&Committee::discriminator());
        bridge_committee
            .serialize(&mut &mut account_data[ANCHOR_HEADER_LEN..])
            .map_err(|error| {
                msg!("BridgeCommitteeSerializationError: error={}", error);
                ErrorCode::BridgeCommitteeSerializationError
            })?;
    }

    require!(
        total_stake >= min_stake_required,
        ErrorCode::InsufficientTotalStake
    );

    // submitter
    {
        ctx.accounts.submitter_pda.is_initialized = true;
        ctx.accounts.submitter_pda.admin = ctx.accounts.submitter.key();
        ctx.accounts.submitter_pda.is_submitter = true;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CreateBridgeCommittee<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = Submitter::LEN,
        seeds = [
            COMMITTEE_SUBMITTER_CONFIG.as_ref(),
            submitter.key().as_ref(),
        ],
        bump
    )]
    pub submitter_pda: Box<Account<'info, Submitter>>,

    /// CHECK: Read only
    pub submitter: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
