use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program::ID as ED25519_PROGRAM_ID;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_spl::associated_token::{
    create as create_associated_token, Create as CreateAssociatedToken,
};

use crate::constants::{AUTHORITY_SEED, WSOL};
use crate::errors::MemooError;

const EXPECTED_PUBLIC_KEY_OFFSET: usize = 16;
const EXPECTED_PUBLIC_KEY_RANGE: std::ops::Range<usize> =
    EXPECTED_PUBLIC_KEY_OFFSET..(EXPECTED_PUBLIC_KEY_OFFSET + 32);
const EXPTECED_IX_SYSVAR_INDEX: usize = 0;

// based on https://github.com/GuidoDipietro/solana-ed25519-secp256k1-sig-verification/blob/master/programs/solana-ed25519-sig-verification/src/lib.rs
fn validate_ed25519_ix(ix: &anchor_lang::solana_program::instruction::Instruction) -> bool {
    if ix.program_id != ED25519_PROGRAM_ID || ix.accounts.len() != 0 {
        msg!(
            "ix.program_id={}, ix.accounts.len()={}",
            ix.program_id,
            ix.accounts.len()
        );
        return false;
    }
    let ix_data = &ix.data;
    let public_key_offset = &ix_data[6..=7];
    let exp_public_key_offset = u16::try_from(EXPECTED_PUBLIC_KEY_OFFSET)
        .unwrap()
        .to_le_bytes();
    let expected_num_signatures: u8 = 1;

    msg!(
            "public_key_offset={}, num_signatures={}, padding={}, signature_instruction_index={}, public_key_instruction_index={}, message_instruction_index={}",
            public_key_offset       == &exp_public_key_offset,
            &[ix_data[0]]           == &expected_num_signatures.to_le_bytes(),
            &[ix_data[1]]           == &[0],
            &ix_data[4..=5]         == &u16::MAX.to_le_bytes(),
            &ix_data[8..=9]         == &u16::MAX.to_le_bytes(),
            &ix_data[14..=15]       == &u16::MAX.to_le_bytes()
        );

    return public_key_offset       == &exp_public_key_offset                        && // pulic_key in expected offset (16)
            &[ix_data[0]]           == &expected_num_signatures.to_le_bytes()        && // num_signatures is 1
            &[ix_data[1]]           == &[0]                                          && // padding is 0
            &ix_data[4..=5]         == &u16::MAX.to_le_bytes()                       && // signature_instruction_index is not defined by user (default value)
            &ix_data[8..=9]         == &u16::MAX.to_le_bytes()                       && // public_key_instruction_index is not defined by user (default value)
            &ix_data[14..=15]       == &u16::MAX.to_le_bytes(); // message_instruction_index is not defined by user (default value)
}

pub fn resolve<'a>(ix_account_info: &'a AccountInfo) -> Result<(Pubkey, Vec<u8>)> {
    let ix = instructions_sysvar_module::load_instruction_at_checked(
        EXPTECED_IX_SYSVAR_INDEX,
        ix_account_info,
    )?;
    if !validate_ed25519_ix(&ix) {
        return err!(ErrorCode::InstructionMissing);
    }
    let pub_key =
        Pubkey::try_from(&ix.data[EXPECTED_PUBLIC_KEY_RANGE]).expect("Failed to convert pubkey");
    let order = &ix.data[112..];
    return Ok((pub_key, order.to_vec()));
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug)]
pub struct AirdropMessage {
    pub address: Pubkey,
    pub meme: Pubkey,
    pub count: u64,
    pub expiry: i64,
}

impl AirdropMessage {
    pub fn new(address: Pubkey, meme: Pubkey, count: u64, expiry: i64) -> Self {
        AirdropMessage {
            address,
            meme,
            count,
            expiry,
        }
    }
}

pub fn deserialize_airdrop_message(data: &Vec<u8>) -> Result<AirdropMessage> {
    match AirdropMessage::try_from_slice(data) {
        Ok(order) => Ok(order),
        Err(_) => err!(MemooError::DeserializeAirdropMessageError),
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug)]
pub struct WhitelistPair {
    pub address: Pubkey,
    pub percent: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug)]
pub struct WhitelistMessage {
    pub meme: Pubkey,
    pub expiry: i64,
    pub items: Vec<WhitelistPair>,
}

pub fn deserialize_whitelist_message(data: &Vec<u8>) -> Result<WhitelistMessage> {
    match WhitelistMessage::try_from_slice(data) {
        Ok(order) => Ok(order),
        Err(_) => err!(MemooError::DeserializeWhitelistMessageError),
    }
}

pub fn get_pool_sol_authority(
    _meme_id: &Pubkey,
    program_id: &Pubkey,
    wsol: &Pubkey,
) -> Result<(Pubkey, u8)> {
    let seeds: &[&[u8]] = &[AUTHORITY_SEED.as_ref(), _meme_id.as_ref(), wsol.as_ref()];
    let (address, bump) = Pubkey::find_program_address(seeds, program_id);
    Ok((address, bump))
}

pub fn get_pool_token_authority(
    _meme_id: &Pubkey,
    program_id: &Pubkey,
    token_mint: &Pubkey,
) -> Result<(Pubkey, u8)> {
    let seeds: &[&[u8]] = &[
        AUTHORITY_SEED.as_ref(),
        _meme_id.as_ref(),
        token_mint.as_ref(),
    ];
    let (address, bump) = Pubkey::find_program_address(seeds, program_id);
    Ok((address, bump))
}

pub fn get_pool_sol_account(
    pool_sol_authority: &Pubkey,
    program_id: &Pubkey,
) -> Result<(Pubkey, u8)> {
    let wsol = Pubkey::from_str(WSOL).unwrap();
    let seeds: &[&[u8]] = &[wsol.as_ref(), pool_sol_authority.as_ref()];
    let (address, bump) = Pubkey::find_program_address(seeds, program_id);
    Ok((address, bump))
}

pub fn get_pool_token_account(
    pool_token_authority: &Pubkey,
    program_id: &Pubkey,
    token_mint: &Pubkey,
) -> Result<(Pubkey, u8)> {
    let seeds: &[&[u8]] = &[token_mint.as_ref(), pool_token_authority.as_ref()];
    let (address, bump) = Pubkey::find_program_address(seeds, program_id);
    Ok((address, bump))
}

pub fn create_associated_token_account_ifn_init<'info>(
    payer: AccountInfo<'info>,
    owner: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    associated_token_account: AccountInfo<'info>,
    associated_token_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
) -> Result<()> {
    if associated_token_account.data_is_empty() {
        create_associated_token(CpiContext::new(
            associated_token_program,
            CreateAssociatedToken {
                payer,
                authority: owner,
                mint,
                associated_token: associated_token_account,
                system_program,
                token_program,
            },
        ))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use anchor_lang::{prelude::Pubkey, AnchorDeserialize, AnchorSerialize};
    use {WhitelistMessage, WhitelistPair};

    use super::*; // 引入测试目标

    #[test]
    fn test_add() {
        let original = WhitelistMessage {
            items: vec![WhitelistPair {
                address: Pubkey::new_unique(),
                percent: 50,
            }],
            meme: Pubkey::default(),
            expiry: 1687654321,
        };

        // 序列化
        let serialized = original.try_to_vec().unwrap();

        // 反序列化
        let deserialized: WhitelistMessage = WhitelistMessage::try_from_slice(&serialized).unwrap();

        println!("{:?}", deserialized);
    }
}
