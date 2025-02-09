import * as anchor from "@coral-xyz/anchor";
import {
  NATIVE_MINT,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createSyncNativeInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  AddressLookupTableProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  TransactionSignature,
  TransactionConfirmationStatus,
  SignatureStatus,
  AddressLookupTableAccount,
  Signer,
} from "@solana/web3.js";
import {
  Liquidity,
  Market as raydiumSerum,
  Spl,
  SPL_MINT_LAYOUT,
} from "@raydium-io/raydium-sdk";
import fs from "fs";
import path from "path";
import secret from "../cli/.config/secret.json";
import cm1 from "../cli/.config/cm1.json";
import cm2 from "../cli/.config/cm2.json";
import cm3 from "../cli/.config/cm3.json";
import cm4 from "../cli/.config/cm4.json";
import cm5 from "../cli/.config/cm5.json";
import cm6 from "../cli/.config/cm6.json";
import cm7 from "../cli/.config/cm7.json";
import cm8 from "../cli/.config/cm8.json";
import fee from "../cli/.config/fee.json";
import t1 from "../cli/.config/t1.json";
import t2 from "../cli/.config/t2.json";
import t3 from "../cli/.config/t3.json";

import { assert, expect } from "chai";
import { Bridge } from "../target/types/bridge";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { MessageIds, TestValues, TestValuesDefaults } from "./types";
import {
  BRIDGE_COMMITTEE_CONFIG,
  BRIDGE_COMMITTEE_SUBMITTER_CONFIG,
  BRIDGE_SBTC_AUTH,
  SBTC_MINT,
  DECIMALS9,
  getCommitteePda,
  getSubmitterPda,
  getSupportChainPda,
  getTokenConfigPda,
  GLOBAL_CONFIG,
  NONCE_CONFIG,
  SUPPORTED_CHAINS_CONFIG,
  TOKEN_CONFIG,
} from "./constants";

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
    assert.fail("Should not go to here, no exception throw.");
  } catch (e) {
    console.log(`error : ${JSON.stringify(e)}`);
    return;
  }
};
function keypairsToPublicArrays(keypairs): PublicKey[] {
  if (!Array.isArray(keypairs)) {
    throw new Error("Input must be an array");
  }

  return keypairs.map((keypair) => {
    if (!(keypair instanceof Keypair)) {
      throw new Error("Array elements must be Keypair instances");
    }
    return keypair.publicKey;
  });
}
export async function airdrop(connection: Connection, key: PublicKey, amount: number = 100) {
  const airdropSignature = await connection.requestAirdrop(key, amount * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSignature);
}

