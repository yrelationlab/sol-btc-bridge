use crate::
    errors::ErrorCode
;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program::ID as ED25519_PROGRAM_ID;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;

use super::{deserialize_message, msgs};

const EXPECTED_PUBLIC_KEY_OFFSET: usize = 16;
const EXPECTED_PUBLIC_KEY_RANGE: std::ops::Range<usize> =
    EXPECTED_PUBLIC_KEY_OFFSET..(EXPECTED_PUBLIC_KEY_OFFSET + 32);
// based on https://github.com/GuidoDipietro/solana-ed25519-secp256k1-sig-verification/blob/master/programs/solana-ed25519-sig-verification/src/lib.rs
fn validate_ed25519_ix(ix: &anchor_lang::solana_program::instruction::Instruction) -> bool {
    msg!(
        "ix.program_id={}, ix.accounts.len()={}",
        ix.program_id,
        ix.accounts.len()
    );

    if ix.program_id != ED25519_PROGRAM_ID || ix.accounts.len() != 0 {
        return false;
    }
    let ix_data = &ix.data;
    let public_key_offset = &ix_data[6..=7];
    let exp_public_key_offset = u16::try_from(EXPECTED_PUBLIC_KEY_OFFSET)
        .unwrap()
        .to_le_bytes();
    let expected_num_signatures: u8 = 1;

    return public_key_offset       == &exp_public_key_offset                        && // pulic_key in expected offset (16)
            &[ix_data[0]]           == &expected_num_signatures.to_le_bytes()        && // num_signatures is 1
            &[ix_data[1]]           == &[0]                                          && // padding is 0
            &ix_data[4..=5]         == &u16::MAX.to_le_bytes()                       && // signature_instruction_index is not defined by user (default value)
            &ix_data[8..=9]         == &u16::MAX.to_le_bytes()                       && // public_key_instruction_index is not defined by user (default value)
            &ix_data[14..=15]       == &u16::MAX.to_le_bytes(); // message_instruction_index is not defined by user (default value)
}

pub fn resolve_ed25519_with_index<'a, T: PartialEq + std::fmt::Debug + msgs::traits::DeserializeMessage>(
    ix_account_info: &'a AccountInfo,
    index: usize,
    msg: &T
) -> Result<Pubkey> {
    let ix = instructions_sysvar_module::load_instruction_at_checked(index, ix_account_info)?;
    if !validate_ed25519_ix(&ix) {
        return err!(ErrorCode::InstructionMissing);
    }
    let pub_key =
        Pubkey::try_from(&ix.data[EXPECTED_PUBLIC_KEY_RANGE]).expect("Failed to convert pubkey");
    let data = &ix.data[112..];

    let message_of_signer: T = deserialize_message::<T>(data)?;

    // check signer_pubkey is allowed
    if message_of_signer != *msg {
        msg!("message_of_signer: {:?}", message_of_signer);
        msg!("msg: {:?}", msg);
        return err!(ErrorCode::MessageMismatch);
    }

    return Ok(pub_key);
}
#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use anchor_lang::prelude::Pubkey;

    use super::*; // 引入测试目标

    #[test]
    fn test_pda() {
        let address_sol = Pubkey::from_str("5VJ31bg7HveNKBnkNBSkZmJUR9GSJyMgenWS3thrLnmL").unwrap();
        println!("sol {:?}", address_sol);
        // let address_eth = Pubkey::from_str("0x388C818CA8B9251b393131C08a736A67ccB19297").unwrap();
        // println!("eth {:?}", address_eth);
     
    }
}
