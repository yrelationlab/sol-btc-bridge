# sol-btc-bridge

## 注意：
1. 提供了两种批量操作的方法，一种只能用来创建不能用来修改，比如create_bridge_config
2. 另一种是单个修改的方法，但是Solana可以把交易打包一起发送，参考这个测试 add Committee batch with add_or_update_committee

## test in local validator
0. https://solana.com/docs/toolkit/local-validator
1. yarn node:local
2. yarn airdrop, solana airdrop 100 -k ./cli/.config/cm1.json
3. yarn test-in-local-validator 
4. solana address-lookup-table create  -k ./cli/.config/cm1.json
5. copy Lookup Table Address to code, for example 583AuKCdQa79vsiGyAFwhpb5YGSkaFzBPHLh5tFCP9Di
6. yarn test-in-local-validator


## deploy failed
1. solana-keygen recover -o ~/deploy-keys/recover-deploy-key --force
2. solana program deploy -k ./cli/.config/secret.json --buffer ~/deploy-keys/recover-deploy-key target/deploy/bridge.so

# 工作汇报 
## 工作汇报 20250206
1. 数据结构设计，模块及设计
2. config的保存，committee的保存
3. 完成多方签名机制，验证有lookup table的情况下支持5个签名，没有的情况下支持4个左右。
4. stake的验证
5. mint sbtc

## 准备开展的工作 
1. typescript sdk
2. burn token
3. bridge流程打通
4. vault开发


## 工作汇报 20250211
1. nonce 机制
2. 重构代码，抽象出验证函数，方便其他地方复用
3. withdrew btc，burn btc
4. 本地节点启动关闭脚本，方便测试数据比较多得函数，用lookup table
5. 修改一些bug，比如eth等第三方地址用变长数组
6. 重构代码，btc权限地址和mint地址合并为一个，减少参数
7. event抛出和解析
8. vault，limiter代码阅读

## 准备开展的工作 
1. vault
2. limiter
3. sdk


## 工作汇报 20250218
1.limter
2.增加了单个修改配置的方法（bridge config，committee，submitter）
3.增加了把单个修改配置串起来批量修改的测试

## 准备开展的工作 
1. vault
2. limiter
3. sdk