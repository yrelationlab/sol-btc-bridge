use crate::
    errors::ErrorCode
;
use anchor_lang::prelude::*;

use super::{HasMessageType, HasPayload};
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


pub fn required_stake<T: HasMessageType + HasPayload>(message: &T) -> Result<u16>{
    match Operation::try_from(message.message_type()).map_err(|_| ErrorCode::InvalidMessageType)? {
        Operation::TokenTransfer => Ok(TRANSFER_STAKE_REQUIRED),
        Operation::Blocklist => Ok(BLOCKLIST_STAKE_REQUIRED),
        Operation::EmergencyOp => {
            let is_freezing = true;
            decode_emergency_op_payload(&message.payload())?;
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
