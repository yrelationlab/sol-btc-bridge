use crate::{
    constants::{
        DECIMALS9, GLOBAL_CONFIG, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG,
    }, create_or_allocate_account, errors::BridgeError, BridgeConfig, SupportedChainConfig, TokenConfig
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::{prelude::*, Discriminator};
use solana_program::pubkey;
// Hardcoded pubkey for create memoo config
const HARDCODED_PUBKEY: Pubkey = pubkey!("admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV");

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
            .find(|ac: &&AccountInfo<'info>| ac.key.eq(ata_pubkey))
    };
    for (i, token_address) in supported_tokens.iter().enumerate() {
        let chain_id_bytes = bridge_config.chain_id.to_be_bytes();
        let seeds = &[
            TOKEN_CONFIG.as_ref(),
            token_address.as_ref(),
            chain_id_bytes.as_ref(),
        ];
        let (pda_of_token_config_addr, bump) = Pubkey::find_program_address(seeds, ctx.program_id);
        let pda_of_token_config = find_ata_in_accounts(&pda_of_token_config_addr)
            .ok_or(BridgeError::TokenConfigAddressMissing)?;
        create_or_allocate_account(
            &ctx.program_id,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            pda_of_token_config.clone(),
            &[
                TOKEN_CONFIG.as_ref(),
                token_address.as_ref(),
                chain_id_bytes.as_ref(),
                &[bump],
            ],
            TokenConfig::LEN,
        )?;
        let discriminator = TokenConfig::discriminator(); // 获取 discriminator
        let account_data = &mut *pda_of_token_config.try_borrow_mut_data()?;
        account_data[..8].copy_from_slice(&discriminator);
        let bridge_config_of_token = TokenConfig {
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
            .serialize(&mut &mut account_data[8..]) // 从第 9 字节开始写入
            .map_err(|error| {
                msg!("BridgeConfigSerializationError: error={}", error);
                BridgeError::BridgeConfigSerializationError
            })?;
    }
    for (_i, chain_id) in supported_chains.iter().enumerate() {
        require!(
            *chain_id != bridge_config.chain_id,
            BridgeError::CannotSupportSelf
        );

        let seeds = &[SUPPORTED_CHAINS_CONFIG.as_bytes(), &chain_id.to_be_bytes()];
        let (pda_of_supported_chains_config_addr, bump) =
            Pubkey::find_program_address(seeds, ctx.program_id);
        let pda_of_supported_chains_config =
            find_ata_in_accounts(&pda_of_supported_chains_config_addr)
                .ok_or(BridgeError::SupportedChainAddressMissing)?;
        create_or_allocate_account(
            &ctx.program_id,
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            pda_of_supported_chains_config.clone(),
            &[
                SUPPORTED_CHAINS_CONFIG.as_bytes(),
                &chain_id.to_be_bytes(),
                &[bump],
            ],
            SupportedChainConfig::LEN,
        )?;

        let discriminator = SupportedChainConfig::discriminator(); // 获取 discriminator
        let account_data = &mut *pda_of_supported_chains_config.try_borrow_mut_data()?;
        account_data[..8].copy_from_slice(&discriminator);
        let supported_chain = SupportedChainConfig {
            chain_id: *chain_id,
            supported: true,
            padding: [0u64; SupportedChainConfig::LEN_OF_PADDING],
        };

        supported_chain
            .serialize(&mut &mut account_data[8..]) //
            .map_err(|error| {
                msg!("SupportedChainSerializationError: error={}", error);
                BridgeError::SupportedChainSerializationError
            })?;
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(chain_id: u8)]
pub struct CreateBridgeConfig<'info> {
    #[account(
        init_if_needed,
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
