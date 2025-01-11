use crate::{
    constants::{
        DECIMALS9, GLOBAL_CONFIG, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG,
    },
    create_or_allocate_account,
    errors::BridgeError,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::{prelude::*, Discriminator};
use solana_program::pubkey;
// Hardcoded pubkey for create memoo config
const HARDCODED_PUBKEY: Pubkey = pubkey!("admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV");

pub fn update_token_price_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, UpdateTokenPrice<'info>>,
) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
#[instruction(chain_id: u8)]
pub struct UpdateTokenPrice<'info> {
    
    // need committee here
   
    pub system_program: Program<'info, System>,
}
