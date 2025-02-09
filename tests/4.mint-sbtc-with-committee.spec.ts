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
  createLookupTable,
  getTxnAddress,
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
  Ed25519Program,
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
    //   pub struct MintSbtcMessage {
    //     pub message_type: u8,
    //     pub version: u8,
    //     pub nonce: u64,
    //     pub source_chain_id: u8,
    //     pub source_token_id: u8,
    //     pub from_address_length: u8, 
    //     pub from_address: Vec<u8>,  
    //     pub to_chain_id: u8,
    //     pub to_address: [u8; 32],
    //     pub amount: u64,
    // }

    const msg = new MintSbtcMessage({
      messageType: MessageIds.TokenTransfer, // for Mint_SBTC
      version: MSG_VERSION,
      nonce: new anchor.BN(1),
      toAddress: values.user.publicKey.toBuffer(),
      amount: new anchor.BN(1000),
      sourceChainId: values.supportedChains[0], // 转换为数字
      sourceTokenId: values.supportedTokensIndex[0], // 转换为数字
      toChainId: values.chainId
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

    const signatures = values.committeeKeypairs.map(committeeKeypair => {
      return {
        data: msg.createSignature(committeeKeypair),
        publicKey: committeeKeypair.publicKey
      };
    });

    const numberOfSignatures = values.committeeKeypairs.length;
    const ixEd25519Programs = signatures.map(signature =>
      Ed25519Program.createInstructionWithPublicKey({
        publicKey: signature.publicKey.toBytes(),
        signature: signature.data.signature,
        message: signature.data.encoded,
      })
    );


    const tx = await program.methods
      .mintSbtcWithSignatures(values.chainId, numberOfSignatures, msg as any,)
      .accounts({
        bridgeConfig: values.bridgeConfigPDA,
        nonce: values.nonceMintSbtc,
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
      ]).preInstructions(
        [ComputeBudgetProgram.setComputeUnitLimit({ units: 10000000 }), ...ixEd25519Programs]
      ).transaction();

    // const LOOKUP_TABLE_ADDRESS = new PublicKey("8j3Tgegjq5hY2joaC6hGUZQZhTg2cohkxVhCPVxYj3WP")
    const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
    console.log(`LOOKUP_TABLE_ADDRESS is : ${LOOKUP_TABLE_ADDRESS}`);

    await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
      payer: values.submitter.publicKey,
      authority: values.submitter.publicKey,
      lookupTable: LOOKUP_TABLE_ADDRESS,
      addresses: getTxnAddress(tx),
    })], [values.submitter], provider.connection, null, true);
    console.log(`table create success 0 !`);

    console.log(`claimLpRewards...start...`)
    const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
    await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    // await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection);
    console.log(`claimLpRewards....end...`)

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
  }, 300000);
});
