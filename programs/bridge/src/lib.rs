#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
mod constants;
mod errors;
mod instructions;
mod params;
mod state;

// Set the correct key here
declare_id!("2HkyvTM9855Ptfcb7rsgWZ7pyf3GXqMKdvUusixLzkR6");

#[program]
pub mod bridge {

    pub use super::instructions::*;
    use super::*;

    pub fn close_memoo_config(ctx: Context<CloseMemooConfig>) -> Result<()> {
        instructions::close_memoo_config(ctx)
    }

    pub fn create_memoo_config(
        ctx: Context<CreateMemooConfig>,
        id: Pubkey,
        platform: Pubkey,
        platform_fee_recipient: Pubkey,
        platform_fee_rate_ido: u16,
        platform_fee_rate_denominator_ido: u16,
        ido_creator_buy_limit: u16,
        token_allocation_creator: u16,
        token_allocation_ido: u16,
        token_allocation_lp: u16,
        token_allocation_airdrop: u16,
        token_allocation_platform: u16,
        ido_user_buy_limit: u16,
        ido_price: u64,
        airdrop_price: u64,
        total_supply: u128,
        platform_fee_create_meme_sol: u64,
        share_create_fee_number: u64,
    ) -> Result<()> {
        instructions::create_memoo_config(
            ctx,
            id,
            platform,
            platform_fee_recipient,
            platform_fee_rate_ido,
            platform_fee_rate_denominator_ido,
            ido_creator_buy_limit,
            token_allocation_creator,
            token_allocation_ido,
            token_allocation_lp,
            token_allocation_airdrop,
            token_allocation_platform,
            ido_user_buy_limit,
            ido_price,
            airdrop_price,
            total_supply,
            platform_fee_create_meme_sol,
            share_create_fee_number,
        )
    }

    pub fn update_memoo_config(
        ctx: Context<UpdateMemooConfig>,
        id: Pubkey,
        admin: Pubkey,
        platform: Pubkey,
        platform_fee_recipient: Pubkey,
        platform_fee_rate_ido: u16,
        platform_fee_rate_denominator_ido: u16,
        ido_creator_buy_limit: u16,
        token_allocation_creator: u16,
        token_allocation_ido: u16,
        token_allocation_lp: u16,
        token_allocation_airdrop: u16,
        token_allocation_platform: u16,
        ido_user_buy_limit: u16,
        ido_price: u64,
        airdrop_price: u64,
        total_supply: u128,
        platform_fee_create_meme_sol: u64,
        share_create_fee_number: u64,
    ) -> Result<()> {
        instructions::update_memoo_config(
            ctx,
            id,
            admin,
            platform,
            platform_fee_recipient,
            platform_fee_rate_ido,
            platform_fee_rate_denominator_ido,
            ido_creator_buy_limit,
            token_allocation_creator,
            token_allocation_ido,
            token_allocation_lp,
            token_allocation_airdrop,
            token_allocation_platform,
            ido_user_buy_limit,
            ido_price,
            airdrop_price,
            total_supply,
            platform_fee_create_meme_sol,
            share_create_fee_number,
        )
    }

    pub fn creator_claim_whitelist<'info>(
        ctx: Context<'_, '_, '_, 'info, CreatorClaimWhitelist<'info>>,
        meme_id: Pubkey,
    ) -> Result<()> {
        instructions::creator_claim_whitelist(ctx, meme_id)
    }

}
