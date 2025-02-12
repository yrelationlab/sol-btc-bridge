use anchor_lang::{prelude::*, solana_program::{pubkey::Pubkey, sysvar::instructions as instructions_sysvar_module}};
use anchor_spl::associated_token::AssociatedToken;
use crate::{bridge::{ verify, Nonces, Operation, SupportedChainConfig, TokenConfig, WithdrawBtcMessage, WithdrawBtctcEvent }, constants::{
    COMMITTEE_SUBMITTER_CONFIG, FEE_DENOMINATOR, GLOBAL_CONFIG, MAX_STRING_LENGTH, NONCE_CONFIG, SBTC_MINT, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG
}, errors::ErrorCode, Submitter};
use anchor_spl::token::{ self, Burn, Mint, TokenAccount, Transfer };
use crate::BridgeConfig;

pub fn withdraw_btc_with_signatures<'info>(
    ctx: Context<'_, '_, 'info, 'info, WithdrawBtcWithSignatures<'info>>,
    number_of_signatures: u8,
    msg: WithdrawBtcMessage
) -> Result<()> {
    let nonce_config = &mut ctx.accounts.nonce;
    let supported_chain_config = &mut ctx.accounts.supported_chain_config;
    let token_config = &mut ctx.accounts.token_config;

    require!(msg.to_address.len() <= MAX_STRING_LENGTH, ErrorCode::InvalidAddress);

    verify(
        &ctx.remaining_accounts,
        &ctx.accounts.instructions_sysvar,
        ctx.program_id,
        number_of_signatures,
        &msg,
        Operation::TokenTransfer,
        nonce_config
    )?;

    msg!("verify success!");
    let fee = (((msg.amount as u128) * (token_config.token_fee_percentage as u128)) /
        (FEE_DENOMINATOR as u128)) as u64;
    let amount = msg.amount - fee;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_sbtc_ata.to_account_info(),
                to: ctx.accounts.fee_recipient_sbtc_ata.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        fee as u64
    )?;

    msg!("transfer fee success!");

     token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.sbtc_mint.to_account_info(),
                from: ctx.accounts.user_sbtc_ata.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;
    msg!("burn success!");

    supported_chain_config.mint_total -= (amount + fee) as u128;
    token_config.mint_total -= (amount + fee) as u128;

    emit!(WithdrawBtctcEvent {
        message_type: msg.message_type,
        version: msg.version,
        nonce: msg.nonce,
        to_chain_id: msg.to_chain_id,
        to_token_id: msg.to_token_id,
        from_address: msg.from_address,
        chain_id: msg.chain_id,
        to_address: msg.to_address,
        amount: msg.amount,
        chain_mint_total: supported_chain_config.mint_total,
        token_mint_total: token_config.mint_total,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(number_of_signatures: u8, msg: WithdrawBtcMessage)]
pub struct WithdrawBtcWithSignatures<'info> {
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
        seeds = [
            GLOBAL_CONFIG.as_bytes(),
            &msg.chain_id.to_be_bytes()
        ],
        bump,
        constraint = bridge_config.is_initialized @ ErrorCode::BridgeConfigNotInitialized,
        constraint = !bridge_config.withdraw_paused @ ErrorCode::WithdrawPaused,
        constraint = msg.chain_id != msg.to_chain_id @ ErrorCode::ChainIdShouldDiffFromSolanaChainId
    )]
    pub bridge_config: Box<Account<'info, BridgeConfig>>,

    #[account(
        seeds = [
            SUPPORTED_CHAINS_CONFIG.as_ref(),
            msg.to_chain_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = (msg.amount as u128) <= supported_chain_config.mint_total @ ErrorCode::LackTargetMint,

    )]
    pub supported_chain_config: Box<Account<'info, SupportedChainConfig>>,

    #[account(
        seeds = [
            TOKEN_CONFIG.as_ref(),
            msg.to_chain_id.to_be_bytes().as_ref(),
            msg.to_token_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = msg.amount >= token_config.token_min_amount @ ErrorCode::InvalidMinAmount,
        constraint = (msg.amount as u128) <= token_config.mint_total @ ErrorCode::LackTargetMint,
    )]
    pub token_config: Box<Account<'info, TokenConfig>>,

    #[account(
        mut,
        seeds = [
            SBTC_MINT.as_bytes(),
            &msg.chain_id.to_be_bytes()
        ],
        bump,
    )]
    pub sbtc_mint: Account<'info, Mint>,

    /// the user's sBTC Token Account
    #[account(associated_token::mint = sbtc_mint, associated_token::authority = user)]
    pub user_sbtc_ata: Box<Account<'info, TokenAccount>>,

    /// the user to receive minted sBTC
    /// CHECK: only need .key()
    #[account(
        mut,
        constraint = Pubkey::new_from_array(msg.from_address) == user.key() @ ErrorCode::InvalidUserAddress,
    )]
    pub user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = submitter,
        associated_token::mint = sbtc_mint,
        associated_token::authority = fee_recipient
    )]
    pub fee_recipient_sbtc_ata: Box<Account<'info, TokenAccount>>,

    /// CHECK: only need .key()
    #[account(
        mut,
        constraint = bridge_config.fee_recipient == fee_recipient.key() @ ErrorCode::InvalidFeeRecipient,
    )]
    pub fee_recipient: UncheckedAccount<'info>,

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
