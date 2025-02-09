use crate::
    errors::ErrorCode
;
use anchor_lang::prelude::*;

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