
use anchor_lang::prelude::*;
pub trait HasMessageType {
    fn message_type(&self) -> u8;
    fn chain_id(&self) -> u8;
    fn nonce(&self) -> u64;

}

pub trait HasPayload {
    fn payload(&self) -> Vec<u8>;
}

pub trait DeserializeMessage: AnchorSerialize + AnchorDeserialize + std::fmt::Debug {
    fn deserialize_message(data:  &[u8]) -> Result<Self>;
}
