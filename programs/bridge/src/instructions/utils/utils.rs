use crate::{
    constants::{ COMMITTEE_CONFIG, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG },
    errors::ErrorCode,
};
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::{
    create as create_associated_token,
    Create as CreateAssociatedToken,
};

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct UpdateSupportedChainMessage {
    pub chain_id: u8,
    pub supported: bool,
}
pub fn deserialize_update_supported_chain_message(
    data: &Vec<u8>
) -> Result<UpdateSupportedChainMessage> {
    match UpdateSupportedChainMessage::try_from_slice(data) {
        Ok(order) => Ok(order),
        Err(_) => err!(ErrorCode::DeserializeMessageError),
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct TokenTransferPayload {
    pub sender_address_length: u8,
    pub sender_address: Vec<u8>,
    pub target_chain: u8,
    pub recipient_address_length: u8,
    pub recipient_address: [u8; 32],
    pub token_id: u8,
    pub amount: u64,
}

pub fn create_account<'a>(
    program_id: &Pubkey,
    payer: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    target_account: AccountInfo<'a>,
    siger_seed: &[&[u8]],
    space: usize
) -> Result<()> {
    let rent = Rent::get()?;
    let current_lamports = target_account.lamports();
    if current_lamports == 0 {
        let lamports = rent.minimum_balance(space);
        let cpi_accounts = system_program::CreateAccount {
            from: payer,
            to: target_account.clone(),
        };
        let cpi_context = CpiContext::new(system_program.clone(), cpi_accounts);
        system_program::create_account(
            cpi_context.with_signer(&[siger_seed]),
            lamports,
            u64::try_from(space).unwrap(),
            program_id
        )?;
    }
    Ok(())
}

pub fn get_token_pda_bump_seeds(
    program_id: &Pubkey,
    chain_id: &[u8],
    token_id: &[u8]
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[TOKEN_CONFIG.as_ref(), chain_id, token_id];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds
        .iter()
        .map(|s| s.to_vec())
        .collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
}

pub fn get_support_chains_pda_bump_seeds(
    program_id: &Pubkey,
    chain_id_bytes: [u8; 1]
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[SUPPORTED_CHAINS_CONFIG.as_ref(), chain_id_bytes.as_ref()];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds
        .iter()
        .map(|s| s.to_vec())
        .collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
}

pub fn get_commitee_account<'info>(
    remaining_accounts: Vec<AccountInfo<'info>>,
    committee_address: &Pubkey,
    program_id: &Pubkey
) -> Result<(Vec<Vec<u8>>, AccountInfo<'info>)> {
    let (pda_of_committee_config_address, _, _, signer_seeds) = get_committee_config_pda_bump_seeds(
        committee_address,
        program_id
    );
    let pda_of_committee_config = find_ata_in_accounts(
        remaining_accounts.to_vec(),
        &pda_of_committee_config_address
    ).ok_or(ErrorCode::CommitteeConfigAddressMissing)?;
    Ok((signer_seeds, pda_of_committee_config))
}

pub fn get_committee_config_pda_bump_seeds(
    committee_address: &Pubkey,
    program_id: &Pubkey
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[COMMITTEE_CONFIG.as_ref(), committee_address.as_ref()];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds
        .iter()
        .map(|s| s.to_vec())
        .collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
}

pub fn find_ata_in_accounts<'info>(
    remaining_accounts: Vec<AccountInfo<'info>>,
    ata_pubkey: &Pubkey
) -> Option<AccountInfo<'info>> {
    remaining_accounts
        .iter()
        .find(|ac: &&AccountInfo<'info>| ac.key.eq(ata_pubkey))
        .cloned()
}

pub fn create_associated_token_account_ifn_init<'info>(
    payer: AccountInfo<'info>,
    owner: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    associated_token_account: AccountInfo<'info>,
    associated_token_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>
) -> Result<()> {
    if associated_token_account.data_is_empty() {
        create_associated_token(
            CpiContext::new(associated_token_program, CreateAssociatedToken {
                payer,
                authority: owner,
                mint,
                associated_token: associated_token_account,
                system_program,
                token_program,
            })
        )?;
    }
    Ok(())
}
