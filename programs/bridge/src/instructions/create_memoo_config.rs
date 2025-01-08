use anchor_lang::prelude::*;
use solana_program::pubkey;

use crate::{constants::GLOBAL_MEMOO_CONFIG, errors::MemooError, state::GlobalMemooConfig};

// Hardcoded pubkey for create memoo config
const HARDCODED_PUBKEY: Pubkey = pubkey!("memooDJQoXEddHVdf5KwWrGMeGuvv93mW8PoTG2dmPC");

pub fn create_memoo_config(
    ctx: Context<CreateMemooConfig>,
    id: Pubkey,
    platform: Pubkey,
    platform_fee_recipient: Pubkey,
    platform_fee_rate_ido: u16,
    platform_fee_rate_denominator_ido: u16,
    ido_creator_buy_limit: u16,
    token_allocation_creator: u16,
    token_allocation_ido: u16,
    token_allocation_lp: u16,
    token_allocation_airdrop: u16,
    token_allocation_platform: u16,
    ido_user_buy_limit: u16,
    ido_price: u64,
    airdrop_price: u64,
    total_supply: u128,
    platform_fee_create_meme_sol: u64,
    share_create_fee_number:u64
) -> Result<()> {
    let memoo_config = &mut ctx.accounts.memoo_config;
    memoo_config.admin = ctx.accounts.payer.key();
    memoo_config.platform = platform;
    memoo_config.platform_fee_recipient = platform_fee_recipient;
    memoo_config.id = id;
    memoo_config.platform_fee_rate_ido = platform_fee_rate_ido;
    memoo_config.platform_fee_rate_denominator_ido = platform_fee_rate_denominator_ido;
    memoo_config.platform_fee_create_meme_sol = platform_fee_create_meme_sol;
    memoo_config.ido_creator_buy_limit = ido_creator_buy_limit;
    memoo_config.token_allocation_creator = token_allocation_creator;
    memoo_config.token_allocation_ido = token_allocation_ido;
    memoo_config.token_allocation_lp = token_allocation_lp;
    memoo_config.token_allocation_airdrop = token_allocation_airdrop;
    memoo_config.token_allocation_platform = token_allocation_platform;
    memoo_config.ido_price = ido_price;
    memoo_config.total_supply = total_supply;
    memoo_config.ido_user_buy_limit = ido_user_buy_limit;
    memoo_config.airdrop_price = airdrop_price;
    memoo_config.share_create_fee_number = share_create_fee_number;
    Ok(())
}

pub fn update_memoo_config(
    ctx: Context<UpdateMemooConfig>,
    id: Pubkey,
    admin: Pubkey,
    platform: Pubkey,
    platform_fee_recipient: Pubkey,
    platform_fee_rate_ido: u16,
    platform_fee_rate_denominator_ido: u16,
    ido_creator_buy_limit: u16,
    token_allocation_creator: u16,
    token_allocation_ido: u16,
    token_allocation_lp: u16,
    token_allocation_airdrop: u16,
    token_allocation_platform: u16,
    ido_user_buy_limit: u16,
    ido_price: u64,
    airdrop_price: u64,
    total_supply: u128,
    platform_fee_create_meme_sol: u64,
    share_create_fee_number:u64
) -> Result<()> {
    let memoo_config = &mut ctx.accounts.memoo_config;
    memoo_config.id = id;
    memoo_config.admin = admin;
    memoo_config.platform = platform;
    memoo_config.platform_fee_recipient = platform_fee_recipient;
    memoo_config.platform_fee_rate_ido = platform_fee_rate_ido;
    memoo_config.platform_fee_rate_denominator_ido = platform_fee_rate_denominator_ido;
    memoo_config.platform_fee_create_meme_sol = platform_fee_create_meme_sol;
    memoo_config.ido_creator_buy_limit = ido_creator_buy_limit;
    memoo_config.token_allocation_creator = token_allocation_creator;
    memoo_config.token_allocation_ido = token_allocation_ido;
    memoo_config.token_allocation_lp = token_allocation_lp;
    memoo_config.token_allocation_airdrop = token_allocation_airdrop;
    memoo_config.token_allocation_platform = token_allocation_platform;
    memoo_config.ido_price = ido_price;
    memoo_config.total_supply = total_supply;
    memoo_config.ido_user_buy_limit = ido_user_buy_limit;
    memoo_config.airdrop_price = airdrop_price;
    memoo_config.share_create_fee_number = share_create_fee_number;
    Ok(())
}


pub fn close_memoo_config(
    ctx: Context<CloseMemooConfig>,
) -> Result<()> {
    let memoo_config = &mut ctx.accounts.memoo_config;
    let admin = &mut ctx.accounts.admin;

    // Transfer lamports from the PDA to the receiver
    **admin.to_account_info().lamports.borrow_mut() += **memoo_config.to_account_info().lamports.borrow();
    **memoo_config.to_account_info().lamports.borrow_mut() = 0;
    Ok(())
}

#[derive(Accounts)]
#[instruction(id: Pubkey)]
pub struct CreateMemooConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = GlobalMemooConfig::LEN,
        seeds = [
            GLOBAL_MEMOO_CONFIG.as_ref(),
            id.as_ref()
        ],
        bump
    )]
    pub memoo_config: Account<'info, GlobalMemooConfig>,

    /// The account paying for all rents
    #[account(
        mut,
        address = HARDCODED_PUBKEY @ MemooError::AdminMismatch
    )]
    pub payer: Signer<'info>,

    /// Solana ecosystem accounts
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMemooConfig<'info> {
    #[account(
        mut,
        has_one = admin @ MemooError::AdminMismatch,
    )]
    pub memoo_config: Account<'info, GlobalMemooConfig>,

    /// The admin of the MemooConfig
    /// CHECK: Read only, delegatable creation
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Solana ecosystem accounts
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct CloseMemooConfig<'info> {
    #[account(
        mut,
        has_one = admin @ MemooError::AdminMismatch,
    )]
    pub memoo_config: Account<'info, GlobalMemooConfig>,

    /// The admin of the MemooConfig
    /// CHECK: Read only, delegatable creation
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Solana ecosystem accounts
    pub system_program: Program<'info, System>,
}
