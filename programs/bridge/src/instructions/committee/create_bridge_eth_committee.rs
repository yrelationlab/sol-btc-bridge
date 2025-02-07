use anchor_lang::prelude::*;
use anchor_lang::solana_program::secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey};
use std::collections::HashSet;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod committee_anchor {
    use super::*;

    // 初始化桥接委员会
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let committee = &mut ctx.accounts.committee;
        committee.admin = admin;
        committee.voting_power = 0;
        committee.total_voting_power = 0;
        Ok(())
    }

    // 更新委员会成员
    pub fn update_committees(
        ctx: Context<UpdateCommittees>,
        new_members: Vec<CommitteeMember>,
        remove_pubkeys: Vec<[u8; 64]>,
        min_stake_required: u16,
    ) -> Result<()> {
        let committee = &mut ctx.accounts.committee;

        // 验证管理员签名
        require!(
            ctx.accounts.admin.key() == committee.admin,
            CommitteeError::Unauthorized
        );

        // 移除指定成员
        let mut removed_power = 0;
        for pubkey in remove_pubkeys {
            if let Some(pos) = committee
                .members
                .iter()
                .position(|m| m.bridge_pubkey_bytes == pubkey)
            {
                removed_power += committee.members[pos].voting_power;
                committee.members.remove(pos);
            }
        }
        committee.total_voting_power = committee.total_voting_power.saturating_sub(removed_power);

        // 添加新成员
        let mut existing_pubkeys: HashSet<[u8; 64]> = committee
            .members
            .iter()
            .map(|m| m.bridge_pubkey_bytes)
            .collect();

        let mut added_power = 0;
        for member in new_members {
            require!(
                !existing_pubkeys.contains(&member.bridge_pubkey_bytes),
                CommitteeError::DuplicateMember
            );

            existing_pubkeys.insert(member.bridge_pubkey_bytes);
            added_power += member.voting_power;
            committee.members.push(member);
        }
        committee.total_voting_power = committee.total_voting_power.saturating_add(added_power);

        // 更新最小投票权
        if min_stake_required > 0 {
            committee.voting_power = min_stake_required;
        }

        require!(
            committee.total_voting_power >= committee.voting_power,
            CommitteeError::InvalidVotingPower
        );

        Ok(())
    }

    // 验证签名集合
    pub fn verify_signatures(
        ctx: Context<VerifySignatures>,
        msg_hash: [u8; 32],
        signatures: Vec<[u8; 65]>,
    ) -> Result<()> {
        let committee = &ctx.accounts.committee;
        let mut approval_stake = 0;
        let mut seen_pubkeys = HashSet::new();

        for sig in signatures {
            let eth_sig = sig; // 65字节签名
            let mut rs = [0u8; 64];
            rs.copy_from_slice(&eth_sig[..64]);
            let recovery_id = eth_sig[64] - 27; // 转换以太坊v值到恢复ID

            let pubkey = match secp256k1_recover(&add_ethereum_prefix(&msg_hash), &sig, recovery_id)
            {
                Ok(pk) => pk,
                Err(_) => return Err(CommitteeError::InvalidSignature.into()),
            };

            let pubkey_bytes = pubkey.to_bytes();
            require!(
                !seen_pubkeys.contains(&pubkey_bytes),
                CommitteeError::DuplicatedSignature
            );

            let member = committee
                .members
                .iter()
                .find(|m| m.bridge_pubkey_bytes == pubkey_bytes)
                .ok_or(CommitteeError::InvalidSignature)?;

            require!(!member.blocklisted, CommitteeError::SignatureBlocked);

            approval_stake += member.voting_power as u64;
            seen_pubkeys.insert(pubkey_bytes);
        }

        require!(
            approval_stake >= committee.voting_power as u64,
            CommitteeError::InsufficientVotingPower
        );

        Ok(())
    }
}

// 账户结构定义
#[account]
#[derive(Default)]
pub struct BridgeCommittee {
    pub members: Vec<CommitteeMember>, // 委员会成员列表
    pub voting_power: u16,             // 最小所需投票权
    pub total_voting_power: u16,       // 总投票权
    pub admin: Pubkey,                 // 管理员公钥
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CommitteeMember {
    pub eth_address: [u8; 20],         // 以太坊地址
    pub bridge_pubkey_bytes: [u8; 64], // 公钥
    pub voting_power: u16,             // 投票权
    pub blocklisted: bool,             // 是否被屏蔽
}

// 指令上下文
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 1024)] // 初始空间分配
    pub committee: Account<'info, BridgeCommittee>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCommittees<'info> {
    #[account(mut)]
    pub committee: Account<'info, BridgeCommittee>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifySignatures<'info> {
    #[account()]
    pub committee: Account<'info, BridgeCommittee>,
}

// 错误类型
#[error_code]
pub enum CommitteeError {
    #[msg("Invalid committee count")]
    InvalidCommitteeCount,
    #[msg("Duplicated signature")]
    DuplicatedSignature,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Blocked signature")]
    SignatureBlocked,
    #[msg("Invalid voting power configuration")]
    InvalidVotingPower,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Duplicate member detected")]
    DuplicateMember,
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
}

// 以太坊签名前缀处理
fn add_ethereum_prefix(hash: &[u8; 32]) -> [u8; 32] {
    let prefix = b"\x19Ethereum Signed Message:\n32";
    let mut data = Vec::with_capacity(prefix.len() + 32);
    data.extend_from_slice(prefix);
    data.extend_from_slice(hash);
    let mut output = [0u8; 32];
    output.copy_from_slice(&anchor_lang::solana_program::keccak::hash(&data).to_bytes());
    output
}
