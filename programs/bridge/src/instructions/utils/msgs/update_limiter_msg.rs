use crate::{ bridge::{ traits::HasMessageType, DeserializeMessage }, errors::ErrorCode };
use anchor_lang::prelude::*;

use super::HasPayload;

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct UpdateLimiterMsg {
    pub message_type: u8,
    pub version: u8,
    pub nonce: u64,
    pub chain_id: u8,
    pub target_chain_id: u8,
    pub token_id: u8,
    pub total_limit: u64, 
}

impl DeserializeMessage for UpdateLimiterMsg {
    fn deserialize_message(data: &[u8]) -> Result<UpdateLimiterMsg> {
        match UpdateLimiterMsg::try_from_slice(data) {
            Ok(order) => Ok(order),
            Err(_) => err!(ErrorCode::DeserializeMessageError),
        }
    }
}

impl HasMessageType for UpdateLimiterMsg {
    fn message_type(&self) -> u8 {
        self.message_type
    }

    fn chain_id(&self) -> u8 {
        self.chain_id
    }
    
    fn nonce(&self) -> u64 {
        self.nonce
    }
}

impl HasPayload for UpdateLimiterMsg {
    fn payload(&self) -> Vec<u8> {
        vec![]
    }
}
