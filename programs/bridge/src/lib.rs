#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;
mod constants;
mod errors;
mod instructions;

#[cfg(feature = "devnet")]
declare_id!("Am2aeLabeQBtENUpMvEv8cWqnaiFzFBF1GtS8gHkhLLs");
#[cfg(not(feature = "devnet"))]
declare_id!("Am2aeLabeQBtENUpMvEv8cWqnaiFzFBF1GtS8gHkhLLs");

pub mod supper_admin {
    use anchor_lang::prelude::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV");
    #[cfg(not(feature = "devnet"))]
    declare_id!("admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV");
}
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
        administrator: Pubkey,
        fee_recipient: Pubkey,
        token_ids: Vec<u8>,
        supported_chains: Vec<u8>,
        token_fee_percentages: Vec<u64>,
        token_min_amount: Vec<u64>
    ) -> Result<()> {
        instructions::create_bridge_config(
            ctx,
            chain_id,
            administrator,
            fee_recipient,
            token_ids,
            supported_chains,
            token_fee_percentages,
            token_min_amount
        )
    }

    pub fn add_or_update_chain<'info>(
        ctx: Context<'_, '_, 'info, 'info, AddChain<'info>>,
        _chain_id: u8,
        supported_chain_id: u8,
        supported: bool
    ) -> Result<()> {
        instructions::add_or_update_chain(ctx, _chain_id, supported_chain_id, supported)
    }

    pub fn add_or_update_chain_token<'info>(
        ctx: Context<'_, '_, 'info, 'info, AddChainToken<'info>>,
        _chain_id: u8,
        supported_chain_id: u8,
        token_id: u8,
        token_fee_percentages: u64,
        token_min_amount: u64,
        withdraw_paused: bool
    ) -> Result<()> {
        instructions::add_or_update_chain_token(
            ctx,
            _chain_id,
            supported_chain_id,
            token_id,
            token_fee_percentages,
            token_min_amount,
            withdraw_paused
        )
    }

    pub fn create_bridge_committee<'info>(
        ctx: Context<'_, '_, 'info, 'info, CreateBridgeCommittee<'info>>,
        _chian_id: u8,
        committee: Vec<Pubkey>,
        stake: Vec<u16>
    ) -> Result<()> {
        instructions::create_bridge_committee(ctx, _chian_id, committee, stake)
    }

    pub fn add_or_update_committee<'info>(
        ctx: Context<'_, '_, 'info, 'info, AddOrUpdateCommittee<'info>>,
        _chian_id: u8,
        committee: Pubkey,
        stake: u16,
        is_blocklisted: bool
    ) -> Result<()> {
        instructions::add_or_update_committee(ctx, _chian_id, committee, stake, is_blocklisted)
    }

    pub fn add_or_update_submitter<'info>(
        ctx: Context<'_, '_, 'info, 'info, AddOrUpdateSubmitter<'info>>,
        _chian_id: u8,
        is_submitter: bool
    ) -> Result<()> {
        instructions::add_or_update_submitter(ctx, _chian_id, is_submitter)
    }

    pub fn mint_sbtc_with_signatures<'info>(
        ctx: Context<'_, '_, 'info, 'info, MintSbtc<'info>>,
        number_of_signatures: u8,
        msg: MintSbtcMessage
    ) -> Result<()> {
        instructions::mint_sbtc_with_signatures(ctx, number_of_signatures, msg)
    }

    pub fn withdraw_btc<'info>(
        ctx: Context<'_, '_, 'info, 'info, WithdrawBtc<'info>>,
        msg: WithdrawBtcMessage
    ) -> Result<()> {
        instructions::withdraw_btc(ctx, msg)
    }
}
