import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
  TestValues,
  createAndSendV0Tx,
  createBridgeConfig,
  createValues,
  expectRevert,
  createCommitteeConfig,
  checkAssociatedTokenAccount,
} from "./init";
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
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { describe, beforeAll, it } from "vitest";
import { expect, assert } from "chai";
import { BRIDGE_PDA } from "./constants";

describe("Mint sbtc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeAll(async () => {
    values = createValues();
    await createBridgeConfig(program, values);
    await createCommitteeConfig(program, values);
  });

  it("mint sbtc with committee", async () => {
    const msg = {
      messageType: 9, // for Mint_SBTC
      version: 1,
      nonce: new anchor.BN(1), // 转换为数字而不是 Buffer
      from_address: values.submitter.publicKey.toBuffer(),
      to_address: values.submitter.publicKey.toBuffer().slice(0, 32),
      amount: new anchor.BN(1000), // 转换为数字
      source_chain_id: new anchor.BN(2).toNumber(), // 转换为数字
      source_token_id: new anchor.BN(2).toNumber(), // 转换为数字
    };

    const configAccount = await program.account.bridgeConfig.fetch(
      values.bridgeConfigPDA
    );
    console.log("configAccount: ", configAccount);
    const bridgePDA = PublicKey.findProgramAddressSync(
      [BRIDGE_PDA, values.chainId.toBuffer()],
      anchor.workspace.bridge.programId
    )[0];
    const accountExists = await checkAssociatedTokenAccount(
      provider.connection,
      configAccount.sbtcMint,
      values.submitter.publicKey // use submitter as user to receive sbtc
    );
    let associatedTokenAddress = await getAssociatedTokenAddress(
      configAccount.sbtcMint,
      values.submitter.publicKey,
      true
    );

    const associatedInx = [];
    if (!accountExists) {
      associatedInx.push(
        createAssociatedTokenAccountInstruction(
          values.submitter.publicKey, // payer
          associatedTokenAddress, // ata address
          values.submitter.publicKey, // owner
          configAccount.sbtcMint // mint
        )
      );
    }
    const balance = await provider.connection.getBalance(
      values.submitter.publicKey
    );
    console.log("balance: ", balance, values.submitter.publicKey);

    console.log("remainingAccounts:", values.committeePdas);
    console.log(
      "remainingAccounts formatted:",
      values.committeePdas.map((pubkey) => pubkey.toBuffer())
    );
    try {
      const transaction = await program.methods
        .mintSbtcWithSignatures(msg as any, 3, values.chainId.toNumber())
        .accounts({
          bridgeConfig: values.bridgeConfigPDA,
          //   nonce: values.nonceMintSbtc,
          submitterAccount: values.submitterPda,
          submitter: values.submitter.publicKey,
          bridgePda: bridgePDA,
          userSbtcAta: associatedTokenAddress,
          user: values.submitter.publicKey,
          sbtcMint: values.sbtcMint,
          instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .remainingAccounts([
          ...values.committeePdas.map((pubkey) => ({
            pubkey,
            isSigner: false,
            isWritable: true,
          })),
        ])
        .preInstructions([...associatedInx])
        .signers([values.submitter, values.payerAdmin]);
      await transaction.rpc();
    } catch (e) {
      console.log("error: ", e);
    }
  });
});
