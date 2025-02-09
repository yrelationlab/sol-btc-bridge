#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;
mod constants;
mod errors;
mod instructions;

// Set the correct key here
declare_id!("Am2aeLabeQBtENUpMvEv8cWqnaiFzFBF1GtS8gHkhLLs");
#[program]
pub mod bridge {
    pub use super::instructions::*;

    use super::*;

    /// # Arguments
    ///
    /// * `ctx` - The context containing all accounts required for this instruction.
    /// * `chain_id` - The ID of the chain for which the bridge configuration is being created.
    /// * `fee_recipient` - The public key of the account that will receive fees.
    /// * `token_ids` - A vector of token IDs that will be supported by the bridge.
    /// * `token_prices` - A vector of token prices corresponding to the token IDs.
    /// * `supported_chains` - A vector of chain IDs that will be supported by the bridge.
    /// * `token_fee_percentages` - A vector of fee percentages for each token.
    /// * `token_min_amount` - A vector of minimum amounts for each token.
    /// * note: each supported_chain has at least one <token_id, token_price>
    ///
    /// # Returns
    ///
    /// This function returns a `Result` which is `Ok` if the bridge configuration is created successfully,
    /// or an `Error` if there is an issue with the provided arguments or during the creation process.
    pub fn create_bridge_config<'info>(
        ctx: Context<'_, '_, 'info, 'info, CreateBridgeConfig<'info>>,
        chain_id: u8,
        fee_recipient: Pubkey,
        token_ids: Vec<u8>,
        token_prices: Vec<u64>,
        supported_chains: Vec<u8>,
        token_fee_percentages: Vec<u64>,
        token_min_amount: Vec<u64>
    ) -> Result<()> {
        instructions::create_bridge_config(
            ctx,
            chain_id,
            fee_recipient,
            token_ids,
            token_prices,
            supported_chains,
            token_fee_percentages,
            token_min_amount
        )
    }

    pub fn create_bridge_committee<'info>(
        ctx: Context<'_, '_, 'info, 'info, CreateBridgeCommittee<'info>>,
        committee: Vec<Pubkey>,
        stake: Vec<u16>,
        min_stake_required: u16
    ) -> Result<()> {
        instructions::create_bridge_committee(ctx, committee, stake, min_stake_required)
    }

    pub fn update_supported_chain<'info>(
        ctx: Context<'_, '_, 'info, 'info, UpdateSupportedChain<'info>>,
        _chain_id: u8,
        supported: bool
    ) -> Result<()> {
        instructions::update_supported_chain(ctx, _chain_id, supported)
    }

    pub fn update_token_price_with_signatures<'info>(
        ctx: Context<'_, '_, 'info, 'info, UpdateTokenPrice<'info>>,
        _chain_id: u8,
        number_of_signatures: u8,
        msg: UpdateTokenPriceMsg
    ) -> Result<()> {
        instructions::update_token_price_with_signatures(ctx, _chain_id, number_of_signatures, msg)
    }

    pub fn mint_sbtc_with_signatures<'info>(
        ctx: Context<'_, '_, 'info, 'info, MintSbtcWithSignatures<'info>>,
        _chain_id: u8,
        number_of_signatures: u8,
        msg: MintSbtcMessage
    ) -> Result<()> {
        instructions::mint_sbtc_with_signatures(ctx, _chain_id, number_of_signatures, msg)
    }
}
