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
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Ed25519Program,
} from "@solana/web3.js";
import {
  Liquidity,
  Market as raydiumSerum,
  Spl,
  SPL_MINT_LAYOUT,
} from "@raydium-io/raydium-sdk";
import fs from "fs";
import path from "path";
import secret from "../sdk/.config/secret.json";
import cm1 from "../sdk/.config/cm1.json";
import cm2 from "../sdk/.config/cm2.json";
import cm3 from "../sdk/.config/cm3.json";
import cm4 from "../sdk/.config/cm4.json";
import cm5 from "../sdk/.config/cm5.json";
import cm6 from "../sdk/.config/cm6.json";
import cm7 from "../sdk/.config/cm7.json";
import cm8 from "../sdk/.config/cm8.json";
import fee from "../sdk/.config/fee.json";
import t1 from "../sdk/.config/t1.json";
import t2 from "../sdk/.config/t2.json";
import t3 from "../sdk/.config/t3.json";
import u1 from "../sdk/.config/u1.json";


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
  MSG_VERSION,
  getLimiterPda,
} from "./constants";
import { MintSbtcMessage, MintSbtcMessageTxn } from "../sdk/txns/mint-sbtc ";
import { UpdateLimiterMsg, UpdateLimiterMsgTxn } from "../sdk/txns/update-limiter";
import { CreateBridgeConfigMessageTxn } from "../sdk/txns/bridge-config";

