
use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use solana_program::pubkey;
use crate::{
    constants::{ANCHOR_HEADER_LEN, DECIMALS9, GLOBAL_CONFIG, TOKEN_CONFIG},
    create_or_allocate_account,
    errors::BridgeError,
    state::{BridgeConfig, BridgeConfigOfToken},
};
use std::ops::DerefMut;
// Hardcoded pubkey for create memoo config
const HARDCODED_PUBKEY: Pubkey = pubkey!("aaaPoyXwYeg7hjfCB4wVxzz5B3SB5rjLyAZxKU5hXw2");
pub fn create_bridge_config<'info>(
    ctx: Context<'_, '_, '_, 'info, CreateBridgeConfig<'info>>,
    chain_id: u8,
    fee_recipient: Pubkey,
    supported_tokens: Vec<Pubkey>,
    token_prices: Vec<u64>,
    supported_chains: Vec<u8>,
    token_fee_percentages: Vec<u64>,
    token_min_amount: Vec<u64>,
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    require!(
        supported_tokens.len() == 1,
        BridgeError::InvalidSupportedTokenAddresses
    );
    require!(
        supported_tokens.len() == token_fee_percentages.len(),
        BridgeError::InvalidTokenFeePercentage
    );
    require!(
        supported_tokens.len() == token_min_amount.len(),
        BridgeError::InvalidTokenMinimumAmount
    );
    require!(
        supported_tokens.len() == token_prices.len(),
        BridgeError::InvalidTokenPrices
    );
    require!(
        fee_recipient != Pubkey::default(),
        BridgeError::InvalidFeeRecipientAddress
    );
    bridge_config.chain_id = chain_id;
    bridge_config.admin = ctx.accounts.payer.key();
    bridge_config.fee_recipient = fee_recipient;
    let find_ata_in_accounts = |ata_pubkey: &Pubkey| {
        ctx.remaining_accounts
            .iter()
            .find(|ac: &&AccountInfo| ac.key.eq(ata_pubkey))
    };
    for (i, token_address) in supported_tokens.iter().enumerate() {
        require!(
            supported_chains[i] != bridge_config.chain_id,
            BridgeError::CannotSupportSelf
        );
        let seeds = &[TOKEN_CONFIG.as_bytes(), &supported_chains[i].to_be_bytes()];
        let (pda_of_token_config_addr, bump) = Pubkey::find_program_address(seeds, ctx.program_id);
        let pda_of_token_config = find_ata_in_accounts(&pda_of_token_config_addr)
            .ok_or(BridgeError::TokenConfigAddressMissing)?;
        create_or_allocate_account(
            &ctx.program_id,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            pda_of_token_config.clone(),
            &[
                TOKEN_CONFIG.as_bytes(),
                &supported_chains[i].to_be_bytes(),
                &[bump],
            ],
            BridgeConfigOfToken::LEN,
        )?;
        let mut data = pda_of_token_config.try_borrow_mut_data()?;
        let mut bridge_config_of_token = BridgeConfigOfToken::try_from_slice(
            &data.deref_mut()[ANCHOR_HEADER_LEN..BridgeConfigOfToken::LEN],
        )
        .map_err(|_| BridgeError::DeserializationError)?;
        bridge_config_of_token.chain_id = supported_chains[i];
        bridge_config_of_token.token_address = *token_address;
        bridge_config_of_token.decimal = DECIMALS9;
        bridge_config_of_token.native = false;
        bridge_config_of_token.token_price = token_prices[i];
        bridge_config_of_token.token_fee_percentage = token_fee_percentages[i];
        bridge_config_of_token.token_min_amount = token_min_amount[i];
        bridge_config_of_token.padding = [0u8; BridgeConfigOfToken::LEN_OF_PADDING];
        bridge_config_of_token
            .serialize(&mut &mut data.deref_mut()[ANCHOR_HEADER_LEN..BridgeConfigOfToken::LEN])
            .map_err(|_| BridgeError::SerializationError)?;
    }
    Ok(())
}
#[derive(Accounts)]
#[instruction(chain_id: u8)]
pub struct CreateBridgeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = BridgeConfig::LEN,
        seeds = [
            GLOBAL_CONFIG.as_bytes(),
            &chain_id.to_be_bytes()
        ],
        bump
    )]
    pub bridge_config: Account<'info, BridgeConfig>,
    /// The account paying for all rents
    #[account(
        mut,
        address = HARDCODED_PUBKEY @ BridgeError::InvalidAdminAddress
    )]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
