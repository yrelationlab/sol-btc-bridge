# sol-btc-bridge

[中文说明](./README.zh-CN.md) · [Build & ops](./docs/development.md)

Solana program for a **BTC-backed token (sBTC)** used by BTC staking / liquid-BTC vaults.

It is the destination-chain mint/burn leg of an Echo-style lock-and-mint bridge: BTC (or Bitcoin L2 uBTC) is locked on the source chain; a **validator committee** attests; a **submitter** posts the attested message on Solana and mints sBTC. Withdrawal burns sBTC on Solana and emits an event so the source chain can unlock.

Same product class as omnichain BTC liquidity vaults (e.g. [StakeStone](https://app.stakestone.io/u/vault) STONEBTC) and yield-bearing BTC (e.g. [Lombard](https://www.lombard.finance/) LBTC). This repository is the **Solana on-chain program**, not those products' frontend.

| | |
|---|---|
| Program id | `Am2aeLabeQBtENUpMvEv8cWqnaiFzFBF1GtS8gHkhLLs` |
| Stack | Rust · Anchor 0.29 · Solana 2.0 · SPL Token |
| License | Apache-2.0 |

## What it does

```text
User ──uBTC──► Echo on Bitcoin L2 ──deposit event──► Validator group
                                                          │
                                                   validated events
                                                          ▼
User ◄──sBTC── Echo on Solana   ◄──submit── Submitter group
     ──burn──►                  ──withdraw event──► Validator group
                                                          │
                                                   validated events
                                                          ▼
User ◄──uBTC── Echo on Bitcoin L2  ◄──submit── Submitter group
```

- **Deposit (source → Solana):** committee Ed25519 signatures + submitter call `mint_sbtc_with_signatures` → mint sBTC to the user ATA. Nonce is consumed. A 24-hour rolling limiter caps inflow per (chain, token).
- **Withdraw (Solana → source):** user calls `withdraw_btc`, pays a configured fee, burns sBTC, program emits `WithdrawBtcEvent`. Validators / submitters complete unlock on the source chain. Withdraw does **not** re-check committee signatures on Solana; it increments nonce and logs it.
- **Governance:** admin configures supported chains / tokens; committee membership and submitter allowlist are on-chain; limiter updates require committee stake.

This is **not** a Solana-native BTC staking contract by itself. Staking / vault yield sits above sBTC (or wraps it). The program’s job is: **mint only with enough committee stake, burn with a fee and an auditable event, rate-limit the bridge.**

## On-chain modules

| Module | Role |
|---|---|
| `config` | Bridge config, supported chains, token fee / min amount / withdraw pause |
| `committee` | Committee members (stake weight, blocklist) and submitters |
| `echo_bridge` | `mint_sbtc_with_signatures`, `withdraw_btc` |
| `limiter` | 24-hour ring buffer + total cap per chain/token; updates are multi-sig |
| `utils` | Ed25519 ix verification (instructions sysvar), message codecs, nonce |

### Instructions

| Instruction | Who | Notes |
|---|---|---|
| `create_bridge_config` | admin | Chains, tokens, fee recipient, sBTC metadata |
| `add_or_update_chain` / `_chain_token` | admin | Enable chain; fee bps (`FEE_DENOMINATOR = 1e6`); min amount; pause withdraw |
| `create_bridge_committee` / `add_or_update_committee` | admin | Member pubkey + stake weight + blocklist |
| `add_or_update_submitter` | admin | Who may submit attested mints |
| `mint_sbtc_with_signatures` | submitter + committee sigs | Ed25519 pre-instructions; nonce; limiter |
| `withdraw_btc` | user | Fee to `fee_recipient`, burn remainder, emit event |
| `add_or_update_limiter_with_signatures` | committee sigs | Change 24h cap |

### Signature / stake (code)

Verification is **weighted stake**, not a hardcoded “N of M” in Rust. Each committee account has `stake_amount`. Approvals must reach `required_stake` for the message type (`programs/bridge/src/instructions/utils/msgs/common.rs`):

| Operation | Required stake |
|---|---|
| Token transfer (mint path) | `6666` |
| Update limiter / most admin-via-sig ops | `5001` |
| Emergency freeze | `450` |

Operational default for the current committee set (from the previous notes): **mint ≈ 4 signatures**, **update limiter ≈ 5 signatures**. Recalculate if member weights change.

Duplicate signers are rejected. Mint consumes the expected nonce; withdraw only increments nonce and logs it.

## Layout

```text
programs/bridge/src/     Anchor program
sdk/                     TypeScript client
tests/                   Vitest / Anchor tests
scripts/                 local test helpers
docs/development.md      yarn scripts, deploy, local validator
```

Sibling repos (not in this tree): `bridge-evm-main` (Foundry), `bridge-aptos-vault` (Move) — same Echo family on other chains.

## Quick start

```bash
# toolchain: see Anchor.toml (anchor 0.29, solana 2.0.23)
yarn
yarn build
yarn test          # ./scripts/test-local.sh
```

Do not commit `sdk/.config/secret.json`, `.env.devnet`, or `.env.mainnet`.

## Status

Research / integration program. Confirm mainnet upgrade authority, audit reports, and committee set before treating sBTC as a production vault asset.
