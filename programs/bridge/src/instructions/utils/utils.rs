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

pub trait Message: AnchorSerialize + AnchorDeserialize + std::fmt::Debug {
    fn deserialize_message(data: &Vec<u8>) -> Result<Self>;
}


#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct MintSbtcMessage {
    pub message_type: u8,
    pub version: u8,
    pub nonce: u64,
    pub source_chain_id: u8,
    pub source_token_id: u8,
    pub from_address: Vec<u8>,
    pub to_address: [u8; 32],
    pub amount: u64,
}

pub fn deserialize_mint_sbtc_message(data: &Vec<u8>) -> Result<MintSbtcMessage> {
    match MintSbtcMessage::try_from_slice(data) {
        Ok(order) => Ok(order),
        Err(_) => err!(ErrorCode::DeserializeMessageError),
    }
}

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
        Err(_) => err!(ErrorCode::DeserializeWhitelistMessageError),
    }
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

// Message type stake requirements
pub const TRANSFER_STAKE_REQUIRED: u16 = 6666;
pub const FREEZING_STAKE_REQUIRED: u16 = 450;
pub const UNFREEZING_STAKE_REQUIRED: u16 = 5001;
pub const UPGRADE_STAKE_REQUIRED: u16 = 5001;
pub const BLOCKLIST_STAKE_REQUIRED: u16 = 5001;
pub const BRIDGE_LIMIT_STAKE_REQUIRED: u16 = 5001;
pub const UPDATE_TOKEN_PRICE_STAKE_REQUIRED: u16 = 5001;
pub const ADD_EVM_TOKENS_STAKE_REQUIRED: u16 = 5001;
pub const UPDATE_CHAINID_STAKE_REQUIRED: u16 = 5001;
pub const MINT_SBTC_STAKE_REQUIRED: u16 = 5001;

pub fn decode_emergency_op_payload(payload: &[u8]) -> Result<bool> {
    if payload.len() != 1 {
        return err!(ErrorCode::InvalidPayloadLength);
    }
    let emergency_op_code = payload[0];
    if emergency_op_code > 1 {
        return err!(ErrorCode::InvalidOpCode);
    }
    Ok(emergency_op_code == 0) // 返回 `true` 表示冻结操作
}
// 1. Define a trait for messages that have a message_type
pub trait HasMessageType {
    fn message_type(&self) -> u8;
}


pub fn required_stake<T: HasMessageType>(message: &T) -> Result<u16>{
    match Operation::try_from(message.message_type()).map_err(|_| ErrorCode::InvalidMessageType)? {
        Operation::TokenTransfer => Ok(TRANSFER_STAKE_REQUIRED),
        Operation::Blocklist => Ok(BLOCKLIST_STAKE_REQUIRED),
        Operation::EmergencyOp => {
            let is_freezing = true;
            // decode_emergency_op_payload(&message.payload)?;
            if is_freezing {
                Ok(FREEZING_STAKE_REQUIRED)
            } else {
                Ok(UNFREEZING_STAKE_REQUIRED)
            }
        }
        Operation::UpdateBridgeLimit => Ok(BRIDGE_LIMIT_STAKE_REQUIRED),
        Operation::UpdateTokenPrice => Ok(UPDATE_TOKEN_PRICE_STAKE_REQUIRED),
        Operation::Upgrade => Ok(UPGRADE_STAKE_REQUIRED),
        Operation::AddEvmTokens => Ok(ADD_EVM_TOKENS_STAKE_REQUIRED),
        Operation::UpdateChainId => Ok(UPDATE_CHAINID_STAKE_REQUIRED),
        _ => err!(ErrorCode::InvalidMessageType),
    }
}

pub fn get_token_pda_bump_seeds(
    program_id: &Pubkey,
    token_id_bytes: [u8; 1]
) -> (Pubkey, u8, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let seeds = &[TOKEN_CONFIG.as_ref(), token_id_bytes.as_ref()];
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
    program_id: &Pubkey,
    remaining_accounts: Vec<AccountInfo<'info>>,
    committee_address: &Pubkey
) -> Result<(Vec<Vec<u8>>, AccountInfo<'info>)> {
    let (pda_of_committee_config_address, _, _, signer_seeds) = get_committee_config_pda_bump_seeds(
        program_id,
        committee_address
    );
    let pda_of_committee_config = find_ata_in_accounts(
        remaining_accounts.to_vec(),
        &pda_of_committee_config_address
    ).ok_or(ErrorCode::CommitteeConfigAddressMissing)?;
    Ok((signer_seeds, pda_of_committee_config))
}

pub fn get_committee_config_pda_bump_seeds(
    program_id: &Pubkey,
    committee_address: &Pubkey
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

#[repr(u8)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Operation {
    TokenTransfer = 0,
    Blocklist = 1,
    EmergencyOp = 2,
    UpdateBridgeLimit = 3,
    UpdateTokenPrice = 4,
    Upgrade = 5,
    AddEvmTokens = 7,
    UpdateChainId = 8,
    MintSBTC = 9,
}
impl Operation {
    pub fn to_bytes(&self) -> Vec<u8> {
        vec![*self as u8]
    }
}
impl TryFrom<u8> for Operation {
    type Error = ();

    fn try_from(value: u8) -> std::result::Result<Operation, ()> {
        match value {
            0 => Ok(Operation::TokenTransfer),
            1 => Ok(Operation::Blocklist),
            2 => Ok(Operation::EmergencyOp),
            3 => Ok(Operation::UpdateBridgeLimit),
            4 => Ok(Operation::UpdateTokenPrice),
            5 => Ok(Operation::Upgrade),
            7 => Ok(Operation::AddEvmTokens),
            8 => Ok(Operation::UpdateChainId),
            9 => Ok(Operation::MintSBTC),
            _ => Err(()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::{ prelude::Pubkey, AnchorDeserialize, AnchorSerialize };
    use ::{ WhitelistMessage, WhitelistPair }; // 引入测试目标
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
        assert_eq!(original, deserialized, "Deserialized message does not match the original!");
        if
            let Ok((decoded_token_id, decoded_token_price)) = decode_update_token_price_payload(
                &deserialized.payload
            )
        {
            assert_eq!(decoded_token_id, token_id, "Token ID does not match!");
            assert_eq!(decoded_token_price, token_price, "Token Price does not match!");
        } else {
            panic!("Failed to decode payload");
        }
    }
}
