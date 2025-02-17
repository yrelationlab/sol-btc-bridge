use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::{ get_associated_token_address, AssociatedToken };

use crate::bridge::{
    check_transfer,
    create_associated_token_account_ifn_init,
    verify,
    ChainTokenLimiter,
    MintSbtcEvent,
    Nonces,
    Operation,
    SupportedChainConfig,
    TokenConfig,
};
use crate::constants::{
    COMMITTEE_SUBMITTER_CONFIG,
    GLOBAL_CONFIG,
    LIMITER_CONFIG,
    NONCE_CONFIG,
    SBTC_MINT,
    SUPPORTED_CHAINS_CONFIG,
    TOKEN_CONFIG,
};
use crate::errors::ErrorCode;
use crate::{ MintSbtcMessage, Submitter };
use crate::BridgeConfig;

pub fn mint_sbtc_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, MintSbtc<'info>>,
    number_of_signatures: u8,
    msg: MintSbtcMessage
) -> Result<()> {
    let nonce_config = &mut ctx.accounts.nonce;
    let supported_chain_config = &mut ctx.accounts.supported_chain_config;
    let token_config = &mut ctx.accounts.token_config;
    let limiter = &mut ctx.accounts.limiter;

    verify(
        &ctx.remaining_accounts,
        &ctx.accounts.instructions_sysvar,
        ctx.program_id,
        number_of_signatures,
        &msg,
        Operation::TokenTransfer,
        nonce_config
    )?;

    // 2) parse msg.payload => (amount, user, ...)
    let amount = msg.amount;

    let (user_account, user_sbtc_ata, sbtc_mint, sbtc_mint_bumps) = get_accounts(
        ctx.program_id,
        ctx.remaining_accounts,
        &Pubkey::new_from_array(msg.to_address),
        &msg.to_chain_id
    )?;

    create_associated_token_account_ifn_init(
        ctx.accounts.submitter.to_account_info(),
        user_account.to_account_info(),
        sbtc_mint.to_account_info(),
        user_sbtc_ata.to_account_info(),
        ctx.accounts.associated_token_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info()
    )?;

    // 3) anchor_spl::token::mint_to
    let seeds = [SBTC_MINT.as_bytes(), &msg.to_chain_id.to_be_bytes(), &[sbtc_mint_bumps]];

    // Prepare signer with the bump included
    let signer = &[&seeds[..]];

    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::MintTo {
            mint: sbtc_mint.to_account_info(),
            to: user_sbtc_ata.to_account_info(),
            authority: sbtc_mint.to_account_info(),
        },
        signer
    );
    anchor_spl::token::mint_to(mint_to_ctx, amount)?;
    supported_chain_config.mint_total += amount as u128;
    token_config.mint_total += amount as u128;

    check_transfer(limiter, amount)?;

    emit!(MintSbtcEvent {
        message_type: msg.message_type,
        version: msg.version,
        nonce: msg.nonce,
        source_chain_id: msg.source_chain_id,
        source_token_id: msg.source_token_id,
        from_address: msg.from_address,
        to_chain_id: msg.to_chain_id,
        to_address: msg.to_address,
        amount: msg.amount,
        chain_mint_total: supported_chain_config.mint_total,
        token_mint_total: token_config.mint_total,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(number_of_signatures: u8, msg: MintSbtcMessage)]
pub struct MintSbtc<'info> {
    /// The submitter calls it
    #[account(mut)]
    pub submitter: Signer<'info>,

    #[account(
        constraint = submitter_account.is_submitter @ ErrorCode::NotSubmitter,
        seeds = [
            COMMITTEE_SUBMITTER_CONFIG.as_ref(),
            submitter.key().as_ref(),
        ],
        bump
    )]
    pub submitter_account: Box<Account<'info, Submitter>>,

    /// 1. load BridgeConfig
    #[account(
        mut,
        seeds = [
            GLOBAL_CONFIG.as_bytes(),
            msg.to_chain_id.to_be_bytes().as_ref()
        ],
        bump,
        constraint = bridge_config.is_initialized @ ErrorCode::BridgeConfigNotInitialized,
        constraint = !bridge_config.withdraw_paused @ ErrorCode::BridgeWithdrawPaused,
        constraint = msg.source_chain_id != msg.to_chain_id @ ErrorCode::ChainIdShouldDiffFromSolanaChainId
    )]
    pub bridge_config: Box<Account<'info, BridgeConfig>>,

    #[account(
        mut,
        seeds = [
            SUPPORTED_CHAINS_CONFIG.as_ref(),
            msg.source_chain_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = supported_chain_config.is_initialized @ ErrorCode::SupportedChainConfigNotInitialized,
        constraint = supported_chain_config.supported == true @ ErrorCode::InvalidChain
    )]
    pub supported_chain_config: Box<Account<'info, SupportedChainConfig>>,

    #[account(
        mut,
        seeds = [
            TOKEN_CONFIG.as_ref(),
            msg.source_chain_id.to_be_bytes().as_ref(),
            msg.source_token_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = token_config.is_initialized @ ErrorCode::TokenConfigNotInitialized,
        constraint = !token_config.withdraw_paused @ ErrorCode::WithdrawPaused,
        constraint = msg.amount >= token_config.token_min_amount @ ErrorCode::InvalidMinAmount,
    )]
    pub token_config: Box<Account<'info, TokenConfig>>,

    // #[account(
    //     mut,
    //     seeds = [
    //         SBTC_MINT.as_bytes(),
    //         &msg.to_chain_id.to_be_bytes()
    //     ],
    //     bump,
    // )]
    // pub sbtc_mint: Account<'info, Mint>,

    // /// the user's sBTC Token Account
    // #[account(
    //     init_if_needed,
    //     payer = submitter,
    //     associated_token::mint = sbtc_mint,
    //     associated_token::authority = user
    // )]
    // pub user_sbtc_ata: Account<'info, TokenAccount>,

    /// the user to receive minted sBTC
    /// CHECK: only need .key()
    // pub user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = submitter,
        space = Nonces::LEN,
        seeds = [NONCE_CONFIG.as_ref(), Operation::TokenTransfer.to_bytes().as_slice()],
        bump
    )]
    pub nonce: Box<Account<'info, Nonces>>,

    #[account(
        mut,
        seeds = [
            LIMITER_CONFIG.as_bytes(),
            &msg.source_chain_id.to_be_bytes(),
            &msg.source_token_id.to_be_bytes(),
        ],
        bump
    )]
    pub limiter: Account<'info, ChainTokenLimiter>,

    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

