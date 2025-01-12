import { Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";

require('dotenv').config({ path: `.env.${process.env.E}` });

import secret from './.config/secret.json';
export const userWalletKey = Keypair.fromSecretKey(new Uint8Array(secret));
console.log(`userWallet publicKey is ${userWalletKey.publicKey}`);

import id from '../target/deploy/bridge-keypair.json';
export const programWalletKey = Keypair.fromSecretKey(new Uint8Array(id));
export const PROGRAM_ID = programWalletKey.publicKey;
console.log(`PROGRAM_ID is ${PROGRAM_ID}`);

//STEP 1 - Connect to Solana Network
export const endpoint = process.env.RPC_URL || "127.0.0.1:8899"; //Replace with your RPC Endpoint
console.log(`ENDPOINT is ${endpoint}`)
export const solanaConnection = new Connection(endpoint);

  