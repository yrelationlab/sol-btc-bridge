use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::prelude::*;

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
