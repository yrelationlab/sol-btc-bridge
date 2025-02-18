# sol-btc-bridge

## 命令解释

以下是对给定命令的解释，并以Markdown格式呈现：

### 代码风格和检查

*   `"lint:fix": "prettier */*.js \"*/**/*{.js,.ts}\" -w"`：使用 Prettier 格式化所有 `.js` 和 `.ts` 文件。`-w` 选项表示直接写入文件。
*   `"lint": "prettier */*.js \"*/**/*{.js,.ts}\" --check"`：使用 Prettier 检查所有 `.js` 和 `.ts` 文件的格式是否符合规范，但不进行修改。

### 构建和测试

*   `"build": "anchor build -- --tools-version v1.41 -- -Znext-lockfile-bump"`：使用 Anchor 构建 Solana 程序。`--tools-version v1.41` 指定 Anchor 工具版本，`-Znext-lockfile-bump` 用于更新 lockfile。
*   `"test-in-remote-node": "anchor run test"`：在远程节点上运行 Anchor 测试。
*   `"test-in-local": "anchor test -- --tools-version v1.41 -- -Znext-lockfile-bump"`：在本地运行 Anchor 测试。`--tools-version` 和 `-Znext-lockfile-bump` 同上。
*   `"test-in-local-validator": "anchor test --skip-local-validator -- --tools-version v1.41 -- -Znext-lockfile-bump"`：在本地运行 Anchor 测试，但跳过本地验证器。其他选项同上。
*   `"test": "./scripts/test-local.sh"`：运行本地测试脚本。

### Solana 配置和账户

*   `"network": "solana config get"`：获取当前 Solana 配置信息。
*   `"url:local": "solana config set --url localhost"`：设置 Solana RPC URL 为本地节点。
*   `"url:dev": "env-cmd -f .env.devnet -x solana config set --url \\$RPC_URL"`：从 `.env.devnet` 文件加载环境变量，并设置 Solana RPC URL 为 `$RPC_URL`。
*   `"url:test": "solana config set --url https://api.testnet.solana.com"`：设置 Solana RPC URL 为测试网。
*   `"url:main": "env-cmd -f .env.mainnet -x solana config set --url \\$RPC_URL"`：从 `.env.mainnet` 文件加载环境变量，并设置 Solana RPC URL 为 `$RPC_URL`。
*   `"addr": "solana address -k ./sdk/.config/secret.json"`：显示指定密钥文件中的 Solana 地址。
*   `"balance": "solana balance -k ./sdk/.config/secret.json"`：查询指定密钥文件中的 Solana 账户余额。
*   `"airdrop": "solana airdrop 1000 -k ./sdk/.config/secret.json"`：向指定密钥文件中的 Solana 账户空投 1000 SOL。

### 本地验证器和部署

*   `"node:local": "solana-test-validator --reset"`：启动本地 Solana 验证器，并重置状态。
*   `"deploy:local": "solana program deploy target/deploy/bridge.so -k ./sdk/.config/secret.json -u http://localhost:8899"`：将 `bridge.so` 程序部署到本地验证器。
*   `"deploy:dev": "env-cmd -f .env.devnet -x anchor deploy --provider.cluster  \\$RPC_URL"`：从 `.env.devnet` 文件加载环境变量，并使用 Anchor 部署程序到开发网。
*   `"deploy:main": "env-cmd -f .env.mainnet -x anchor deploy --provider.cluster  \\$RPC_URL"`：从 `.env.mainnet` 文件加载环境变量，并使用 Anchor 部署程序到主网。
*   `"deploy:upgrade": "env-cmd -f .env.mainnet -x anchor upgrade --program-id 9q7cek9TaaRvExbAfKdAgUTzu92RvNTzCxVutXV1nDRC --provider.cluster \\$RPC_URL target/deploy/memoo.so"`：从 `.env.mainnet` 文件加载环境变量，并使用 Anchor 升级指定程序。
*   `"deploy:test": "anchor deploy --provider.cluster testnet"`：使用 Anchor 部署程序到测试网。

### 其他

