use crate::{
    constants::{ COMMITTEE_CONFIG, SBTC_MINT, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG },
    errors::ErrorCode,
};
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::{
    create as create_associated_token,
    get_associated_token_address,
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

pub fn create_account_ifn_exist<'a>(
    program_id: &Pubkey,
    payer: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    target_account: AccountInfo<'a>,
    signer_seed: &[&[u8]],
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
            cpi_context.with_signer(&[signer_seed]),
            lamports,
            u64::try_from(space).unwrap(),
            program_id
        )?;
    }
    Ok(())
}

pub fn get_user_account_and_sbtc_ata<'info>(
    remaining_accounts: &'info [AccountInfo<'info>], // 显式指定生命周期
    user: &Pubkey,
    sbtc_mint: &Pubkey
) -> Result<(&'info AccountInfo<'info>, &'info AccountInfo<'info>)> {
    // 返回值也需要明确生命周期
    let ata = get_associated_token_address(user, sbtc_mint);

    let mut user_account: Option<&'info AccountInfo<'info>> = None;
    let mut user_ata_account: Option<&'info AccountInfo<'info>> = None;

    // 单次迭代，提升性能
    for account in remaining_accounts {
        if *account.key == *user {
            user_account = Some(account);
        } else if *account.key == ata {
            user_ata_account = Some(account);
        }
        if user_account.is_some() && user_ata_account.is_some() {
            break; // 提前结束循环，提高效率
        }
    }

    // 明确不同账户缺失的错误信息
    let user_account = user_account.ok_or_else(||
        anchor_lang::error::Error::from(ErrorCode::UserAccountNotFound)
    )?;
    let user_ata_account = user_ata_account.ok_or_else(||
        anchor_lang::error::Error::from(ErrorCode::UserSbtcAtaNotFound)
    )?;

    Ok((user_account, user_ata_account))
}

pub fn fee_recipient_sbtc_ata<'info>(
    remaining_accounts: &'info [AccountInfo<'info>],
    fee_recipient: &Pubkey,
    sbtc_mint: &Pubkey
) -> Result<(&'info AccountInfo<'info>, &'info AccountInfo<'info>)> {
    let ata = get_associated_token_address(fee_recipient, sbtc_mint);

    let mut fee_recipient_account: Option<&AccountInfo<'info>> = None;
    let mut fee_recipient_sbtc_ata_account: Option<&AccountInfo<'info>> = None;

    // 一次迭代找出所有目标账户，提升效率
    for account in remaining_accounts {
        if *account.key == *fee_recipient {
            fee_recipient_account = Some(account);
        } else if *account.key == ata {
            fee_recipient_sbtc_ata_account = Some(account);
        }
        if fee_recipient_account.is_some() && fee_recipient_sbtc_ata_account.is_some() {
            break;
        }
    }

    // 使用自定义错误，区分不同账户未找到的情况
    let fee_recipient_account = fee_recipient_account.ok_or_else(||
        anchor_lang::error::Error::from(ErrorCode::FeeRecipientNotFound)
    )?;

    let fee_recipient_sbtc_ata_account = fee_recipient_sbtc_ata_account.ok_or_else(||
        anchor_lang::error::Error::from(ErrorCode::FeeRecipientSbtcAtaNotFound)
    )?;

    Ok((fee_recipient_account, fee_recipient_sbtc_ata_account))
}

pub fn get_sbtc_mint_account<'info>(
    program_id: &Pubkey,
    remaining_accounts: &'info [AccountInfo<'info>],
    chain_id: &u8
) -> Result<&'info AccountInfo<'info>> {
    let binding = chain_id.to_be_bytes();
    let seeds = &[SBTC_MINT.as_ref(), binding.as_ref()];
    let (pda, _) = Pubkey::find_program_address(seeds, program_id);
    let account = remaining_accounts.iter().find(|ac: &&AccountInfo<'info>| ac.key.eq(&pda));
    account.ok_or_else(|| ErrorCode::AccountNotFound.into())
}

pub fn get_sbtc_mint_bump_seeds(
    program_id: &Pubkey,
    chain_id: &[u8]
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[SBTC_MINT.as_ref(), chain_id, chain_id];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds
        .iter()
        .map(|s| s.to_vec())
        .collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
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
