use anchor_lang::{ prelude::*, solana_program::pubkey::Pubkey };
use anchor_spl::associated_token::{ get_associated_token_address, AssociatedToken };
use crate::{
    bridge::{
        create_associated_token_account_ifn_init,
        Nonces,
        Operation,
        SupportedChainConfig,
        TokenConfig,
        WithdrawBtcMessage,
        WithdrawBtctcEvent,
    },
    constants::{
        FEE_DENOMINATOR,
        GLOBAL_CONFIG,
        MAX_STRING_LENGTH,
        NONCE_CONFIG,
        SBTC_MINT,
        SUPPORTED_CHAINS_CONFIG,
        TOKEN_CONFIG,
    },
    errors::ErrorCode,
};
use anchor_spl::token::{ self, Burn, Transfer };
use crate::BridgeConfig;

pub fn withdraw_btc<'info>(
    ctx: Context<'_, '_, 'info, 'info, WithdrawBtc<'info>>,
    msg: WithdrawBtcMessage
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    let nonce_config = &mut ctx.accounts.nonce;
    let supported_chain_config = &mut ctx.accounts.supported_chain_config;
    let token_config = &mut ctx.accounts.token_config;

    require!(msg.to_address.len() <= MAX_STRING_LENGTH, ErrorCode::InvalidAddress);

    // fix: 在withdraw 的时候不需要判断 nonce，仅需要做 nonce 的自增，并抛出到日志中
    nonce_config.nonce += 1;

    //get ata
    // &'info AccountInfo<'info>, // user_account
    // &'info AccountInfo<'info>, // user_sbtc_ata
    // &'info AccountInfo<'info>, // fee_recipient_account
    // &'info AccountInfo<'info>, // fee_recipient_sbtc_ata
    // &'info AccountInfo<'info>, // sbtc_mint_account
    let (user_sbtc_ata, fee_recipient_account, fee_recipient_sbtc_ata, sbtc_mint) = get_accounts(
        ctx.program_id,
        ctx.remaining_accounts,
        &Pubkey::new_from_array(msg.from_address),
        &bridge_config.fee_recipient,
        &msg.chain_id
    )?;

    let user_account = ctx.accounts.user.to_account_info();

    create_associated_token_account_ifn_init(
        ctx.accounts.user.to_account_info(),
        fee_recipient_account.to_account_info(),
        sbtc_mint.to_account_info(),
        fee_recipient_sbtc_ata.to_account_info(),
        ctx.accounts.associated_token_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info()
    )?;
    let fee = (((msg.amount as u128) * (token_config.token_fee_percentage as u128)) /
        (FEE_DENOMINATOR as u128)) as u64;
    let amount = msg.amount - fee;
    msg!("transfer fee start!");

    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
            from: user_sbtc_ata.to_account_info(),
            to: fee_recipient_sbtc_ata.to_account_info(),
            authority: user_account.to_account_info(),
        }),
        fee as u64
    )?;

    msg!("transfer fee success!");

    token::burn(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), Burn {
            mint: sbtc_mint.to_account_info(),
            from: user_sbtc_ata.to_account_info(),
            authority: user_account.to_account_info(),
        }),
        amount
    )?;
    msg!("burn success!");

    supported_chain_config.mint_total -= (amount + fee) as u128;
    token_config.mint_total -= (amount + fee) as u128;

    emit!(WithdrawBtctcEvent {
        nonce: nonce_config.nonce,
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
#[instruction(msg: WithdrawBtcMessage)]
pub struct WithdrawBtc<'info> {
    #[account(
        mut,
        constraint = Pubkey::new_from_array(msg.from_address) == user.key() @ ErrorCode::InvalidUserAddress,
    )]
    pub user: Signer<'info>,

    /// 1. load BridgeConfig
    #[account(
        seeds = [
            GLOBAL_CONFIG.as_bytes(),
            &msg.chain_id.to_be_bytes()
        ],
        bump,
        constraint = bridge_config.is_initialized @ ErrorCode::BridgeConfigNotInitialized,
        constraint = !bridge_config.withdraw_paused @ ErrorCode::BridgeWithdrawPaused,
        constraint = msg.chain_id != msg.to_chain_id @ ErrorCode::ChainIdShouldDiffFromSolanaChainId
    )]
    pub bridge_config: Box<Account<'info, BridgeConfig>>,

    #[account(
        seeds = [
            SUPPORTED_CHAINS_CONFIG.as_ref(),
            msg.to_chain_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = supported_chain_config.is_initialized @ ErrorCode::SupportedChainConfigNotInitialized,
        constraint = supported_chain_config.supported @ ErrorCode::SupportedChainConfigNoSupported,
        constraint = (msg.amount as u128) <= supported_chain_config.mint_total @ ErrorCode::LackTargetMintOfChain,
    )]
    pub supported_chain_config: Box<Account<'info, SupportedChainConfig>>,

    #[account(
        seeds = [
            TOKEN_CONFIG.as_ref(),
            msg.to_chain_id.to_be_bytes().as_ref(),
            msg.to_token_id.to_be_bytes().as_ref(),
        ],
        bump,
        constraint = token_config.is_initialized @ ErrorCode::TokenConfigNotInitialized,
        constraint = !token_config.withdraw_paused @ ErrorCode::WithdrawPaused,
        constraint = msg.amount >= token_config.token_min_amount @ ErrorCode::InvalidMinAmount,
        constraint = (msg.amount as u128) <= token_config.mint_total @ ErrorCode::LackTargetMint,
    )]
    pub token_config: Box<Account<'info, TokenConfig>>,

    // #[account(
    //     mut,
    //     seeds = [
    //         SBTC_MINT.as_bytes(),
    //         &msg.chain_id.to_be_bytes()
    //     ],
    //     bump,
    // )]
    // pub sbtc_mint: Account<'info, Mint>,

    // /// the user's sBTC Token Account
    // #[account(associated_token::mint = sbtc_mint, associated_token::authority = user)]
    // pub user_sbtc_ata: Box<Account<'info, TokenAccount>>,

    // #[account(
    //     init_if_needed,
    //     payer = submitter,
    //     associated_token::mint = sbtc_mint,
    //     associated_token::authority = fee_recipient
    // )]
    // pub fee_recipient_sbtc_ata: Box<Account<'info, TokenAccount>>,

    // /// CHECK: only need .key()
    // #[account(
    //     mut,
    //     constraint = bridge_config.fee_recipient == fee_recipient.key() @ ErrorCode::InvalidFeeRecipient,
    // )]
    // pub fee_recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = Nonces::LEN,
        seeds = [NONCE_CONFIG.as_ref(), Operation::TokenTransfer.to_bytes().as_slice()],
        bump
    )]
    pub nonce: Box<Account<'info, Nonces>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

