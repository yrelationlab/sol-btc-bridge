use crate::{
    bridge::{ get_commitee_account, resolve_ed25519_with_index, Committee, Nonces },
    constants::ANCHOR_HEADER_LEN,
    errors::ErrorCode,
};
use anchor_lang::prelude::*;

use super::{ DeserializeMessage, HasMessageType, HasPayload };
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

pub fn verify<'info, T: HasPayload + HasMessageType + DeserializeMessage + PartialEq>(
    remaining_accounts: &[AccountInfo<'info>],
    instructions_sysvar: &AccountInfo<'info>,
    program_id: &Pubkey,
    number_of_signatures: u8,
    msg: &T,
    op_type: Operation,
    nonce_config: &mut Box<Account<'info, Nonces>>
) -> Result<()> {
    if number_of_signatures < 1 {
        return err!(ErrorCode::InsufficientSignatures);
    }

    let mut bitmap: u128 = 0;
    let mut approval_stake: u16 = 0;
    msg!("number_of_signatures={}", number_of_signatures);
    for i in 1..number_of_signatures + 1 {
        msg!("verify: i={}", i);

        let (signer_pubkey, data) = resolve_ed25519_with_index(instructions_sysvar, i as usize)?;

        let message_of_signer: T = deserialize_message::<T>(&data)?;

        // check signer_pubkey is allowed
        if message_of_signer != *msg {
            msg!("message_of_signer: {:?}", message_of_signer);
            msg!("msg: {:?}", msg);
            return err!(ErrorCode::MessageMismatch);
        }

        if Operation::try_from(msg.message_type()) != Ok(op_type) {
            return err!(ErrorCode::MessageOpTypeMismatch);
        }

        if nonce_config.nonce != msg.nonce() {
            msg!("nonce_config nonce: {:?}", nonce_config.nonce);
            msg!("msg nonce: {:?}", msg.nonce());
            return err!(ErrorCode::InvalidNonce);
        }

        let (_, pda_of_committee_config) = get_commitee_account(
            remaining_accounts.to_vec(),
            &signer_pubkey,
            &program_id
        )?;
        let account_data = &mut *pda_of_committee_config.try_borrow_mut_data()?;
        let committee_config = Committee::try_from_slice(
            &account_data[ANCHOR_HEADER_LEN..]
        ).map_err(|_| ErrorCode::InvalidSigner)?;

        let mask = 1u128 << committee_config.index;
        if (bitmap & mask) != 0 {
            return err!(ErrorCode::DuplicateSignature);
        }
        bitmap |= mask;
        msg!(
            "signer_pubkey={}, committee_config.stake_amount={:?}",
            signer_pubkey,
            committee_config.stake_amount
        );
        approval_stake += committee_config.stake_amount;
    }

    nonce_config.nonce += 1;

    Ok(
        if approval_stake < required_stake(msg)? {
            msg!(
                "InsufficientStake: approval_stake={}, required_stake={:?}",
                approval_stake,
                required_stake(msg)
            );
            return err!(ErrorCode::InsufficientStake);
        }
    )
}

pub fn deserialize_message<T: DeserializeMessage>(data: &Vec<u8>) -> Result<T> {
    T::deserialize_message(data)
}

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

pub fn required_stake<T: HasMessageType + HasPayload>(message: &T) -> Result<u16> {
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
            _ => Err(()),
        }
    }
}
