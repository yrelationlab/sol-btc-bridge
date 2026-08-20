# sol-btc-bridge

[English](./README.md) · [构建与运维](./docs/development.md)

Solana 上的 **BTC 锚定代币（sBTC）** 程序，给 BTC 质押 / 流动性金库用。

这是 Echo 式锁仓铸造桥的**目标链铸销腿**：源链锁定 BTC（或 Bitcoin L2 的 uBTC）→ **验证人委员会**出证 → **提交人**在 Solana 上提交已验证消息并铸造 sBTC。赎回则在 Solana 销毁 sBTC、打事件，源链再解锁。

产品形态接近全链 BTC 流动性金库（如 [StakeStone](https://app.stakestone.io/u/vault) 的 STONEBTC）和生息 BTC（如 [Lombard](https://www.lombard.finance/) 的 LBTC）。本仓库是 **Solana 链上程序**，不是这些产品的前端。

| | |
|---|---|
| Program id | `Am2aeLabeQBtENUpMvEv8cWqnaiFzFBF1GtS8gHkhLLs` |
| 技术栈 | Rust · Anchor 0.29 · Solana 2.0 · SPL Token |
| 许可证 | Apache-2.0 |

## 做什么

```text
用户 ──uBTC──► Bitcoin L2 上的 Echo ──deposit event──► 验证人组
                                                      │
                                               validated events
                                                      ▼
用户 ◄──sBTC── Solana 上的 Echo   ◄──submit── 提交人组
     ──销毁──►                    ──withdraw event──► 验证人组
                                                      │
                                               validated events
                                                      ▼
用户 ◄──uBTC── Bitcoin L2 上的 Echo  ◄──submit── 提交人组
```

- **充值（源链 → Solana）：** 委员会 Ed25519 签名 + 提交人调用 `mint_sbtc_with_signatures` → 向用户 ATA 铸造 sBTC。消耗 nonce。按 (链, 代币) 做 24 小时滚动限额。
- **赎回（Solana → 源链）：** 用户调用 `withdraw_btc`，按配置扣费，销毁剩余 sBTC，发出 `WithdrawBtcEvent`。验证人 / 提交人在源链完成解锁。Solana 侧赎回**不再验委员会签名**，只自增并记录 nonce。
- **治理：** 管理员配置支持的链 / 代币；委员会成员与提交人白名单在链上；限额变更需要委员会权重。

这**不是**单独的 Solana 原生 BTC 质押合约。质押 / 金库收益叠在 sBTC 之上（或再包一层）。程序只保证：**委员会权重够才铸、销毁带手续费和可审计事件、桥有限额。**

## 链上模块

| 模块 | 职责 |
|---|---|
| `config` | 桥配置、支持链、代币费率 / 最小额 / 暂停赎回 |
| `committee` | 委员会（权重、黑名单）与提交人 |
| `echo_bridge` | `mint_sbtc_with_signatures`、`withdraw_btc` |
| `limiter` | 每链每币 24 小时环形缓冲 + 总上限；改限额走多签 |
| `utils` | Ed25519 指令校验（instructions sysvar）、消息编解码、nonce |

### 指令

| 指令 | 谁调用 | 说明 |
|---|---|---|
| `create_bridge_config` | 管理员 | 链、代币、收费地址、sBTC 元数据 |
| `add_or_update_chain` / `_chain_token` | 管理员 | 开链；费率（分母 `1e6`）；最小额；暂停赎回 |
| `create_bridge_committee` / `add_or_update_committee` | 管理员 | 成员公钥 + 权重 + 黑名单 |
| `add_or_update_submitter` | 管理员 | 谁可以提交已验证的铸造 |
| `mint_sbtc_with_signatures` | 提交人 + 委员会签名 | Ed25519 前置指令；nonce；限额 |
| `withdraw_btc` | 用户 | 手续费给 `fee_recipient`，销毁剩余，打事件 |
| `add_or_update_limiter_with_signatures` | 委员会签名 | 改 24 小时上限 |

### 签名 / 权重（代码）

链上验的是**加权 stake**，不是写死的「N 人中 M 人」。每个委员会账户有 `stake_amount`，累计须达到该消息类型的 `required_stake`（见 `programs/bridge/src/instructions/utils/msgs/common.rs`）：

| 操作 | 所需权重 |
|---|---|
| 代币转移（铸造路径） | `6666` |
| 改限额 / 多数治理类签名操作 | `5001` |
| 紧急冻结 | `450` |

当前委员会集合的运维约定：铸造约 **4 个签名**，改限额约 **5 个签名**。成员权重变了要重算。

重复签名拒绝。铸造消耗约定 nonce；赎回只自增并记入日志。

## 目录

```text
programs/bridge/src/     Anchor 程序
sdk/                     TypeScript 客户端
tests/                   Vitest / Anchor 测试
scripts/                 本地测试脚本
docs/development.md      yarn 命令、部署、本地验证器
```

同系列但不在本仓库：`bridge-evm-main`（Foundry）、`bridge-aptos-vault`（Move）。

## 快速开始

```bash
# 工具链见 Anchor.toml（anchor 0.29，solana 2.0.23）
yarn
yarn build
yarn test          # ./scripts/test-local.sh
```

不要提交 `sdk/.config/secret.json`、`.env.devnet`、`.env.mainnet`。

## 状态

研究 / 对接用程序。把 sBTC 当生产金库资产前，请确认主网升级权限、审计报告和委员会名单。
