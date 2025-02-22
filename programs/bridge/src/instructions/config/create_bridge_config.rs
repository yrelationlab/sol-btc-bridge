/// Creates a new bridge configuration.
use crate::{
    bridge::create_account_ifn_exist,
    constants::{ ANCHOR_HEADER_LEN, DECIMALS9, FEE_DENOMINATOR, GLOBAL_CONFIG, SBTC_MINT },
    errors::ErrorCode,
    find_ata_in_accounts,
    get_support_chains_pda_bump_seeds,
    get_token_pda_bump_seeds,
    BridgeConfig,
    SupportedChainConfig,
    TokenConfig,
};
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::{ prelude::*, Discriminator };

use anchor_spl::token::{ Mint, Token };

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
    let bridge_config = &mut ctx.accounts.bridge_config;

    require!(token_ids.len() == supported_chains.len(), ErrorCode::InvalidTokenIds);

    require!(token_ids.len() == token_fee_percentages.len(), ErrorCode::InvalidTokenFeePercentage);

    require!(token_ids.len() == token_min_amount.len(), ErrorCode::InvalidTokenMinimumAmount);

    require!(fee_recipient != Pubkey::default(), ErrorCode::InvalidFeeRecipientAddress);
    require!(administrator != Pubkey::default(), ErrorCode::InvalidAdminAddress);

    bridge_config.chain_id = chain_id;
    bridge_config.admin = administrator;
    bridge_config.fee_recipient = fee_recipient;
    bridge_config.sbtc_mint = ctx.accounts.sbtc_mint.key();
    bridge_config.is_initialized = true;

    for (i, supported_chain_id) in supported_chains.iter().enumerate() {
        if *supported_chain_id == chain_id {
            return err!(ErrorCode::ChainIdShouldDiffFromSolanaChainId);
        }
        let (pda_of_token_config_addr, _, _, signer_seeds) = get_token_pda_bump_seeds(
            ctx.program_id,
            supported_chain_id.to_be_bytes().as_ref(),
            token_ids[i].to_be_bytes().as_ref()
        );
        msg!("i:{}, pda_of_token_config_addr: {:?}", i, pda_of_token_config_addr);

        let pda_of_token_config = find_ata_in_accounts(
            ctx.remaining_accounts.to_vec(),
            &pda_of_token_config_addr
        ).ok_or(ErrorCode::TokenConfigAddressMissing)?;
        // 只能批量创建
        let current_lamports = pda_of_token_config.lamports();
        if current_lamports == 0 {
            create_account_ifn_exist(
                &ctx.program_id,
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                pda_of_token_config.clone(),
                &signer_seeds
                    .iter()
                    .map(|v| v.as_slice())
                    .collect::<Vec<&[u8]>>()
                    .as_slice(),
                TokenConfig::LEN
            )?;

            require!(
                token_fee_percentages[i] < FEE_DENOMINATOR,
                ErrorCode::BiggerThanFeeDenominator
            );

            let discriminator = TokenConfig::discriminator(); // 获取 discriminator
            let account_data = &mut *pda_of_token_config.try_borrow_mut_data()?;
            account_data[..ANCHOR_HEADER_LEN].copy_from_slice(&discriminator);
            let bridge_config_of_token = TokenConfig {
                is_initialized: true,
                token_id: token_ids[i],
                chain_id: *supported_chain_id,
                decimal: DECIMALS9,
                native: false,
                token_fee_percentage: token_fee_percentages[i],
                token_min_amount: token_min_amount[i],
                padding: [0u64; TokenConfig::LEN_OF_PADDING],
                withdraw_paused: false,
                mint_total: 0,
            };
            bridge_config_of_token
                .serialize(&mut &mut account_data[ANCHOR_HEADER_LEN..]) // 从第 9 字节开始写入
                .map_err(|error| {
                    msg!("BridgeConfigSerializationError: error={}", error);
                    ErrorCode::BridgeConfigSerializationError
                })?;
        }

        // 只能批量创建
        require!(*supported_chain_id != bridge_config.chain_id, ErrorCode::CannotSupportSelf);
        let (pda_of_supported_chains_config_addr, _, _, signer_seeds) =
            get_support_chains_pda_bump_seeds(ctx.program_id, supported_chain_id.to_be_bytes());
        let pda_of_supported_chains_config = find_ata_in_accounts(
            ctx.remaining_accounts.to_vec(),
            &pda_of_supported_chains_config_addr
        ).ok_or(ErrorCode::SupportedChainAddressMissing)?;

        let current_lamports = pda_of_supported_chains_config.lamports();
        if current_lamports == 0 {
            create_account_ifn_exist(
                &ctx.program_id,
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                pda_of_supported_chains_config.clone(),
                &signer_seeds
                    .iter()
                    .map(|v| v.as_slice())
                    .collect::<Vec<&[u8]>>()
                    .as_slice(),
                SupportedChainConfig::LEN
            )?;

            let discriminator = SupportedChainConfig::discriminator(); // 获取 discriminator
            let account_data = &mut *pda_of_supported_chains_config.try_borrow_mut_data()?;
            account_data[..ANCHOR_HEADER_LEN].copy_from_slice(&discriminator);
            let supported_chain: SupportedChainConfig = SupportedChainConfig {
                is_initialized: true,
                chain_id: *supported_chain_id,
                supported: true,
                mint_total: 0 as u128,
                padding: [0u64; SupportedChainConfig::LEN_OF_PADDING],
            };

            supported_chain
                .serialize(&mut &mut account_data[ANCHOR_HEADER_LEN..]) //
                .map_err(|error| {
                    msg!("SupportedChainSerializationError: error={}", error);
                    ErrorCode::SupportedChainSerializationError
                })?;
        }
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
        seeds = [GLOBAL_CONFIG.as_bytes(), &chain_id.to_be_bytes()],
        bump
    )]
    pub bridge_config: Account<'info, BridgeConfig>,

    /// The account paying for all rents
    #[account(
        mut,
        address = crate::supper_admin::id() @ ErrorCode::InvalidAdminAddress
    )]
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
        mint::decimals = 10,
        mint::authority = sbtc_mint,
        mint::freeze_authority = sbtc_mint
    )]
    pub sbtc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
