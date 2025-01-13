use crate::{
    constants::{COMMITTEE_CONFIG, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG},
    errors::BridgeError,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program::ID as ED25519_PROGRAM_ID;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_lang::system_program;
use anchor_spl::associated_token::{
    create as create_associated_token, Create as CreateAssociatedToken,
};
use std::convert::TryInto;

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
    resolve_with_index(ix_account_info, EXPTECED_IX_SYSVAR_INDEX)
}

pub fn resolve_with_index<'a>(
    ix_account_info: &'a AccountInfo,
    index: usize,
) -> Result<(Pubkey, Vec<u8>)> {
    let ix = instructions_sysvar_module::load_instruction_at_checked(index, ix_account_info)?;
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

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct Message {
    pub message_type: u8,
    pub version: u8,
    pub nonce: u64,
    pub chain_id: u8,
    pub payload: Vec<u8>,
}
pub fn deserialize_message(data: &Vec<u8>) -> Result<Message> {
    match Message::try_from_slice(data) {
        Ok(order) => Ok(order),
        Err(_) => err!(BridgeError::DeserializeMessageError),
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

pub fn deserialize_airdrop_message(data: &Vec<u8>) -> Result<AirdropMessage> {
    match AirdropMessage::try_from_slice(data) {
        Ok(order) => Ok(order),
        Err(_) => err!(BridgeError::DeserializeAirdropMessageError),
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
        Err(_) => err!(BridgeError::DeserializeWhitelistMessageError),
    }
}

pub fn create_account<'a>(
    program_id: &Pubkey,
    payer: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    target_account: AccountInfo<'a>,
    siger_seed: &[&[u8]],
    space: usize,
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
            program_id,
        )?;
    }
    Ok(())
}

pub fn get_token_pda_bump_seeds(
    program_id: &Pubkey,
    token_address: &Pubkey,
    chain_id_bytes: [u8; 1],
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[
        TOKEN_CONFIG.as_ref(),
        token_address.as_ref(),
        chain_id_bytes.as_ref(),
    ];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds.iter().map(|s| s.to_vec()).collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
}

pub fn get_support_chains_pda_bump_seeds(
    program_id: &Pubkey,
    chain_id_bytes: [u8; 1],
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[SUPPORTED_CHAINS_CONFIG.as_ref(), chain_id_bytes.as_ref()];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds.iter().map(|s| s.to_vec()).collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
}

pub fn get_committee_config_pda_bump_seeds(
    program_id: &Pubkey,
    committee_address:  &Pubkey,
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[COMMITTEE_CONFIG.as_ref(), committee_address.as_ref()];
    let (pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let mut signer_seeds_vec: Vec<Vec<u8>> = seeds.iter().map(|s| s.to_vec()).collect();
    let seeds_vec = signer_seeds_vec.clone();
    signer_seeds_vec.push(vec![bump]);
    (pda, bump, seeds_vec, signer_seeds_vec)
}

pub fn find_ata_in_accounts<'info>(
    remaining_accounts: Vec<AccountInfo<'info>>,
    ata_pubkey: &Pubkey,
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

pub fn decode_update_token_price_payload(payload: &[u8]) -> Result<(u8, u64)> {
    if payload.len() != 9 {
        return err!(BridgeError::InvalidPayloadLength);
    }

    let token_id = payload[0];

    let token_price = u64::from_be_bytes(
        payload[1..9]
            .try_into()
            .map_err(|_| BridgeError::InvalidPayloadLength)?,
    );

    Ok((token_id, token_price))
}

#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::{prelude::Pubkey, AnchorDeserialize, AnchorSerialize};
    use {WhitelistMessage, WhitelistPair}; // 引入测试目标
    #[test]
    fn test_decode_update_whitelist_message() {
        let original = WhitelistMessage {
            items: vec![WhitelistPair {
                address: Pubkey::new_unique(),
                percent: 50,
            }],
            meme: Pubkey::default(),
            expiry: 1687654321,
        };
        let serialized = original.try_to_vec().unwrap();
        let deserialized: WhitelistMessage = WhitelistMessage::try_from_slice(&serialized).unwrap();
        println!("{:?}", deserialized);
    }

    #[test]
    fn test_decode_update_token_price_payload() {
        let payload: Vec<u8> = vec![1, 0, 0, 0, 0, 0, 0, 0, 100]; // 示例有效负载
        match decode_update_token_price_payload(&payload) {
            Ok((token_id, token_price)) => {
                println!("Token ID: {}, Token Price: {}", token_id, token_price);
                assert_eq!(token_id, 1, "Token ID does not match!");
                assert_eq!(token_price, 100, "Token Price does not match!");
            }
            Err(err) => {
                panic!("Decoding failed: {}", err);
            }
        }
    }

    #[test]
    fn test_serialize_deserialize_message_with_payload_decoding() {
        let token_id: u8 = 1;
        let token_price: u64 = 100;
        let mut payload: Vec<u8> = vec![token_id];
        payload.extend_from_slice(&token_price.to_be_bytes());

        let original = Message {
            message_type: 1,
            version: 1,
            nonce: 42,
            chain_id: 99,
            payload,
        };
        let serialized = original.try_to_vec().unwrap();
        let deserialized: Message = Message::try_from_slice(&serialized).unwrap();
        println!("{:?}", deserialized);
        assert_eq!(
            original, deserialized,
            "Deserialized message does not match the original!"
        );
        if let Ok((decoded_token_id, decoded_token_price)) =
            decode_update_token_price_payload(&deserialized.payload)
        {
            assert_eq!(decoded_token_id, token_id, "Token ID does not match!");
            assert_eq!(
                decoded_token_price, token_price,
                "Token Price does not match!"
            );
        } else {
            panic!("Failed to decode payload");
        }
    }
}
