
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
import cm1 from '../cli/.config/cm1.json';
import cm2 from '../cli/.config/cm2.json';
import cm3 from '../cli/.config/cm3.json';
import { assert, expect } from "chai";
import { Bridge } from "../target/types/bridge";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Operation, TestValues, TestValuesDefaults } from "./types";
import { BRIDGE_COMMITTEE_CONFIG, BRIDGE_COMMITTEE_SUBMITTER_CONFIG, DECIMALS9, getCommitteePda, getSubmitterPda, getSupportChainPda, getTokenConfigPda, GLOBAL_CONFIG, NONCE_CONFIG, SUPPORTED_CHAINS_CONFIG, TOKEN_CONFIG } from "./constants";

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
function keypairsToPublicArrays(keypairs): PublicKey[] {
  if (!Array.isArray(keypairs)) {
    throw new Error("Input must be an array");
  }

  return keypairs.map(keypair => {
    if (!(keypair instanceof Keypair)) {
      throw new Error("Array elements must be Keypair instances");
    }
    return keypair.publicKey;
  });
}


export function createValues(defaults?: TestValuesDefaults): TestValues {
  const payerAdmin = Keypair.fromSecretKey(new Uint8Array(secret));
  const feeRecipient = Keypair.generate().publicKey;
  const supportedTokensKeypairs = [Keypair.generate(), Keypair.generate()];
  const supportedTokensIndex = Array.from({ length: supportedTokensKeypairs.length }, (_, i) => i);
  const decimals = [DECIMALS9, DECIMALS9]
  const prices = [new anchor.BN(9999).mul(decimals[0]), new anchor.BN(9999).mul(decimals[1])];
  const supportedChains = [2, 3, 4];
  const supportedChainsBuffer = Buffer.from(new Uint8Array(supportedChains));
  const tokenFeePercentages = [new anchor.BN(100), new anchor.BN(2000)];
  const tokenMinAmounts = [new anchor.BN(100).mul(decimals[0]), new anchor.BN(2000).mul(decimals[1])];
  const curChainId = new anchor.BN(1);
  const bridgeConfigPDA = PublicKey.findProgramAddressSync(
    [GLOBAL_CONFIG, curChainId.toBuffer()],
    anchor.workspace.bridge.programId
  )[0];
  const tokenConfigPdas = supportedTokensIndex.map((tokenId, index) =>
    getTokenConfigPda(tokenId)
  );
  console.log(`tokenConfigPdas is ${JSON.stringify(tokenConfigPdas)}`)
  const supportedChainsPdas = supportedChains.map((chainId) => {
    return getSupportChainPda(chainId);
  });
  const committeeKeypairs = [Keypair.fromSecretKey(new Uint8Array(cm1)), Keypair.fromSecretKey(new Uint8Array(cm2)), Keypair.fromSecretKey(new Uint8Array(cm3))];
  const committeePdas = committeeKeypairs.map((committeeAddress) => {
    return getCommitteePda(committeeAddress);
  });
  const stakes = [1000, 2000, 3000];
  const minStake = 1000;
  const submitter = committeeKeypairs[0];
  const submitterPda = getSubmitterPda(submitter);
  const noncePdaUpdateTokenPrice = PublicKey.findProgramAddressSync(
    [NONCE_CONFIG, Buffer.from(Operation.UpdateTokenPrice.toString())],
    anchor.workspace.bridge.programId
  )[0];

  return {
    chainId: curChainId,
    payerAdmin,
    feeRecipient,
    supportedTokensKeypairs,
    supportedTokensIndex,
    prices,
    supportedChainsBuffer,
    decimals,
    tokenFeePercentages,
    tokenMinAmounts,
    bridgeConfigPDA,
    tokenConfigPdas,
    supportedChainsPdas,
    committeeKeypairs,
    stakes,
    minStake,
    submitter,
    submitterPda,
    committeePdas,
    noncePdaUpdateTokenPrice,
    supportedChains
  };
}

export async function createCommitteeConfig(program: anchor.Program<Bridge>, values: TestValues) {
  return await program.methods
    .createBridgeCommittee(
      keypairsToPublicArrays(values.committeeKeypairs),
      values.stakes,
      values.minStake,
    )
    .accounts({ submitterPda: values.submitterPda, submitter: values.submitter.publicKey })
    .remainingAccounts([
      ...values.committeePdas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
    ])
    .rpc({ skipPreflight: false });
}

export async function createBridgeConfig(program: anchor.Program<Bridge>, values: TestValues) {
  return await program.methods
    .createBridgeConfig(
      values.chainId.toNumber(),
      values.feeRecipient,
      keypairsToPublicArrays(values.supportedTokensKeypairs),
      values.prices,
      values.supportedChainsBuffer,
      values.tokenFeePercentages,
      values.tokenMinAmounts
    )
    .accounts({ bridgeConfig: values.bridgeConfigPDA })
    .remainingAccounts([
      ...values.tokenConfigPdas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
      , ...values.supportedChainsPdas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))

    ])
    .rpc({ skipPreflight: false });
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
export { TestValues };


export function assembleUpdateTokenPricePayload(tokenId: number, tokenPrice: number): Uint8Array {
  // Ensure the tokenId is a single byte (u8)
  const tokenIdBytes = new Uint8Array(1);
  tokenIdBytes[0] = tokenId;

  // Convert tokenPrice (u64) to 8-byte big-endian format
  const tokenPriceBytes = new Uint8Array(8);
  let price = tokenPrice;
  for (let i = 7; i >= 0; i--) {
    tokenPriceBytes[i] = price & 0xff;  // Extract the least significant byte
    price >>= 8;  // Shift the price by 8 bits to the right
  }

  // Concatenate tokenIdBytes and tokenPriceBytes to form the final payload
  return new Uint8Array([...tokenIdBytes, ...tokenPriceBytes]);
}

