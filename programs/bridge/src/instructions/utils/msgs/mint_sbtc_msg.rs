use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

use super::{ DeserializeMessage, HasMessageType, HasPayload };

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

    fn nonce(&self) -> u64 {
        self.nonce
    }
}

impl HasPayload for MintSbtcMessage {
    fn payload(&self) -> Vec<u8> {
        return Vec::new();
    }
}

impl DeserializeMessage for MintSbtcMessage {
    fn deserialize_message(data: &[u8]) -> Result<MintSbtcMessage> {
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
    pub chain_mint_total: u128,
    pub token_mint_total: u128,
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use anchor_lang::{ prelude::Pubkey, AnchorDeserialize, AnchorSerialize };

    use crate::constants::GLOBAL_CONFIG;

    use super::*; // 引入测试目标

    #[test]
    fn test_add() {
        let eth_btc_address = hex::decode("2260fac5e5542a773aa44fbcfedf7c193bc2c599").unwrap();
        let mut from_address = [0u8; 35]; // 创建固定 32 字节数组
        from_address[..eth_btc_address.len()].copy_from_slice(&eth_btc_address);

        let msg = MintSbtcMessage {
            message_type: 1,
            version: 1,
            nonce: 123456789,
            source_chain_id: 3,
            source_token_id: 5,
            from_address: from_address,
            to_chain_id: 0,
            to_address: [0; 32],
            amount: 1000000,
        };
        println!("Rust Serialized (Hex): {:?}", hex::encode(msg.try_to_vec().unwrap()));
        //010115cd5b070000000003052260fac5e5542a773aa44fbcfedf7c193bc2c59900000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000040420f0000000000
        //010115cd5b070000000003052260fac5e5542a773aa44fbcfedf7c193bc2c59900000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000040420f0000000000

        let hex_data =
            "010115cd5b070000000003052260fac5e5542a773aa44fbcfedf7c193bc2c59900000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000040420f0000000000";

        let bin_data = hex::decode(hex_data).expect("Failed to decode hex");
        match MintSbtcMessage::try_from_slice(&bin_data) {
            Ok(msg) => {
                println!("Deserialized MintSbtcMessage: {:#?}", msg);
                let program_id = Pubkey::from_str(
                    "Am2aeLabeQBtENUpMvEv8cWqnaiFzFBF1GtS8gHkhLLs"
                ).unwrap();
                let (pda, bump) = Pubkey::find_program_address(
                    &[
                        GLOBAL_CONFIG.as_bytes(),
                        &msg.to_chain_id.to_le_bytes(), // 大端序转换
                    ],
                    &program_id
                );
                msg!("Derived PDA: {}", pda);

                // CMuWvKKhEuwL7uE6donSzxYBY9WH8ezKZgeiFmRFtshA
            }
            Err(e) => {
                println!("Failed to deserialize: {}", e);
            }
        }
    }
}
