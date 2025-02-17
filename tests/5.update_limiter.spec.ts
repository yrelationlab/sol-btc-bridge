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
  mintSBtc,
  updateLimiter,
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
import { BRIDGE_SBTC_AUTH, DECIMALS9, MSG_VERSION } from "./constants";
import { MintSbtcMessage } from "../sdk/txns/mint-sbtc ";
import { MessageIds } from "./types";
import { BaseMsg } from "../sdk/txns/base-msg";

describe("add_or_update_limiter_with_signatures", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeAll(async () => {
    values = await createValues();
    await createBridgeConfig(program, values);
    await createCommitteeConfig(program, values);
    await airdrop(provider.connection, values.submitter.publicKey, 1)
    await airdrop(provider.connection, values.payerAdmin.publicKey, 1)
  });

  it("add_or_update_limiter_with_signatures", async () => {


    const { txid, totalLimit } = await updateLimiter(values, program, provider);

    const limiterConfig = await program.account.chainTokenLimiter.fetch(values.limiterPdas[0]);
    console.log(`limiterConfig is ${JSON.stringify(limiterConfig)}`)
    expect(totalLimit.toString()).to.be.eq(limiterConfig.totalLimit.toString());
    expect(limiterConfig.isInitialized).to.be.true;

    {
      // Get transaction from its signature
      const tx = await anchor.getProvider().connection.getTransaction(txid, {
        /** The level of finality desired */
        commitment: "confirmed",
        /** The max transaction version to return in responses. If the requested transaction is a higher version, an error will be returned */
        maxSupportedTransactionVersion: 0
      });

      const eventParser = new anchor.EventParser(program.programId, new anchor.BorshCoder(program.idl));
      const events = eventParser.parseLogs(tx.meta.logMessages);
      for (let event of events) {
        console.log(event);
      }
    }
  }, 700000);
});

