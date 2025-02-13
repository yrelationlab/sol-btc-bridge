/// Creates a new bridge configuration.
use crate::{
    constants::{ GLOBAL_CONFIG, SBTC_MINT },
    errors::ErrorCode,
    BridgeConfig,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang:: prelude::* ;
use anchor_spl::token::{ Mint, Token };

pub fn create_bridge_limiter<'info>(
    ctx: Context<'_, '_, 'info, 'info, CreateBridgeLimiter<'info>>,
    supported_chains: Vec<u8>,
    token_ids: Vec<u8>,
    limits: Vec<u64>
) -> Result<()> {

    Ok(())
}

#[derive(Accounts)]
#[instruction(chain_id: u8)]
pub struct CreateBridgeLimiter<'info> {
    #[account(
        constraint = bridge_config.admin == payer.key() @ ErrorCode::InvalidAdminAddress,
        seeds = [GLOBAL_CONFIG.as_bytes(), &chain_id.to_be_bytes()],
        bump
    )]
    pub bridge_config: Account<'info, BridgeConfig>,

    /// The account paying for all rents
    #[account(mut, )]
    pub payer: Signer<'info>,

    /// CHECK:` Validate address by deriving pda, use as sBTC mint's authority
    // #[account(
    //     seeds = [
    //         BRIDGE_SBTC_AUTH.as_bytes(),
    //         &chain_id.to_be_bytes()
    //     ],
    //     bump
    // )]
    // pub sbtc_authority: AccountInfo<'info>,

    /// CHECK: `https://solana.stackexchange.com/questions/454/how-to-create-a-program-that-has-the-authority-to-mint-tokens`
    #[account(
        init,
        payer = payer,
        seeds = [SBTC_MINT.as_bytes(), &chain_id.to_be_bytes()],
        bump,
        mint::decimals = 9,
        mint::authority = sbtc_mint,
        mint::freeze_authority = sbtc_mint
    )]
    pub sbtc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
