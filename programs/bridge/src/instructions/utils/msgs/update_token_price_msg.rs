use crate::{ bridge::{ traits::HasMessageType, DeserializeMessage }, errors::ErrorCode };
use anchor_lang::prelude::*;

use super::HasPayload;

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Debug, Clone)]
pub struct UpdateTokenPriceMsg {
    pub message_type: u8,
    pub version: u8,
    pub nonce: u64,
    pub chain_id: u8,
    pub payload: [u8; 9], 
}

impl DeserializeMessage for UpdateTokenPriceMsg {
    fn deserialize_message(data: &[u8]) -> Result<UpdateTokenPriceMsg> {
        match UpdateTokenPriceMsg::try_from_slice(data) {
            Ok(order) => Ok(order),
            Err(_) => err!(ErrorCode::DeserializeMessageError),
        }
    }
}

impl HasMessageType for UpdateTokenPriceMsg {
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

impl HasPayload for UpdateTokenPriceMsg {
    fn payload(&self) -> Vec<u8> {
        self.payload.to_vec()
    }
}

pub fn decode_update_token_price_payload(payload: &[u8]) -> Result<(u8, u64)> {
    require!(payload.len() == 9, ErrorCode::InvalidPayloadLength);

    let token_id = payload[0];
    let token_price = u64::from_be_bytes(payload[1..9].try_into().unwrap());

    Ok((token_id, token_price))
}
