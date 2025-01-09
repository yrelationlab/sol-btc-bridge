
import * as anchor from "@coral-xyz/anchor";
import { NATIVE_MINT, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createSyncNativeInstruction, getAccount, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram, PublicKey, SYSVAR_RENT_PUBKEY, AddressLookupTableProgram, TransactionInstruction, TransactionMessage, VersionedTransaction, TransactionSignature, TransactionConfirmationStatus, SignatureStatus, AddressLookupTableAccount, Signer } from "@solana/web3.js";
import {
  Liquidity,
  Market as raydiumSerum,
  Spl,
  SPL_MINT_LAYOUT,
} from "@raydium-io/raydium-sdk";
import fs from "fs";
import path from "path";
import secret from '../cli/.config/secret.json';
import { assert, expect } from "chai";
import { Bridge } from "../target/types/bridge";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BN } from "@coral-xyz/anchor";
export interface TestValues {
  payerAdmin: Keypair;
  total_supply: anchor.BN;
}

export async function sleep(seconds: number) {
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
export const generateSeededKeypair = (seed: string) => {
  return Keypair.fromSeed(
    anchor.utils.bytes.utf8.encode(anchor.utils.sha256.hash(seed)).slice(0, 32)
  );
};
export const expectRevert = async (promise: Promise<any>) => {
  try {
    await promise;
    assert.fail(
      'Should not go to here, no exception throw.'
    );
  } catch (e) {
    console.log(`error : ${JSON.stringify(e)}`)
    return;
  }
};


type TestValuesDefaults = {
  [K in keyof TestValues]+?: TestValues[K];
};
export function createValues(defaults?: TestValuesDefaults): TestValues {
  const payerAdmin = Keypair.fromSecretKey(new Uint8Array(secret));

  return {
    
    total_supply: new anchor.BN(1_000_000_000).mul(new anchor.BN(10 ** 9)),
    payerAdmin,
    
  };
}
export async function createBridgeConfig(program: anchor.Program<Bridge>, values: TestValues) {
  return await program.methods
    .creat(
    )
    .accounts({ memooConfig: values.memooConfigPda })
    .rpc();
}
export async function createLookupTable(authority: PublicKey, payer: Keypair, connection: Connection) {
  // Step 1 - Get a lookup table address and create lookup table instruction
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: authority,
      payer: payer.publicKey,
      recentSlot: await connection.getSlot(),
    });
  // Step 2 - Log Lookup Table Address
  console.log("Lookup Table Address:", lookupTableAddress.toBase58());
  // Step 3 - Generate a transaction and send it to the network
  createAndSendV0Tx([lookupTableInst], payer, connection);
  return lookupTableAddress;
}
export async function createAndSendV0Tx(txInstructions: TransactionInstruction[], payer: Keypair, connection: Connection, lookupTable?: AddressLookupTableAccount[], skipPreflight: boolean = false) {
  // Step 1 - Fetch Latest Blockhash
  let latestBlockhash = await connection.getLatestBlockhash('finalized');
  console.log("   ✅ - Fetched latest blockhash. Last valid height:", latestBlockhash.lastValidBlockHeight);
  // Step 2 - Generate Transaction Message
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions
  }).compileToV0Message(lookupTable);
  console.log("   ✅ - Compiled transaction message");
  const transaction = new VersionedTransaction(messageV0);
  // Step 3 - Sign your transaction with the required `Signers`
  transaction.sign([payer]);
  console.log("   ✅ - Transaction Signed");
  // Step 4 - Send our v0 transaction to the cluster
  const txid = await connection.sendTransaction(transaction, { skipPreflight: skipPreflight, maxRetries: 5 });
  console.log(`   ✅ - Transaction ${txid} sent to network`);
  // Step 5 - Confirm Transaction 
  const confirmation = await confirmTransaction(connection, txid);
  if (confirmation.err) {
    console.log("   ❌ - Transaction not confirmed.")
    throw confirmation.err
  }
  console.log('🎉 Transaction succesfully confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
}
export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = 'confirmed',
  timeout: number = 300000,
  pollInterval: number = 1000,
  searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory });
    if (!statuses || statuses.length === 0) {
      throw new Error('Failed to get signature status');
    }
    const status = statuses[0];
    if (status === null) {
      // If status is null, the transaction is not yet known
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      continue;
    }
    if (status.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }
    if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
      return status;
    }
    if (status.confirmationStatus === 'finalized') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}
export function compareAddresses(address1: string, address2: string): number {
  // 将Base58地址转换为Uint8Array
  const bytes1: Uint8Array = bs58.decode(address1);
  const bytes2: Uint8Array = bs58.decode(address2);
  // 比较两个Uint8Array
  if (bytes1.length !== bytes2.length) {
    return bytes1.length - bytes2.length;
  }
  for (let i = 0; i < bytes1.length; i++) {
    if (bytes1[i] !== bytes2[i]) {
      return bytes1[i] - bytes2[i];
    }
  }
  return 0; // 如果完全相等，返回0
}
export async function checkAssociatedTokenAccount(connection, mintAddress, ownerAddress) {
  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(mintAddress, ownerAddress, true);
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    console.log(`checkAssociatedTokenAccount : ownerAddress:${ownerAddress}, mintAddress:${mintAddress}, associatedTokenAddress:${associatedTokenAddress}, accountInfo:${accountInfo}`)
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking associated token account:', error);
    return false;
  }
}
