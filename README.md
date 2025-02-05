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