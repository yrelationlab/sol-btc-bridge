use crate::
    errors::ErrorCode
;
use anchor_lang::prelude::*;

use super::{DeserializeMessage, HasMessageType, HasPayload};

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct MintSbtcMessage {
    pub message_type: u8,
    pub version: u8,
    pub nonce: u64,
    pub source_chain_id: u8,
    pub source_token_id: u8,
    pub from_address: Vec<u8>,
    pub to_chain_id: u8,
    pub to_address: [u8; 32],
    pub amount: u64,
}


impl HasMessageType for MintSbtcMessage {
    fn message_type(&self) -> u8 {
        self.message_type
    }

    fn chain_id(&self) -> u8 {
        self.to_chain_id
    }
}

impl HasPayload for MintSbtcMessage {
    fn payload(&self) -> Vec<u8> {
       return Vec::new();
    }
}



impl DeserializeMessage for MintSbtcMessage {
    fn deserialize_message(data: &Vec<u8>) -> Result<MintSbtcMessage> {
        match MintSbtcMessage::try_from_slice(data) {
            Ok(order) => Ok(order),
            Err(_) => err!(ErrorCode::DeserializeMessageError),
        }
    }
}

// // 事件结构体，替代 MintSbtcMessage
#[derive(Debug)]
#[event]
pub struct MintSbtcEvent {
    pub message_type: u8,
    pub version: u8,
    pub nonce: u64,
    pub source_chain_id: u8,
    pub source_token_id: u8,
    pub from_address: Vec<u8>,
    pub to_chain_id: u8,
    pub to_address: [u8; 32],
    pub amount: u64,
}
