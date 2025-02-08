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

# 工作汇报 20250206
1. 数据结构设计，模块及设计
2. config的保存，committee的保存
3. 完成多方签名机制，验证有lookup table的情况下支持5个签名，没有的情况下支持4个左右。
4. stake的验证
5. mint sbtc

# 准备开展的工作 
1. typescript sdk
2. burn token
3. bridge流程打通
4. vault开发
