
use anchor_lang::prelude::*;
pub trait HasMessageType {
    fn message_type(&self) -> u8;
}

pub trait HasPayload {
    fn payload(&self) -> Vec<u8>;
}

pub trait DeserializeMessage: AnchorSerialize + AnchorDeserialize + std::fmt::Debug {
    fn deserialize_message(data: &Vec<u8>) -> Result<Self>;
}
