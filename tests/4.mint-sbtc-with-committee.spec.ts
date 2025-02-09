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
  airdrop,
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
import { BRIDGE_SBTC_AUTH, MSG_VERSION } from "./constants";
import { MintSbtcMessage } from "./txns/mint-sbtc-message ";
import { MessageIds } from "./types";

describe("Mint sbtc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeAll(async () => {
    values = await createValues();
    await createBridgeConfig(program, values);
    await createCommitteeConfig(program, values);
  });

  it("mint sbtc with committee", async () => {
    const msg = new MintSbtcMessage({
      messageType: MessageIds.TokenTransfer, // for Mint_SBTC
      version: MSG_VERSION,
      nonce: new anchor.BN(1),
      fromAddress: values.ethBtcAddress,
      toAddress: values.user.publicKey.toBuffer(),
      amount: new anchor.BN(1000),
      sourceChainId: values.supportedChains[0], // 转换为数字
      sourceTokenId: values.supportedTokensIndex[0], // 转换为数字
    });

    let beforeBalance = 0;
    try {
      const beforeAccountInfo = await getAccount(
        provider.connection,
        values.userSbtcAta
      );
      beforeBalance = Number(beforeAccountInfo.amount);
    } catch (err) {
      console.log("No existing user ATA info, assume zero balance:", err);
      beforeBalance = 0;
    }
    console.log(`User sBTC balance before mint: ${beforeBalance}`);

    await airdrop(provider.connection, values.submitter.publicKey, 1)
    await airdrop(provider.connection, values.payerAdmin.publicKey, 1)

    const transaction = await program.methods
      .mintSbtcWithSignatures(values.chainId, 3, msg as any,)
      .accounts({
        payer: values.payerAdmin.publicKey,
        bridgeConfig: values.bridgeConfigPDA,
        //   nonce: values.nonceMintSbtc,
        submitterAccount: values.submitterPda,
        submitter: values.submitter.publicKey,
        userSbtcAta: values.userSbtcAta,
        user: values.user.publicKey,
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
      .signers([values.payerAdmin, values.submitter])
      .rpc();
    console.log("txSig: ", transaction);

    let afterBalance = 0;
    try {
      const afterAccountInfo = await getAccount(
        provider.connection,
        values.userSbtcAta
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
