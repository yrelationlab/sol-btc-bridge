use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar_module;
use anchor_lang::prelude::*;

use crate::constants::{ COMMITTEE_SUBMITTER_CONFIG, GLOBAL_CONFIG, SBTC_MINT };
use crate::errors::ErrorCode;
use crate::{ MintSbtcMessage, Submitter };

use anchor_spl::token::Mint;

use crate::BridgeConfig;
pub fn mint_sbtc_with_signatures(
    ctx: Context<MintSbtcWithSignatures>,
    msg: MintSbtcMessage,
    number_of_signatures: u8,
    _chain_id: u8
) -> Result<()> {
    let bridge_config = &ctx.accounts.bridge_config;
    // let nonce_config = &mut ctx.accounts.nonce;

    // 1) check signatures
    require!(number_of_signatures >= 1, ErrorCode::InsufficientSignatures);

    // let mut bitmap: u128 = 0;
    // let mut approval_stake: u16 = 0;

    // for i in 0..number_of_signatures {
    //     let (signer_pubkey, data) =
    //         resolve_secp256k1_with_index(&ctx.accounts.instructions_sysvar, i as usize)?;

    //     // verify the message_of_signer == msg
    //     // verify Operation::MintSbtc
    //     // get Committee stake
    //     let (_, committee_acct) = get_commitee_account(
    //         &ctx.program_id,
    //         ctx.remaining_accounts.to_vec(),
    //         &signer_pubkey,
    //     )?;
    //     let acct_data = committee_acct.try_borrow_data()?;
    //     let comm = Committee::try_from_slice(&acct_data[crate::constants::ANCHOR_HEADER_LEN..])?;

    //     let mask = 1u128 << comm.index;
    //     require!((bitmap & mask) == 0, ErrorCode::DuplicateSignature);
    //     bitmap |= mask;
    //     approval_stake += comm.stake_amount;
    // }
    // require!(approval_stake >= MINT_SBTC_STAKE_REQUIRED, ErrorCode::InsufficientStake);

    // nonce_config.nonce += 1;

    // 2) parse msg.payload => (amount, user, ...)
    let amount = msg.amount;

    msg!(
        "msg data:: amount={}  source_chain_id={} nounce={} ",
        msg.amount,
        msg.source_chain_id,
        msg.nonce
    );
    // 3) anchor_spl::token::mint_to
    // authority = "BRIDGE_SBTC_AUTH", so we must do .with_signer
    // seeds = [ "bridge", &msg.chain_id.to_be_bytes(), bump ]

    let bump = ctx.bumps.sbtc_mint;

    let seeds = [SBTC_MINT.as_bytes(), &_chain_id.to_be_bytes(), &[bump]];

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

    // 4) done
    msg!(
        "Minted sBTC: amount={} to user={} with chain_id={}",
        amount,
        ctx.accounts.user.key(),
        bridge_config.chain_id
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(msg: MintSbtcMessage, number_of_signatures: u8,_chain_id: u8)]
pub struct MintSbtcWithSignatures<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

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
            &_chain_id.to_be_bytes()
        ],
        bump,
        constraint = bridge_config.is_initialized @ ErrorCode::BridgeConfigNotInitialized
    )]
    pub bridge_config: Box<Account<'info, BridgeConfig>>,

    // /// 2. The same PDA used as Mint authority
    // #[account(
    //     seeds = [
    //         BRIDGE_SBTC_AUTH.as_bytes(),
    //         &_chain_id.to_be_bytes()
    //     ],
    //     bump
    // )]
    // /// CHECK: Just a PDA for authority
    // pub bridge_sbtc_auth: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
                    SBTC_MINT.as_bytes(),
                    &_chain_id.to_be_bytes()
                ],
                bump,
    )]
    pub sbtc_mint: Account<'info, Mint>,

    /// the user's sBTC Token Account
    #[account(
        mut,
        constraint = user_sbtc_ata.owner == user.key(),
        constraint = user_sbtc_ata.mint == bridge_config.sbtc_mint
    )]
    pub user_sbtc_ata: Account<'info, anchor_spl::token::TokenAccount>,

    /// the user to receive minted sBTC
    /// CHECK: only need .key()
    pub user: UncheckedAccount<'info>,

    // #[account(
    //     init_if_needed,
    //     payer = payer,
    //     space = Nonces::LEN,
    //     seeds = [
    //         NONCE_CONFIG.as_ref(),
    //         Operation::MintSBTC.to_bytes().as_slice(),
    //     ],
    //     bump
    // )]
    // pub nonce: Box<Account<'info, Nonces>>,

    /// CHECK: This is not dangerous because we explicitly check the id
    #[account(address = instructions_sysvar_module::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}
