use crate::{
    constants::{
        ANCHOR_HEADER_LEN, DECIMALS9, GLOBAL_CONFIG, HARDCODED_PUBKEY, SUPPORTED_CHAINS_CONFIG,
        TOKEN_CONFIG,
    },
    create_account,
    errors::ErrorCode,
    find_ata_in_accounts, get_support_chains_pda_bump_seeds, get_token_pda_bump_seeds,
    BridgeConfig, SupportedChainConfig, TokenConfig,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::{prelude::*, Discriminator};
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
    let bridge_config = &mut ctx.accounts.bridge_config;
    require!(
        supported_tokens.len() == token_fee_percentages.len(),
        ErrorCode::InvalidTokenFeePercentage
    );

    require!(
        supported_tokens.len() == token_min_amount.len(),
        ErrorCode::InvalidTokenMinimumAmount
    );

    require!(
        supported_tokens.len() == token_prices.len(),
        ErrorCode::InvalidTokenPrices
    );
    require!(
        fee_recipient != Pubkey::default(),
        ErrorCode::InvalidFeeRecipientAddress
    );
    bridge_config.chain_id = chain_id;
    bridge_config.admin = ctx.accounts.payer.key();
    bridge_config.fee_recipient = fee_recipient;

    for (i, token_address) in supported_tokens.iter().enumerate() {
        let (pda_of_token_config_addr, _, _, signer_seeds) = get_token_pda_bump_seeds(
            ctx.program_id,
           (i as u8).to_be_bytes(),
        );
        let pda_of_token_config =
            find_ata_in_accounts(ctx.remaining_accounts.to_vec(), &pda_of_token_config_addr)
                .ok_or(ErrorCode::TokenConfigAddressMissing)?;
        create_account(
            &ctx.program_id,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            pda_of_token_config.clone(),
            &signer_seeds
                .iter()
                .map(|v| v.as_slice())
                .collect::<Vec<&[u8]>>()
                .as_slice(),
            TokenConfig::LEN,
        )?;
        let discriminator = TokenConfig::discriminator(); // 获取 discriminator
        let account_data = &mut *pda_of_token_config.try_borrow_mut_data()?;
        account_data[..ANCHOR_HEADER_LEN].copy_from_slice(&discriminator);
        let bridge_config_of_token = TokenConfig {
            is_initialized: true,
            chain_id: supported_chains[i],
            token_address: *token_address,
            decimal: DECIMALS9,
            native: false,
            token_price: token_prices[i],
            token_fee_percentage: token_fee_percentages[i],
            token_min_amount: token_min_amount[i],
            padding: [0u64; TokenConfig::LEN_OF_PADDING],
        };
        bridge_config_of_token
            .serialize(&mut &mut account_data[ANCHOR_HEADER_LEN..]) // 从第 9 字节开始写入
            .map_err(|error| {
                msg!("BridgeConfigSerializationError: error={}", error);
                ErrorCode::BridgeConfigSerializationError
            })?;
    }
    for (_i, chain_id) in supported_chains.iter().enumerate() {
        require!(
            *chain_id != bridge_config.chain_id,
            ErrorCode::CannotSupportSelf
        );
        let (pda_of_supported_chains_config_addr, _, _, signer_seeds) =
            get_support_chains_pda_bump_seeds(ctx.program_id, chain_id.to_be_bytes());
        let pda_of_supported_chains_config = find_ata_in_accounts(
            ctx.remaining_accounts.to_vec(),
            &pda_of_supported_chains_config_addr,
        )
        .ok_or(ErrorCode::SupportedChainAddressMissing)?;
        create_account(
            &ctx.program_id,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            pda_of_supported_chains_config.clone(),
            &signer_seeds
                .iter()
                .map(|v| v.as_slice())
                .collect::<Vec<&[u8]>>()
                .as_slice(),
            SupportedChainConfig::LEN,
        )?;

        let discriminator = SupportedChainConfig::discriminator(); // 获取 discriminator
        let account_data = &mut *pda_of_supported_chains_config.try_borrow_mut_data()?;
        account_data[..ANCHOR_HEADER_LEN].copy_from_slice(&discriminator);
        let supported_chain = SupportedChainConfig {
            is_initialized: true,
            chain_id: *chain_id,
            supported: true,
            padding: [0u64; SupportedChainConfig::LEN_OF_PADDING],
        };

        supported_chain
            .serialize(&mut &mut account_data[ANCHOR_HEADER_LEN..]) //
            .map_err(|error| {
                msg!("SupportedChainSerializationError: error={}", error);
                ErrorCode::SupportedChainSerializationError
            })?;
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
        address = HARDCODED_PUBKEY @ ErrorCode::InvalidAdminAddress
    )]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
