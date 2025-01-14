#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;
mod constants;
mod errors;
mod instructions;

// Set the correct key here
declare_id!("4SRdekDrf4srsADt7sPMkvLsEoCqUtrNvtRDEUvokrgx");
#[program]
pub mod bridge {

    pub use super::instructions::*;
    use super::*;
    // pub fn close_memoo_config(ctx: Context<CloseMemooConfig>) -> Result<()> {
    //     instructions::close_memoo_config(ctx)
    // }
    pub fn create_bridge_config<'info>(
        ctx: Context<'_, '_, 'info, 'info, CreateBridgeConfig<'info>>,
        chain_id: u8,
        fee_recipient: Pubkey,
        supported_tokens: Vec<Pubkey>,
        token_prices: Vec<u64>,
        supported_chains: Vec<u8>,
        token_fee_percentages: Vec<u64>,
        token_min_amount: Vec<u64>,
    ) -> Result<()> {
        instructions::create_bridge_config(
            ctx,
            chain_id,
            fee_recipient,
            supported_tokens,
            token_prices,
            supported_chains,
            token_fee_percentages,
            token_min_amount,
        )
    }

    pub fn create_bridge_committee<'info>(
        ctx: Context<'_, '_, 'info, 'info, CreateBridgeCommittee<'info>>,
        committee: Vec<Pubkey>,
        stake: Vec<u16>,
        min_stake_required: u16,
    ) -> Result<()> {
        instructions::create_bridge_committee(ctx, committee, stake, min_stake_required)
    }

    pub fn update_supported_chain<'info>(
        ctx: Context<'_, '_, 'info, 'info, UpdateSupportedChain<'info>>,
        supported: bool,
    ) -> Result<()> {
        instructions::update_supported_chain(ctx, supported)
    }
}