*   `"build:program-rust": "cargo build-bpf --manifest-path=./src/program-rust/Cargo.toml --bpf-out-dir=dist/program"`：使用 Cargo 构建 BPF 程序。
*   `"pgid": "solana address -k target/deploy/bridge-keypair.json"`：显示指定密钥文件中的程序 ID。
*   `"clean": "cargo clean"`：清理 Cargo 构建的产物。
*   `"log": "solana logs"`：查看 Solana 日志。
*   `"kn": "kill -9 $(lsof -ti:8899) && kill -9 $(lsof -ti:9900)"`：杀死占用 8899 和 9900 端口的进程。


## 注意：
1. 提供了两种批量操作的方法，一种只能用来创建不能用来修改，比如create_bridge_config
2. 另一种是单个修改的方法，但是Solana可以把交易打包一起发送，参考这个测试 add Committee batch with add_or_update_committee

## test in local validator
1. yarn test


## deploy failed
1. solana-keygen recover -o ~/deploy-keys/recover-deploy-key --force
2. solana program deploy -k ./sdk/.config/secret.json --buffer ~/deploy-keys/recover-deploy-key target/deploy/bridge.so


## 代码目录结构解释

这段代码展示了一个基于 Rust 和 Solana 的项目的目录结构。它主要包含以下几个部分：

**1. 配置文件**

*   `Cargo.toml`: Rust 项目的配置文件，用于管理依赖、构建设置等。
*   `Xargo.toml`: Xargo 的配置文件，用于在没有标准库的环境中构建 Rust 代码，例如 Solana 程序。

**2. 源代码**

*   `src/`: 源代码目录。
    *   `constants.rs`: 定义常量。
    *   `errors.rs`: 定义错误类型。
    *   `instructions/`: 定义 Solana 程序可以执行的指令。
        *   `committee/`: 与委员会相关的指令。
            *   `add_or_update_committee.rs`: 添加或更新委员会成员。
            *   `add_or_update_submitter.rs`: 添加或更新提交者。
            *   `create_bridge_committee.rs`: 创建桥委员会。
            *   `mod.rs`: 声明 `committee` 模块。
            *   `state.rs`: 定义与委员会相关的状态。
        *   `config/`: 与配置相关的指令。
            *   `add_or_update_chain.rs`: 添加或更新链。
            *   `add_or_update_chain_token.rs`: 添加或更新链代币。
            *   `create_bridge_config.rs`: 创建桥配置。
            *   `mod.rs`: 声明 `config` 模块。
            *   `state.rs`: 定义与配置相关的状态。
        *   `echo_bridge/`: 与桥接相关的指令。
            *   `mint_sbtc_with_signatures.rs`: 使用签名铸造 sBTC。
            *   `mod.rs`: 声明 `echo_bridge` 模块。
            *   `withdraw_btc.rs`: 提取 BTC。
        *   `limiter/`: 与限制器相关的指令。
            *   `add_or_update_limiter_with_signatures.rs`: 使用签名添加或更新限制器。
            *   `mod.rs`: 声明 `limiter` 模块。
            *   `state.rs`: 定义与限制器相关的状态。
        *   `mod.rs`: 声明 `instructions` 模块。
        *   `utils/`: 实用工具模块。
            *   `ed25519.rs`: Ed25519 签名相关的工具函数。
            *   `mod.rs`: 声明 `utils` 模块。
            *   `msgs/`: 定义消息结构体。
                *   `common.rs`: 定义通用的消息结构体。
                *   `mint_sbtc_msg.rs`: 定义铸造 sBTC 的消息结构体。
                *   `mod.rs`: 声明 `msgs` 模块。
                *   `traits.rs`: 定义消息 trait。
                *   `update_limiter_msg.rs`: 定义更新限制器消息结构体
                *   `withdraw_btc_msg.rs`: 定义提取 BTC 的消息结构体。
            *   `utils.rs`: 其他实用工具函数。
        *   `vault/`: 与金库相关的指令。
    *   `lib.rs`: 库的入口文件，声明模块和导出公共函数。

