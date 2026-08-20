# Development / 构建与运维

[English README](../README.md) · [中文说明](../README.zh-CN.md)

Operational notes moved out of the root README. Commands come from `package.json`.

根目录旧 README 的运维说明集中在这里。命令以 `package.json` 为准。

## Toolchain

- Anchor `0.29.0` · Solana `2.0.23` (`Anchor.toml`)
- `yarn` for TS tests and deploy wrappers

## Scripts

| Script | Purpose |
|---|---|
| `yarn lint` / `yarn lint:fix` | Prettier check / write |
| `yarn build` | `anchor build -- --tools-version v1.41 -- -Znext-lockfile-bump` |
| `yarn test` | `./scripts/test-local.sh` |
| `yarn test-in-local` | `anchor test` with same rustc flags |
| `yarn test-in-local-validator` | `anchor test --skip-local-validator` |
| `yarn test-in-remote-node` | `anchor run test` |
| `yarn node:local` | local validator (see `package.json` for clone flags) |
| `yarn deploy:local` / `deploy:dev` / `deploy:main` | deploy; uses env files, not committed keys |
| `yarn network` / `url:local` / `url:dev` / `url:test` / `url:main` | `solana config` |
| `yarn addr` / `balance` / `airdrop` | wallet under `sdk/.config/secret.json` (gitignored) |
| `yarn pgid` | program id from `target/deploy/bridge-keypair.json` |
| `yarn log` | `solana logs` |
| `yarn kn` | kill processes on 8899 / 9900 |

## Signature counts (ops, not hardcoded)

For the current committee weights:

1. `add_or_update_limiter_with_signatures`: **5** signatures  
2. `mint_sbtc_with_signatures`: **4** signatures  

On-chain gate is **stake sum**, see `required_stake` in `msgs/common.rs`.

## Config / batch notes

- Some helpers are create-only (e.g. `create_bridge_config`). Updates go through `add_or_update_*`.
- Solana can pack several `add_or_update_committee` calls in one transaction (see tests: add committee batch).

## Local test

```bash
yarn test
```

## Deploy recovery (if buffer deploy failed)

```bash
solana-keygen recover -o ~/deploy-keys/recover-deploy-key --force
solana program deploy -k ./sdk/.config/secret.json \
  --buffer ~/deploy-keys/recover-deploy-key \
  target/deploy/bridge.so
```

## Secrets

Gitignore already covers `.env.devnet`, `.env.mainnet`, `sdk/.config/**`, `*.key`. Never commit RPC tokens or upgrade keypairs. `package.json` `deploy:upgrade` still points at an old `memoo.so` program id — do not use that path for this bridge without fixing the artifact and program id.
