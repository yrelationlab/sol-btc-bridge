import { Keypair } from "@solana/web3.js";
import secret from './.config/creator-1.json';
import Base58 from 'bs58';

const key = Keypair.fromSecretKey(new Uint8Array(secret));
console.log(`publicKey: ${key.publicKey}`)
const secretKeyBase58 = Base58.encode(key.secretKey);
console.log(`secretKey (Base58): ${secretKeyBase58}`);