export function createValues(defaults?: TestValuesDefaults): TestValues {
  const payerAdmin = Keypair.fromSecretKey(new Uint8Array(secret));
  console.log(`payerAdmin is ${JSON.stringify(payerAdmin.publicKey)}`);

  const feeRecipient = Keypair.fromSecretKey(new Uint8Array(fee)).publicKey;
  // Keypair.generate().publicKey;
  console.log(`feeRecipient is ${JSON.stringify(feeRecipient)}`);

  const supportedTokensKeypairs = [Keypair.fromSecretKey(new Uint8Array(t1)), Keypair.fromSecretKey(new Uint8Array(t2)), Keypair.fromSecretKey(new Uint8Array(t3))];
  supportedTokensKeypairs.forEach((keypair, index) => {
    console.log(`PublicKey of supportedTokensKeypairs ${index} is ${keypair.publicKey.toBase58()}`);
  });

  const supportedTokensIndex = Array.from(
    { length: supportedTokensKeypairs.length },
    (_, i) => i
  );
  const decimals = [DECIMALS9, DECIMALS9, DECIMALS9];
  const prices = [
    new anchor.BN(9999).mul(decimals[0]),
    new anchor.BN(8888).mul(decimals[1]),
    new anchor.BN(7777).mul(decimals[2]),

  ];
  const supportedChains = [2, 3, 4];
  const supportedChainsBuffer = Buffer.from(new Uint8Array(supportedChains));
  const tokenFeePercentages = [new anchor.BN(100), new anchor.BN(2000), new anchor.BN(2000000)];
  const tokenMinAmounts = [
    new anchor.BN(100).mul(decimals[0]),
    new anchor.BN(2000).mul(decimals[1]),
    new anchor.BN(200).mul(decimals[2]),

  ];
  const curChainId = 1;
  const bridgeConfigPDA = PublicKey.findProgramAddressSync(
    [GLOBAL_CONFIG, new anchor.BN(curChainId).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`curChainId is ${new anchor.BN(curChainId).toArrayLike(Buffer, 'be', 1)}`);
  console.log(`bridgeConfigPDA is ${JSON.stringify(bridgeConfigPDA)}`);

  const bridgeSbtcAuth = PublicKey.findProgramAddressSync(
    [BRIDGE_SBTC_AUTH, new anchor.BN(curChainId).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`bridgeSbtcAuth is ${JSON.stringify(bridgeSbtcAuth)}`);

  const sbtcMint = PublicKey.findProgramAddressSync(
    [SBTC_MINT, new anchor.BN(curChainId).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0]
  console.log(`sbtcMint is ${JSON.stringify(sbtcMint)}`);

  const tokenConfigPdas = supportedTokensIndex.map((tokenId, index) =>
    getTokenConfigPda(tokenId)
  );
  console.log(`tokenConfigPdas is ${JSON.stringify(tokenConfigPdas)}`);
  const supportedChainsPdas = supportedChains.map((chainId) => {
    return getSupportChainPda(new anchor.BN(chainId));
  });
  // https://explorer.solana.com/tx/3gR4kGmU9cQpcQL8wC8HATPVhMghMrKBzqL6aaoHGN2BnoUUbK5dnbxmd1KuLjz4wTtHDWcq93P8evuVK2oUWLUA?cluster=devnet
  const committeeKeypairs = [
    Keypair.fromSecretKey(new Uint8Array(cm1)),
    Keypair.fromSecretKey(new Uint8Array(cm2)),
    Keypair.fromSecretKey(new Uint8Array(cm3)),
    // Keypair.fromSecretKey(new Uint8Array(cm4)),
    // Keypair.fromSecretKey(new Uint8Array(cm5)),
    // Keypair.fromSecretKey(new Uint8Array(cm6)),
    // Keypair.fromSecretKey(new Uint8Array(cm7)),
    // Keypair.fromSecretKey(new Uint8Array(cm8)),
  ];
  committeeKeypairs.forEach((keypair, index) => {
    console.log(`PublicKey of committeeKeypair ${index} is ${keypair.publicKey.toBase58()}`);
  });

  const committeePdas = committeeKeypairs.map((committeeAddress) => {
    return getCommitteePda(committeeAddress);
  });
  console.log(`committeePdas is ${JSON.stringify(committeePdas)}`);

  const stakes = [3000, 3000, 1000];
  const minStake = 1000;
  const submitter = committeeKeypairs[0];
  const submitterPda = getSubmitterPda(submitter);
  const noncePdaUpdateTokenPrice = PublicKey.findProgramAddressSync(
    [NONCE_CONFIG, new anchor.BN(MessageIds.UpdateTokenPrice.toString()).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`noncePdaUpdateTokenPrice is ${JSON.stringify(noncePdaUpdateTokenPrice)}`);

  const nonceMintSbtc = PublicKey.findProgramAddressSync(
    [NONCE_CONFIG, Buffer.from(MessageIds.MintSbtc.toString())],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`nonceMintSbtc is ${JSON.stringify(nonceMintSbtc)}`);

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
    supportedChains,
    bridgeSbtcAuth: bridgeSbtcAuth,
    sbtcMint,
    nonceMintSbtc
  };
}

export async function createUserSbtcAta(
  provider: anchor.AnchorProvider,
  sbtcMint: PublicKey,
  user: anchor.web3.Keypair
): Promise<PublicKey> {
  const associatedTokenAddress = await anchor.utils.token.associatedAddress({
    mint: sbtcMint,
    owner: user.publicKey,
  });

  // 如果 ATA 已存在，则跳过创建
  const accountInfo = await provider.connection.getAccountInfo(
    associatedTokenAddress
  );
  if (accountInfo) {
    return associatedTokenAddress; // 如果已存在，直接返回
  }

  const createAtaIx = createAssociatedTokenAccountInstruction(
    user.publicKey, // payer
    associatedTokenAddress, // new ATA address
    user.publicKey, // owner
    sbtcMint // mint
  );

  // 创建并发送交易
  const tx = new Transaction().add(createAtaIx);
  await provider.sendAndConfirm(tx, [user]);

  return associatedTokenAddress;
}

export async function createCommitteeConfig(
  program: anchor.Program<Bridge>,
  values: TestValues
) {
  return await program.methods
    .createBridgeCommittee(
      keypairsToPublicArrays(values.committeeKeypairs),
      values.stakes,
      values.minStake
    )
    .accounts({
      submitterPda: values.submitterPda,
      submitter: values.submitter.publicKey,
    })
    .remainingAccounts([
      ...values.committeePdas.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
    ])
    .rpc({ skipPreflight: false });
}

export async function createBridgeConfig(
  program: anchor.Program<Bridge>,
  values: TestValues
) {
  return await program.methods
    .createBridgeConfig(
      values.chainId,
      values.feeRecipient,
      values.prices,
      values.supportedChainsBuffer,
      values.tokenFeePercentages,
      values.tokenMinAmounts
    )
    .accounts({
      payer: values.payerAdmin.publicKey, bridgeConfig: values.bridgeConfigPDA, sbtcMint: values.sbtcMint,
    })
    .remainingAccounts([
      ...values.tokenConfigPdas.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
      ...values.supportedChainsPdas.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
    ])
    .rpc({ skipPreflight: false });
}

export async function createAndSendV0Tx(txInstructions: TransactionInstruction[], signers: Array<Signer>, connection: Connection, lookupTable?: AddressLookupTableAccount[], skipPreflight: boolean = false) {
  // Step 1 - Fetch Latest Blockhash
  let latestBlockhash = await connection.getLatestBlockhash('finalized');
  console.log("   ✅ - Fetched latest blockhash. Last valid height:", latestBlockhash.lastValidBlockHeight);

  // Step 2 - Generate Transaction Message
  const messageV0 = new TransactionMessage({
    payerKey: signers[0].publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions
  }).compileToV0Message(lookupTable);
  console.log("   ✅ - Compiled transaction message");
  const transaction = new VersionedTransaction(messageV0);
  console.log("   ✅ - Transaction Size < 1232:", transaction.serialize().length);
  // Step 3 - Sign your transaction with the required `Signers`
  transaction.sign(signers);
  console.log("   ✅ - Transaction Signed");

  try {
    // partialsign for a Versioned Transaction, instead
    // https://web3engineering.co.uk/partially-signing-versionedtransaction
    const txid = await connection.sendTransaction(transaction, { skipPreflight: skipPreflight, maxRetries: 3 });
    // Step 4 - Send our v0 transaction to the cluster
    console.log(`   ✅ - Transaction ${txid} sent to network`);
    // Step 5 - Confirm Transaction 
    const confirmation = await confirmTransaction(connection, txid);
    if (confirmation.err) {
      console.log("   ❌ - Transaction not confirmed.")
      throw confirmation.err
    }
    console.log('🎉 Transaction succesfully confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);

  } catch (err) {
    console.error("Transaction failed:", err);
    throw err
  }
}

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = "confirmed",
  timeout: number = 300000,
  pollInterval: number = 1000,
  searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const { value: statuses } = await connection.getSignatureStatuses(
      [signature],
      { searchTransactionHistory }
    );
    if (!statuses || statuses.length === 0) {
      throw new Error("Failed to get signature status");
    }
    const status = statuses[0];
    if (status === null) {
      // If status is null, the transaction is not yet known
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      continue;
    }
    if (status.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status)}`);
    }
    if (
      status.confirmationStatus &&
      status.confirmationStatus === desiredConfirmationStatus
    ) {
      return status;
    }
    if (status.confirmationStatus === "finalized") {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
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
export async function checkAssociatedTokenAccount(
  connection,
  mintAddress,
  ownerAddress
) {
  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintAddress,
      ownerAddress,
      true
    );
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    console.log(
      `checkAssociatedTokenAccount : ownerAddress:${ownerAddress}, mintAddress:${mintAddress}, associatedTokenAddress:${associatedTokenAddress}, accountInfo:${accountInfo}`
    );
    return accountInfo !== null;
  } catch (error) {
    console.error("Error checking associated token account:", error);
    return false;
  }
}
export { TestValues };

export function assembleUpdateTokenPricePayload(
  tokenId: number,
  tokenPrice: anchor.BN
): Uint8Array {
  if (tokenId < 0 || tokenId > 255) {
    throw new Error("Invalid tokenId, must be between 0 and 255");
  }

  const tokenIdBuffer = Buffer.from([tokenId]);
  const tokenPriceBuffer = Buffer.alloc(8);
  tokenPriceBuffer.writeBigUInt64BE(BigInt(tokenPrice.toString()));

  return Buffer.concat([tokenIdBuffer, tokenPriceBuffer]);
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
  createAndSendV0Tx([lookupTableInst], [payer], connection, null, true);
  return lookupTableAddress;
}

export function getTxnAddress(tx: Transaction) {
  const accounts: PublicKey[] = [];
  // Extract accounts from tx.instructions
  tx.instructions.forEach((instruction: TransactionInstruction) => {
    instruction.keys.forEach((key) => {
      // Add account addresses to the respective arrays
      accounts.push(key.pubkey);
    });
  });
  console.log(`accounts is ${JSON.stringify(accounts)}`)
  return accounts;
}