fn get_accounts<'info>(
    program_id: &Pubkey,
    remaining_accounts: &'info [AccountInfo<'info>], // 显式指定生命周期
    user: &Pubkey,
    fee_recipient: &Pubkey,
    chain_id: &u8
) -> Result<
    (
        &'info AccountInfo<'info>, // user_sbtc_ata
        &'info AccountInfo<'info>, // fee_recipient_account
        &'info AccountInfo<'info>, // fee_recipient_sbtc_ata
        &'info AccountInfo<'info>, // sbtc_mint_account
    )
> {
    let binding = chain_id.to_be_bytes();
    let seeds = &[SBTC_MINT.as_ref(), binding.as_ref()];
    let (sbtc_mint, _) = Pubkey::find_program_address(seeds, program_id);

    let user_ata = get_associated_token_address(user, &sbtc_mint);
    let fee_recipient_ata = get_associated_token_address(fee_recipient, &sbtc_mint);

    let mut user_sbtc_ata_account: Option<&'info AccountInfo<'info>> = None;
    let mut fee_recipient_account: Option<&'info AccountInfo<'info>> = None;
    let mut fee_recipient_sbtc_ata_account: Option<&'info AccountInfo<'info>> = None;
    let mut sbtc_mint_account: Option<&'info AccountInfo<'info>> = None;

    // 查找所有目标账户
    for account in remaining_accounts {
        if *account.key == user_ata {
            user_sbtc_ata_account = Some(account);
        } else if *account.key == *fee_recipient {
            fee_recipient_account = Some(account);
        } else if *account.key == fee_recipient_ata {
            fee_recipient_sbtc_ata_account = Some(account);
        } else if *account.key == sbtc_mint {
            sbtc_mint_account = Some(account);
        }

        if
            user_sbtc_ata_account.is_some() &&
            fee_recipient_account.is_some() &&
            fee_recipient_sbtc_ata_account.is_some() &&
            sbtc_mint_account.is_some()
        {
            break;
        }
    }

    let user_sbtc_ata_account = user_sbtc_ata_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::UserSbtcAtaNotFound)
    })?;
    let fee_recipient_account = fee_recipient_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::FeeRecipientNotFound)
    })?;
    let fee_recipient_sbtc_ata_account = fee_recipient_sbtc_ata_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::FeeRecipientSbtcAtaNotFound)
    })?;
    let sbtc_mint_account = sbtc_mint_account.ok_or_else(|| {
        anchor_lang::error::Error::from(ErrorCode::SbtcMintAccountNotFound)
    })?;

    Ok((
        user_sbtc_ata_account,
        fee_recipient_account,
        fee_recipient_sbtc_ata_account,
        sbtc_mint_account,
    ))
}
