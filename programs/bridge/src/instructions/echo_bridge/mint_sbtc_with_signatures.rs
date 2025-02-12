use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;

use crate::bridge::{ verify, MintSbtcEvent, Nonces, Operation, SupportedChainConfig, TokenConfig };
use crate::constants::{
    COMMITTEE_SUBMITTER_CONFIG,
    GLOBAL_CONFIG,
    NONCE_CONFIG,
    SBTC_MINT,
    SUPPORTED_CHAINS_CONFIG,
    TOKEN_CONFIG,
};
use crate::errors::ErrorCode;
use crate::{ MintSbtcMessage, Submitter };
use anchor_spl::token::{ Mint, TokenAccount };
use crate::BridgeConfig;
pub fn mint_sbtc_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, MintSbtc<'info>>,
    number_of_signatures: u8,
    msg: MintSbtcMessage
) -> Result<()> {
    let nonce_config = &mut ctx.accounts.nonce;
    let supported_chain_config = &mut ctx.accounts.supported_chain_config;
    let token_config = &mut ctx.accounts.token_config;

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

    // 3) anchor_spl::token::mint_to
    let bump = ctx.bumps.sbtc_mint;
    let seeds = [SBTC_MINT.as_bytes(), &msg.to_chain_id.to_be_bytes(), &[bump]];

    // Prepare signer with the bump included
    let signer = &[&seeds[..]];

    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::MintTo {
            mint: ctx.accounts.sbtc_mint.to_account_info(),
            to: ctx.accounts.user_sbtc_ata.to_account_info(),
            authority: ctx.accounts.sbtc_mint.to_account_info(),
        },
        signer
    );
    anchor_spl::token::mint_to(mint_to_ctx, amount)?;
    supported_chain_config.mint_total += amount as u128;
    token_config.mint_total += amount as u128;

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
        constraint = submitter_account.is_initialized @ ErrorCode::SubmitterNotInitialized,
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
        constraint = msg.amount >= token_config.token_min_amount @ ErrorCode::InvalidMinAmount,

    )]
    pub token_config: Box<Account<'info, TokenConfig>>,

    #[account(
        mut,
        seeds = [
            SBTC_MINT.as_bytes(),
            &msg.to_chain_id.to_be_bytes()
        ],
        bump,
    )]
    pub sbtc_mint: Account<'info, Mint>,

    /// the user's sBTC Token Account
    #[account(
        init_if_needed,
        payer = submitter,
        associated_token::mint = sbtc_mint,
        associated_token::authority = user
    )]
    pub user_sbtc_ata: Account<'info, TokenAccount>,

    /// the user to receive minted sBTC
    /// CHECK: only need .key()
    pub user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = submitter,
        space = Nonces::LEN,
        seeds = [NONCE_CONFIG.as_ref(), Operation::TokenTransfer.to_bytes().as_slice()],
        bump
    )]
    pub nonce: Box<Account<'info, Nonces>>,

    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}
