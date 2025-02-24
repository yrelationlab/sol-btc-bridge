use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

use super::{ DeserializeMessage, HasMessageType, HasPayload, Operation };

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct WithdrawBtcMessage {
    pub to_chain_id: u8,
    pub to_token_id: u8,
    pub to_address: Vec<u8>,
    pub chain_id: u8,
    pub from_address: [u8; 32],
    pub amount: u64,
}

impl HasMessageType for WithdrawBtcMessage {
    fn message_type(&self) -> u8 {
        Operation::TokenTransfer as u8
    }

    fn chain_id(&self) -> u8 {
        self.chain_id
    }
    
    fn nonce(&self) -> u64 {
        todo!()
    }

    
}

impl HasPayload for WithdrawBtcMessage {
    fn payload(&self) -> Vec<u8> {
        return Vec::new();
    }
}

impl DeserializeMessage for WithdrawBtcMessage {
    fn deserialize_message(data: &[u8]) -> Result<WithdrawBtcMessage> {
        match WithdrawBtcMessage::try_from_slice(data) {
            Ok(order) => Ok(order),
            Err(_) => err!(ErrorCode::DeserializeMessageError),
        }
    }
}

#[derive(Debug)]
#[event]
pub struct WithdrawBtcEvent {
    pub nonce: u64,
    pub to_chain_id: u8,
    pub to_token_id: u8,
    pub to_address: Vec<u8>,
    pub chain_id: u8,
    pub from_address: [u8; 32],
    pub amount: u64,
    pub chain_mint_total: u128,
    pub token_mint_total: u128,
}
