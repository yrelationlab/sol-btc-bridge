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
  getAccount,
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
      nonce: new anchor.BN(1), 
      fromAddress: values.submitter.publicKey.toBuffer(),
      toAddress: values.submitter.publicKey.toBuffer().slice(0, 32),
      amount: new anchor.BN(1000), 
      sourceChainId: new anchor.BN(2).toNumber(), // 转换为数字
      sourceTokenId: new anchor.BN(2).toNumber(), // 转换为数字
    };

    const configAccount = await program.account.bridgeConfig.fetch(
      values.bridgeConfigPDA
    );
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
    // console.log("balance: ", balance, values.submitter.publicKey);

    // 5. 检查用户在 mint 前的余额
    let beforeBalance = 0;
    try {
      const beforeAccountInfo = await getAccount(
        provider.connection,
        associatedTokenAddress
      );
      beforeBalance = Number(beforeAccountInfo.amount);
    } catch (err) {
      console.log("No existing user ATA info, assume zero balance:", err);
      beforeBalance = 0;
    }
    console.log(`User sBTC balance before mint: ${beforeBalance}`);

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
      .signers([values.submitter, values.payerAdmin])
      .rpc();
    console.log("txSig: ", transaction);

    let afterBalance = 0;
    try {
      const afterAccountInfo = await getAccount(
        provider.connection,
        associatedTokenAddress
      );
      afterBalance = Number(afterAccountInfo.amount);
    } catch (err) {
      console.error("Failed to get user ATA after mint:", err);
      afterBalance = 0;
    }
    console.log(`User sBTC balance after mint: ${afterBalance}`);

    expect(afterBalance, "user sBTC balance must increase").to.be.greaterThan(
      beforeBalance
    );
    expect(afterBalance - beforeBalance, "should minted 1000").to.equal(1000);
  });
});