export interface TestValues {
  payerAdmin: Keypair;
  feeRecipient: PublicKey;
  chainId: number;
  supportedTokensKeypairs: Keypair[];
  supportedTokensIndex: number[];
  prices: anchor.BN[];
  supportedChainsBuffer: Buffer;
  tokenFeePercentages: anchor.BN[];
  decimals: anchor.BN[];
  tokenMinAmounts: anchor.BN[];
  bridgeConfigPDA: PublicKey;
  bridgeSbtcAuth: PublicKey;
  sbtcMint: PublicKey;
  tokenConfigPdas: PublicKey[];
  supportedChainsPdas: PublicKey[];
  committeeKeypairs: Keypair[];
  stakes: number[];
  submitter: Keypair;
  submitterPda: PublicKey;
  committeePdas: PublicKey[];
  noncePdaUpdateLimter: PublicKey;
  nonceMintSbtc: PublicKey;
  nonceWithdrawBtc: PublicKey;
  supportedChains: number[];
  ethBtcAddress: Uint8Array;
  user: Keypair;
  userSbtcAta: PublicKey;
  feeRecipientSbtcAta: PublicKey;
  limiterPdas: PublicKey[];
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
    assert.fail("Should not go to here, no exception throw.");
  } catch (e) {
    console.log(`error : ${JSON.stringify(e)}`);
    return;
  }
};
export function keypairsToPublicArrays(keypairs): PublicKey[] {
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

export async function createValues(defaults?: TestValuesDefaults): Promise<TestValues> {
  const curChainId = 1;

  const payerAdmin = Keypair.fromSecretKey(new Uint8Array(secret));
  console.log(`payerAdmin is ${JSON.stringify(payerAdmin.publicKey)}`);


  const user = Keypair.fromSecretKey(new Uint8Array(u1));
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

  let userSbtcAta = await getAssociatedTokenAddress(
    sbtcMint,
    user.publicKey,
    true
  );

  const feeRecipient = Keypair.fromSecretKey(new Uint8Array(fee)).publicKey;
  console.log(`feeRecipient is ${JSON.stringify(feeRecipient)}`);

  const feeRecipientSbtcAta = await getAssociatedTokenAddress(
    sbtcMint,
    feeRecipient,
    true
  );

  const supportedTokensKeypairs = [Keypair.fromSecretKey(new Uint8Array(t1)), Keypair.fromSecretKey(new Uint8Array(t2)), Keypair.fromSecretKey(new Uint8Array(t3))];
  supportedTokensKeypairs.forEach((keypair, index) => {
    console.log(`PublicKey of supportedTokensKeypairs ${index} is ${keypair.publicKey.toBase58()}`);
  });

  const supportedTokensIndex = Array.from(
    { length: supportedTokensKeypairs.length },
    (_, i) => i + 10
  );
  const decimals = [DECIMALS9, DECIMALS9, DECIMALS9];
  const prices = [
    new anchor.BN(9999).mul(decimals[0]),
    new anchor.BN(8888).mul(decimals[1]),
    new anchor.BN(7777).mul(decimals[2]),

  ];
  const supportedChains = [2, 3, 4];
  const supportedChainsBuffer = Buffer.from(new Uint8Array(supportedChains));
  const tokenFeePercentages = [new anchor.BN(100), new anchor.BN(2000), new anchor.BN(10000)];
  const tokenMinAmounts = [
    new anchor.BN(1).mul(decimals[0]),
    new anchor.BN(1).mul(decimals[1]),
    new anchor.BN(1).mul(decimals[2]),

  ];
  const bridgeConfigPDA = PublicKey.findProgramAddressSync(
    [GLOBAL_CONFIG, new anchor.BN(curChainId).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`curChainId is ${new anchor.BN(curChainId).toString()}`);
  console.log(`bridgeConfigPDA is ${JSON.stringify(bridgeConfigPDA)}`);



  const tokenConfigPdas = supportedTokensIndex.map((tokenId, index) =>
    getTokenConfigPda(supportedChains[index], tokenId)
  );
  console.log(`tokenConfigPdas is ${JSON.stringify(tokenConfigPdas)}`);
  const supportedChainsPdas = supportedChains.map((chainId) => {
    return getSupportChainPda(new anchor.BN(chainId));
  });
  // https://explorer.solana.com/tx/3gR4kGmU9cQpcQL8wC8HATPVhMghMrKBzqL6aaoHGN2BnoUUbK5dnbxmd1KuLjz4wTtHDWcq93P8evuVK2oUWLUA?cluster=devnet
  const committeeKeypairs = [
    Keypair.fromSecretKey(new Uint8Array(cm1)),
    // Keypair.fromSecretKey(new Uint8Array(cm2)),
    // Keypair.fromSecretKey(new Uint8Array(cm3)),
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

  const stakes = [9000,];
  const submitter = committeeKeypairs[0];
  const submitterPda = getSubmitterPda(submitter);
  const noncePdaUpdateLimter = PublicKey.findProgramAddressSync(
    [NONCE_CONFIG, new anchor.BN(MessageIds.UpdateBridgeLimit.toString()).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`noncePdaUpdateLimter is ${JSON.stringify(noncePdaUpdateLimter)}`);

  const nonceMintSbtc = PublicKey.findProgramAddressSync(
    [NONCE_CONFIG, new anchor.BN(MessageIds.TokenTransfer.toString()).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`nonceMintSbtc is ${JSON.stringify(nonceMintSbtc)}`);

  const nonceWithdrawBtc = PublicKey.findProgramAddressSync(
    [NONCE_CONFIG, new anchor.BN(MessageIds.TokenTransfer.toString()).toArrayLike(Buffer, 'be', 1)],
    anchor.workspace.bridge.programId
  )[0];
  console.log(`nonceMintSbtc is ${JSON.stringify(nonceMintSbtc)}`);

  const limiterPdas = supportedTokensIndex.map((tokenId, index) =>
    getLimiterPda(supportedChains[index], tokenId)
  );


  // const ethBtcAddress = new Uint8Array(35); // 固定 32 字节
  // ethBtcAddress.set(Buffer.from("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599".replace("0x", ""), "hex"), 0); // 将前 20 字节

  const ethBtcAddress = Buffer.from("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599".replace("0x", ""), "hex")

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
    submitter,
    submitterPda,
    committeePdas,
    noncePdaUpdateLimter: noncePdaUpdateLimter,
    supportedChains,
    bridgeSbtcAuth: bridgeSbtcAuth,
    sbtcMint,
    nonceMintSbtc,
    nonceWithdrawBtc,
    ethBtcAddress,
    user,
    userSbtcAta,
    feeRecipientSbtcAta,
    limiterPdas
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
      values.chainId,
      keypairsToPublicArrays(values.committeeKeypairs),
      values.stakes,
    )
    .accounts({
      bridgeConfig: values.bridgeConfigPDA,
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
  let tx = await new CreateBridgeConfigMessageTxn(program).createTx({
    chainId: values.chainId,
    payerAdmin: values.payerAdmin.publicKey,
    feeRecipient: values.feeRecipient,
    chainIds: values.supportedChainsBuffer,
    tokenIds: Buffer.from(new Uint8Array(values.supportedTokensIndex)),
    tokenFeePercentages: values.tokenFeePercentages,
    tokenMinAmounts: values.tokenMinAmounts,

    bridgeConfigPda: values.bridgeConfigPDA,
    sbtcMint: values.sbtcMint,

    tokenConfigPdas: values.tokenConfigPdas.map((pubkey) => ({
      pubkey,
      isSigner: false,
      isWritable: true,
    })),
    supportedChainsPdas: values.supportedChainsPdas.map((pubkey) => ({
      pubkey,
      isSigner: false,
      isWritable: true,
    }))
  });

  console.log(`createBridgeConfig...start...`);
  const txid = await createAndSendV0Tx(tx.instructions, [values.payerAdmin], program.provider.connection);
  console.log(`createBridgeConfig....end...`);
  return txid;
}

export async function createAndSendV0Tx(txInstructions: TransactionInstruction[], signers: Array<Signer>, connection: Connection, lookupTable?: AddressLookupTableAccount[], skipPreflight: boolean = false, confirm: boolean = true): Promise<string> {
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

  let txid = "";
  try {
    // partialsign for a Versioned Transaction, instead
    // https://web3engineering.co.uk/partially-signing-versionedtransaction
    txid = await connection.sendTransaction(transaction, { skipPreflight: skipPreflight, maxRetries: 3 });
    // Step 4 - Send our v0 transaction to the cluster
    console.log(`   ✅ - Transaction ${txid} sent to network`);
    if (confirm) {
      // Step 5 - Confirm Transaction 
      const confirmation = await confirmTransaction(connection, txid);
      if (confirmation.err) {
        console.log("   ❌ - Transaction not confirmed.")
        throw confirmation.err
      }
      console.log('🎉 Transaction succesfully confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
    }
  } catch (err) {
    console.error("Transaction failed:", err);
    throw err
  }
  return txid;
}

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = "processed",
  timeout: number = 500000,
  pollInterval: number = 3000,
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
  const bytes1: Uint8Array = bs58.decode(address1);
  const bytes2: Uint8Array = bs58.decode(address2);
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

export async function mintSBtc(values: TestValues, program: anchor.Program<Bridge>, provider: anchor.AnchorProvider, nonce: anchor.BN = new anchor.BN(0), withTable: boolean = true) {
  console.log("mintSBtc");

  const mintAmout = new anchor.BN(1000).mul(DECIMALS9);
  const msg = new MintSbtcMessage({
    messageType: MessageIds.TokenTransfer, // for Mint_SBTC
    version: MSG_VERSION,
    nonce: nonce,
    toAddress: values.user.publicKey.toBuffer(),
    amount: mintAmout,
    sourceChainId: values.supportedChains[0], // 转换为数字
    sourceTokenId: values.supportedTokensIndex[0], // 转换为数字
    fromAddress: values.ethBtcAddress,
    toChainId: values.chainId
  });

  const signatures = values.committeeKeypairs.map(committeeKeypair => {
    return {
      data: msg.createSignature(committeeKeypair),
      publicKey: committeeKeypair.publicKey
    };
  });

  const numberOfSignatures = values.committeeKeypairs.length;
  const ixEd25519Programs = signatures.map(signature => Ed25519Program.createInstructionWithPublicKey({
    publicKey: signature.publicKey.toBytes(),
    signature: signature.data.signature,
    message: signature.data.encoded,
  })
  );

  let tx = await new MintSbtcMessageTxn(program).createTx({
    signatures,
    msg,
    chainID: values.chainId,
    numberOfSignatures,
    submitter: values.submitter.publicKey,
    submitterPda: values.submitterPda,
    bridgeConfigPda: values.bridgeConfigPDA,
    nonceMintSbtc: values.nonceMintSbtc,
    committeePdas: values.committeePdas,
    tokenConfigPda: values.tokenConfigPdas[0],
    supportChainPda: values.supportedChainsPdas[0],
    limiterPda: values.limiterPdas[0],
    userSbtcAta: values.userSbtcAta,
    user: values.user.publicKey,
    sbtcMint: values.sbtcMint,
  });

  if (withTable) {
    // const LOOKUP_TABLE_ADDRESS = new PublicKey("8j3Tgegjq5hY2joaC6hGUZQZhTg2cohkxVhCPVxYj3WP")
    const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
    console.log(`LOOKUP_TABLE_ADDRESS is : ${LOOKUP_TABLE_ADDRESS}`);
    await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
      payer: values.submitter.publicKey,
      authority: values.submitter.publicKey,
      lookupTable: LOOKUP_TABLE_ADDRESS,
      addresses: getTxnAddress(tx),
    })], [values.submitter], provider.connection, null, true);
    const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
    console.log(`table create success 0 !`);
    console.log(`mintSBtc...start...`);
    const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    console.log(`mintSBtc....end...`);
    return { mintAmout, txid };

  }
  else {
    console.log(`mintSBtc...start...`);
    /// local test validator always timeout when use LookupTable
    const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection);
    console.log(`mintSBtc....end...`);
    return { mintAmout, txid };

  }
}

export async function updateLimiter(values: TestValues, program: anchor.Program<Bridge>, provider: anchor.AnchorProvider, withTable: boolean = true) {
  console.log("mintSBtc");

  const totalLimit = new anchor.BN(1000).mul(DECIMALS9);
  const msg = new UpdateLimiterMsg({
    messageType: MessageIds.UpdateBridgeLimit, // for Mint_SBTC
    version: MSG_VERSION,
    nonce: new anchor.BN(0),
    chainId: values.chainId,
    targetChainId: values.supportedChains[0],
    tokenId: values.supportedTokensIndex[0],
    totalLimit: totalLimit,
  });

  const numberOfSignatures = values.committeeKeypairs.length;
  const signatures = values.committeeKeypairs.map(committeeKeypair => {
    return {
      data: msg.createSignature(committeeKeypair),
      publicKey: committeeKeypair.publicKey
    };
  });
  let tx = await new UpdateLimiterMsgTxn(program).createTx({
    signatures,
    msg,
    chainID: values.chainId,
    numberOfSignatures,
    submitter: values.submitter.publicKey,
    submitterPda: values.submitterPda,
    bridgeConfigPda: values.bridgeConfigPDA,
    noncePdaUpdateLimter: values.noncePdaUpdateLimter,
    committeePdas: values.committeePdas,
    tokenConfigPda: values.tokenConfigPdas[0],
    supportChainPda: values.supportedChainsPdas[0],
    limiterPda: values.limiterPdas[0]
  });

  if (withTable) {
    // const LOOKUP_TABLE_ADDRESS = new PublicKey("8j3Tgegjq5hY2joaC6hGUZQZhTg2cohkxVhCPVxYj3WP")
    const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
    console.log(`LOOKUP_TABLE_ADDRESS is : ${LOOKUP_TABLE_ADDRESS}`);
    await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
      payer: values.submitter.publicKey,
      authority: values.submitter.publicKey,
      lookupTable: LOOKUP_TABLE_ADDRESS,
      addresses: getTxnAddress(tx),
    })], [values.submitter], provider.connection, null, true);
    const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
    console.log(`table create success 0 !`);
    console.log(`mintSBtc...start...`);
    const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    console.log(`mintSBtc....end...`);
    return { txid, totalLimit };

  }
  else {
    console.log(`mintSBtc...start...`);
    /// local test validator always timeout when use LookupTable
    const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection);
    console.log(`mintSBtc....end...`);
    return { txid, totalLimit };

  }
}
export async function getBalance(ata: PublicKey, connection: anchor.web3.Connection): Promise<number> {
  try {
    const accountInfo = await getAccount(connection, ata);
    return Number(accountInfo.amount);
  } catch (err) {
    console.log("No existing ATA info, assume zero balance:", err);
    return 0;
  }
}
export function currentHourTotal(chainTokenLimiter): { currentH: number, currentSlot: number, total: number } {
  const currentH = Math.floor(Date.now() / 1000 / 3600);
  const currentSlot = currentH % 24;
  console.log(`chainTokenLimiter.hourlyTransfers=${JSON.stringify(chainTokenLimiter.hourlyTransfers)}`)
  const total: number = chainTokenLimiter.hourlyTransfers
    .map((hexValue: string) => parseInt(hexValue.toString(), 10)) // 将十六进制字符串转为十进制数字
    .reduce((acc, val) => acc + val, 0); // 对转换后的十进制数字求和
  console.log(`chainTokenLimiter.total=${JSON.stringify(total)}`)
  return { currentH, currentSlot, total };
}
