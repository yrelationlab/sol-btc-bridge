use crate::{
    constants::MEME_CONFIG,
    state::MemeConfig,
    utils::{create_associated_token_account_ifn_init, get_pool_token_authority},
};

use anchor_lang::solana_program::sysvar::{
    clock::Clock, instructions as instructions_sysvar_module,
};
use anchor_spl::associated_token::get_associated_token_address;
use {
    crate::{
        constants::{AUTHORITY_SEED, MEME_USER_DATA},
        errors::MemooError,
        state::MemeUserIdoData,
        utils,
    },
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{self, Mint, Token, Transfer},
    },
};
pub fn creator_claim_whitelist<'info>(
    ctx: Context<'_, '_, '_, 'info, CreatorClaimWhitelist<'info>>,
    _meme_id: Pubkey,
) -> Result<()> {
    msg!("creator_claim_whitelist: meme_id={}", _meme_id);

    let meme_config = &mut ctx.accounts.meme_config;

    let (order_signer_pubkey, whitelist) = utils::resolve(&ctx.accounts.instructions_sysvar)?;

    if meme_config.platform != (order_signer_pubkey) {
        return err!(MemooError::PlatformAccountMismatch);
    }
    let whitelist_message = utils::deserialize_whitelist_message(&whitelist)?;

    let now = Clock::get()?.unix_timestamp;
    if i64::try_from(whitelist_message.expiry).unwrap() < now {
        return err!(MemooError::Expired);
    }

    require!(
        whitelist_message.meme == meme_config.id,
        MemooError::MemeIDMismatch
    );

    // // create 0 still store all data
    let meme_user_data = &mut ctx.accounts.meme_user_data;
    let meme_user_data_creator = &mut ctx.accounts.meme_user_data_creator;

    for item in whitelist_message.items.iter() {
        msg!("address: {}, percent: {}", item.address, item.percent);
    }

    // add orignal count should not bigger than permission
    let percent: u8 = whitelist_message
        .items
        .iter()
        .map(|item| item.percent)
        .sum();

    require!(
        percent == 100,
        MemooError::DeserializeWhitelistPercentageNotEQ100
    );

    let find_ata_in_accounts = |ata_pubkey: &Pubkey| {
        ctx.remaining_accounts
            .iter()
            .find(|ac| ac.key.eq(&ata_pubkey))
    };

    let (pool_token_authority, pool_token_authority_bump) = get_pool_token_authority(
        &meme_config.id,
        ctx.program_id,
        &ctx.accounts.mint_a.to_account_info().key(),
    )?;
    let pool_authority_a =
        find_ata_in_accounts(&pool_token_authority).ok_or(MemooError::PoolAuthorityAtaMissing)?;
    let pool_account_a_pda_key =
        get_associated_token_address(&pool_token_authority, &ctx.accounts.mint_a.key());
    let pool_account_a =
        find_ata_in_accounts(&pool_account_a_pda_key).ok_or(MemooError::PoolTokenAtaMissing)?;
    let authority_seeds_a = &[
        AUTHORITY_SEED.as_bytes(),
        &_meme_id.to_bytes(),
        &ctx.accounts.mint_a.key().to_bytes(),
        &[pool_token_authority_bump],
    ];
    let signer_seeds_a = &[&authority_seeds_a[..]];

    // must get creator
    let shared_count = meme_user_data_creator.creator_team_count;
    for item in whitelist_message.items.iter() {
        let amount = shared_count * item.percent as u64 / 100u64;
        let whitelist_account_a_pda_key =
            get_associated_token_address(&item.address, &ctx.accounts.mint_a.key());
        let whitelist_account_a = find_ata_in_accounts(&whitelist_account_a_pda_key)
            .ok_or(MemooError::WhitelistATAMissing)?;

        // claim himself
        if ctx.accounts.payer.key() == item.address {
            create_associated_token_account_ifn_init(
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.mint_a.to_account_info(),
                whitelist_account_a.to_account_info(),
                ctx.accounts.associated_token_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            )?;

            require!(
                meme_user_data.creator_team_count_claimed == 0,
                MemooError::WhitelistAlreadyClaimed
            );
            if meme_user_data.key() == meme_user_data_creator.key() {
                // do not know why meme_user_data for creator0 can not set by meme_user_data
                meme_user_data_creator.creator_team_count_claimed += amount;
            } else {
                meme_user_data.creator_team_count_claimed += amount;
            }

            if amount > 0 {
                //transfer token a to  whitelist
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: pool_account_a.to_account_info(),
                            to: whitelist_account_a.to_account_info(),
                            authority: pool_authority_a.to_account_info(),
                        },
                        signer_seeds_a,
                    ),
                    amount,
                )?;
            }
        }
    }

    msg!(
        "creator_claim_whitelist: shared_count={}, meme_id={}, meme_user_data_pda={}, creator_team_count_claimed={}",
        shared_count,
        _meme_id,
        meme_user_data.key(),
        meme_user_data.creator_team_count_claimed
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(_meme_id: Pubkey)]
pub struct CreatorClaimWhitelist<'info> {
    //creator
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: AccountInfo is an unchecked account, any account can be passed in
    pub creator: AccountInfo<'info>,

    #[account(
        mut,
        constraint = meme_config.is_initialized @ MemooError::MemeConfigIsNotInitialized,
        constraint = meme_config.creator == creator.key() @ MemooError::CreatorMissing,
        seeds = [
            MEME_CONFIG.as_ref(),
            _meme_id.as_ref(),
        ],
        bump
    )]
    pub meme_config: Box<Account<'info, MemeConfig>>,

    #[account(
        init_if_needed,
        payer = payer,
        space = MemeUserIdoData::LEN,
        seeds = [
            MEME_USER_DATA.as_ref(),
            _meme_id.as_ref(),
            payer.key().as_ref()
        ],
        bump
    )]
    pub meme_user_data: Box<Account<'info, MemeUserIdoData>>,

    #[account(
        mut,
        seeds = [
            MEME_USER_DATA.as_ref(),
            _meme_id.as_ref(),
            creator.key().as_ref()
        ],
        bump
    )]
    pub meme_user_data_creator: Box<Account<'info, MemeUserIdoData>>,

    // Create new mint account
    pub mint_a: Box<Account<'info, Mint>>,

    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
