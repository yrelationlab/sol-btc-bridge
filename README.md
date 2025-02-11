# sol-btc-bridge

## test in local validator
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