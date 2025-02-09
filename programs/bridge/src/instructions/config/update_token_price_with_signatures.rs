use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_lang::{ prelude::*, Discriminator };

use crate::bridge::{decode_update_token_price_payload, HasPayload, UpdateTokenPriceMsg};
use crate::instructions::utils::DeserializeMessage;
use crate::constants::{
    ANCHOR_HEADER_LEN,
    COMMITTEE_SUBMITTER_CONFIG,
    GLOBAL_CONFIG,
    NONCE_CONFIG,
};
use crate::errors::ErrorCode;
use crate::{
    find_ata_in_accounts,
    get_commitee_account,
    get_token_pda_bump_seeds,
    required_stake,
    resolve_ed25519_with_index,
    Committee,
    Nonces,
    Operation,
    Submitter,
};


use super::{ BridgeConfig, TokenConfig };
pub fn update_token_price_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpdateTokenPrice<'info>>,
    _chain_id: u8,
    number_of_signatures: u8,
    msg: UpdateTokenPriceMsg
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    let nonce_config = &mut ctx.accounts.nonce;

    if number_of_signatures < 1 {
        return err!(ErrorCode::InsufficientSignatures);
    }

    let mut bitmap: u128 = 0;
    let mut approval_stake: u16 = 0;

    msg!("update_token_price_with_signatures: number_of_signatures={}", number_of_signatures);
    for i in 1..number_of_signatures + 1 {
        msg!("update_token_price_with_signatures: i={}", i);

        let (signer_pubkey, data) = resolve_ed25519_with_index(
            &ctx.accounts.instructions_sysvar,
            i as usize
        )?;

        let message_of_signer: UpdateTokenPriceMsg = UpdateTokenPriceMsg::deserialize_message(
            &data
        )?;
        // check signer_pubkey is allowed
        if message_of_signer != msg {
            return err!(ErrorCode::MessageMismatch);
        }

        if Operation::try_from(msg.message_type) != Ok(Operation::UpdateTokenPrice) {
            return err!(ErrorCode::MessageOpTypeMismatch);
        }

        if bridge_config.chain_id != message_of_signer.chain_id {
            return err!(ErrorCode::ChainIdMismatch);
        }

        nonce_config.nonce += 1;

        let (_, pda_of_committee_config) = get_commitee_account(
            ctx.remaining_accounts.to_vec(),
            &signer_pubkey,
            &ctx.program_id
        )?;
        let account_data = &mut *pda_of_committee_config.try_borrow_mut_data()?;
        let committee_config = Committee::try_from_slice(
            &account_data[ANCHOR_HEADER_LEN..]
        ).map_err(|_| ErrorCode::InvalidSigner)?;

        let mask = 1u128 << committee_config.index;
        if (bitmap & mask) != 0 {
            return err!(ErrorCode::DuplicateSignature);
        }
        bitmap |= mask;
        msg!(
            "InsufficientStake: signer_pubkey={}, committee_config.stake_amount={:?}",
            signer_pubkey,
            committee_config.stake_amount
        );
        approval_stake += committee_config.stake_amount;
    }
    // Ensure the total approval stake meets the required stake
    if approval_stake < required_stake(&msg)? {
        msg!(
            "InsufficientStake: approval_stake={}, required_stake={:?}",
            approval_stake,
            required_stake(&msg)
        );
        return err!(ErrorCode::InsufficientStake);
    }
    
    let (token_id, price)  = decode_update_token_price_payload(&msg.payload())?;

    let (pda_of_token_config_addr, _, _, _) = get_token_pda_bump_seeds(
        ctx.program_id,
        token_id.to_be_bytes()
    );
    let pda_of_token_config = find_ata_in_accounts(
        ctx.remaining_accounts.to_vec(),
        &pda_of_token_config_addr
    ).ok_or(ErrorCode::TokenConfigAddressMissing)?;

    let discriminator = TokenConfig::discriminator();
    let account_data = &mut *pda_of_token_config.try_borrow_mut_data()?;
    let mut token_config = TokenConfig::try_from_slice(&account_data[ANCHOR_HEADER_LEN..]).map_err(
        |_| ProgramError::InvalidAccountData
    )?;
    account_data[..ANCHOR_HEADER_LEN].copy_from_slice(&discriminator);
    token_config.token_price = price;
    token_config.serialize(&mut &mut account_data[ANCHOR_HEADER_LEN..]).map_err(|error| {
        msg!("BridgeConfigSerializationError: error={}", error);
        ErrorCode::BridgeConfigSerializationError
    })?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(_chain_id: u8)]
pub struct UpdateTokenPrice<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub submitter: Signer<'info>,

    #[account(
        constraint = bridge_config.is_initialized @ ErrorCode::BridgeConfigNotInitialized,
        seeds = [
            GLOBAL_CONFIG.as_bytes(),
            &_chain_id.to_be_bytes()
        ],
        bump
    )]
    pub bridge_config: Box<Account<'info, BridgeConfig>>,

    #[account(
        init_if_needed,
        payer = payer,
        space = Nonces::LEN,
        seeds = [NONCE_CONFIG.as_ref(), Operation::UpdateTokenPrice.to_bytes().as_slice()],
        bump
    )]
    pub nonce: Box<Account<'info, Nonces>>,

    #[account(
        constraint = submitter_account.is_initialized @ ErrorCode::SubmitterNotInitialized,
        constraint = submitter_account.is_submitter @ ErrorCode::NotSubmitter,
        seeds = [
            COMMITTEE_SUBMITTER_CONFIG.as_ref(),
            submitter.key().as_ref(),
        ],
        bump
    )]
    pub submitter_account: Box<Account<'info, Submitter>>,

    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

