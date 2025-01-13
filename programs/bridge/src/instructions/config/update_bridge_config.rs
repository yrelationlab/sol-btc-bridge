use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::sysvar::{
    clock::Clock, instructions as instructions_sysvar_module,
};

use crate::errors::BridgeError;
use crate::{utils, Message};
pub fn update_token_price_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpdateTokenPrice<'info>>,
    msg: Message,
    number_of_signatures: u8,
) -> Result<()> {

    if number_of_signatures < 1 {
        return err!(BridgeError::InsufficientSignatures);
    }

    for i in 0..number_of_signatures {
        let (signer_pubkey, data) = utils::resolve_with_index(&ctx.accounts.instructions_sysvar, i as usize)?;
        let message_of_signer = utils::deserialize_message(&data)?;
        // check signer_pubkey is allowed
        if message_of_signer != msg {
            return err!(BridgeError::MessageMismatch);
        }
    }

    
    Ok(())
}

#[derive(Accounts)]
#[instruction(chain_id: u8)]
pub struct UpdateTokenPrice<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