fn get_accounts<'info>(
    program_id: &Pubkey,
    remaining_accounts: &'info [AccountInfo<'info>], // 显式指定生命周期
    user: &Pubkey,
    chain_id: &u8
) -> Result<
    (
        &'info AccountInfo<'info>, // user_account
        &'info AccountInfo<'info>, // user_sbtc_ata
        &'info AccountInfo<'info>, // sbtc_mint_account
        u8, //sbtc_mint_bumps
    )
> {
    let binding = chain_id.to_be_bytes();
    let seeds = &[SBTC_MINT.as_ref(), binding.as_ref()];
    let (sbtc_mint, sbtc_mint_bumps) = Pubkey::find_program_address(seeds, program_id);
    let user_ata = get_associated_token_address(user, &sbtc_mint);

    let mut user_account: Option<&'info AccountInfo<'info>> = None;
    let mut user_sbtc_ata_account: Option<&'info AccountInfo<'info>> = None;
    let mut sbtc_mint_account: Option<&'info AccountInfo<'info>> = None;

    // 查找所有目标账户
    for account in remaining_accounts {
        if *account.key == user_ata {
            user_sbtc_ata_account = Some(account);
        } else if *account.key == sbtc_mint {
            sbtc_mint_account = Some(account);
        } else if *account.key == *user {
            user_account = Some(account);
        }

        if user_sbtc_ata_account.is_some() && sbtc_mint_account.is_some() && user_account.is_some() {
            break;
        }
    }
    let user_account = user_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::UserNotFound)
    })?;

    let user_sbtc_ata_account = user_sbtc_ata_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::UserSbtcAtaNotFound)
    })?;

    let sbtc_mint_account = sbtc_mint_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::SbtcMintAccountNotFound)
    })?;

    Ok((user_account, user_sbtc_ata_account, sbtc_mint_account, sbtc_mint_bumps))
}
