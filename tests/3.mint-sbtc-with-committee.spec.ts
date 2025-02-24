import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
  TestValues,
  createBridgeConfig,
  createValues,
  createCommitteeConfig,
  airdrop,
  mintSBtc,
  updateLimiter,
  currentHourTotal,
  createLookupTable,
  createAndSendV0Tx,
  getTxnAddress,
} from "./init";
import {
  getAccount,
} from "@solana/spl-token";
import { describe, beforeAll, it } from "vitest";
import { expect, assert } from "chai";
import { AddressLookupTableProgram, Ed25519Program, Keypair } from "@solana/web3.js";
import { MintSbtcMessage, MintSbtcMessageTxn } from "../sdk/txns/mint-sbtc ";
import { DECIMALS10, MSG_VERSION } from "./constants";
import { MessageIds } from "./types";

describe("Mint sbtc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  let totalLimit: anchor.BN;
  beforeAll(async () => {
    values = await createValues();
    await createBridgeConfig(program, values);
    await createCommitteeConfig(program, values);
    await airdrop(provider.connection, values.submitter.publicKey, 1)
    await airdrop(provider.connection, values.payerAdmin.publicKey, 1)
    totalLimit = (await updateLimiter(values, program, provider)).totalLimit;
    console.log("totalLimit:", totalLimit.toString(10));
  }, 100000);

  it("mint sbtc with committee", async () => {

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
    const { mintAmout, txid } = await mintSBtc(values, program, provider);
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
    expect(afterBalance - beforeBalance, "should minted 1000").to.equal(mintAmout.toNumber());

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
        // **转换 ETH 地址**
        // const fromEthAddress = "0x" + event.data.fromAddress.toString("hex");
        // const toSolAddress = new PublicKey(event.data.toAddress).toBase58();
        // console.log("ETH Address:", fromEthAddress);
        // console.log("Solana Address:", toSolAddress);
      }
    }

    const limiterConfig = await program.account.chainTokenLimiter.fetch(values.limiterPdas[0]);
    console.log(`limiterConfig is ${JSON.stringify(limiterConfig)}`)
    expect(totalLimit.toString()).to.be.eq(limiterConfig.totalLimit.toString());
    expect(limiterConfig.isInitialized).to.be.true;
    const val = currentHourTotal(limiterConfig);
    console.log(`val.total is ${val.total}, totalLimit is ${totalLimit}`)
    expect(val.total.toString(10)).to.be.eq(totalLimit.toString(10))

    try {
      // limit exceed
      await mintSBtc(values, program, provider, new anchor.BN(1));
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'TransferLimitExceeded'
          )
      );
    }
  }, 700000);

  it("mint sbtc failed with diable committee", async () => {
    const stakes = 9000;
    const is_blocklisted = true;
    await program.methods
      .addOrUpdateCommittee(
        values.chainId,
        values.committeeKeypairs[0].publicKey,
        stakes,
        is_blocklisted,
      )
      .accounts({
        bridgeConfig: values.bridgeConfigPDA,
        committeeConfig: values.committeePdas[0]
      })
      .rpc({ skipPreflight: false });

    const committee = await program.account.committee.fetch(values.committeePdas[0]);
    console.log(`committee is ${JSON.stringify(committee)}`);
    expect(committee.stakeAmount.toString()).to.equal(stakes.toString());
    expect(committee.isBlocklisted).to.true;

    try {
      // limit exceed
      await mintSBtc(values, program, provider, new anchor.BN(0));
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'InvalidCommittee'
          )
      );
    }
  }, 700000);


  it("mint sbtc failed with duplicated committee", async () => {

    try {
      const mintAmout = new anchor.BN(1000).mul(DECIMALS10);
      const msg = new MintSbtcMessage({
        messageType: MessageIds.TokenTransfer, // for Mint_SBTC
        version: MSG_VERSION,
        nonce: new anchor.BN(0),
        toAddress: values.user.publicKey.toBuffer(),
        amount: mintAmout,
        sourceChainId: values.supportedChains[0], // 转换为数字
        sourceTokenId: values.supportedTokensIndex[0], // 转换为数字
        fromAddress: values.ethBtcAddress,
        toChainId: values.chainId
      });

      const signatures = values.dupCommitteeKeypairs.map(committeeKeypair => {
        return {
          data: msg.createSignature(committeeKeypair),
          publicKey: committeeKeypair.publicKey
        };
      });

      const numberOfSignatures = values.dupCommitteeKeypairs.length;
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

      const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
      await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
        payer: values.submitter.publicKey,
        authority: values.submitter.publicKey,
        lookupTable: LOOKUP_TABLE_ADDRESS,
        addresses: getTxnAddress(tx),
      })], [values.submitter], provider.connection, null, true);
      const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
      const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'DuplicateSignature'
          )
      );
    }
  }, 700000);

  it("mint sbtc failed with error InvalidAccountIndex", async () => {

    try {
      const mintAmout = new anchor.BN(1000).mul(DECIMALS10);
      const msg = new MintSbtcMessage({
        messageType: MessageIds.TokenTransfer, // for Mint_SBTC
        version: MSG_VERSION,
        nonce: new anchor.BN(0),
        toAddress: values.user.publicKey.toBuffer(),
        amount: mintAmout,
        sourceChainId: values.supportedChains[0], // 转换为数字
        sourceTokenId: values.supportedTokensIndex[0], // 转换为数字
        fromAddress: values.ethBtcAddress,
        toChainId: values.chainId
      });

      const signatures = values.dupCommitteeKeypairs.map(committeeKeypair => {
        return {
          data: msg.createSignature(committeeKeypair),
          publicKey: committeeKeypair.publicKey
        };
      });

      signatures[0].publicKey = Keypair.generate().publicKey;

      const numberOfSignatures = values.dupCommitteeKeypairs.length;
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

      const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
      await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
        payer: values.submitter.publicKey,
        authority: values.submitter.publicKey,
        lookupTable: LOOKUP_TABLE_ADDRESS,
        addresses: getTxnAddress(tx),
      })], [values.submitter], provider.connection, null, true);
      const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
      const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'InvalidAccountIndex'
          )
      );
    }
  }, 700000);


  
  it("mint sbtc failed with error signature", async () => {

    try {
      const mintAmout = new anchor.BN(1000).mul(DECIMALS10);
      const msg = new MintSbtcMessage({
        messageType: MessageIds.TokenTransfer, // for Mint_SBTC
        version: MSG_VERSION,
        nonce: new anchor.BN(0),
        toAddress: values.user.publicKey.toBuffer(),
        amount: mintAmout,
        sourceChainId: values.supportedChains[0], // 转换为数字
        sourceTokenId: values.supportedTokensIndex[0], // 转换为数字
        fromAddress: values.ethBtcAddress,
        toChainId: values.chainId
      });

      const signatures = values.dupCommitteeKeypairs.map(committeeKeypair => {
        return {
          data: msg.createSignature(committeeKeypair),
          publicKey: committeeKeypair.publicKey
        };
      });

      signatures[0].data = msg.createSignature( Keypair.generate());

      const numberOfSignatures = values.dupCommitteeKeypairs.length;
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

      const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
      await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
        payer: values.submitter.publicKey,
        authority: values.submitter.publicKey,
        lookupTable: LOOKUP_TABLE_ADDRESS,
        addresses: getTxnAddress(tx),
      })], [values.submitter], provider.connection, null, true);
      const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
      const txid = await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'InvalidAccountIndex'
          )
      );
    }
  }, 700000);


  it.only("mint sbtc with duplicate nonce", async () => {

    let nonce =  new anchor.BN(100000);
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
    const { mintAmout, txid } = await mintSBtc(values, program, provider, nonce) ;
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
    expect(afterBalance - beforeBalance, "should minted 1000").to.equal(mintAmout.toNumber());

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
        // **转换 ETH 地址**
        // const fromEthAddress = "0x" + event.data.fromAddress.toString("hex");
        // const toSolAddress = new PublicKey(event.data.toAddress).toBase58();
        // console.log("ETH Address:", fromEthAddress);
        // console.log("Solana Address:", toSolAddress);
      }
    }

    const limiterConfig = await program.account.chainTokenLimiter.fetch(values.limiterPdas[0]);
    console.log(`limiterConfig is ${JSON.stringify(limiterConfig)}`)
    expect(totalLimit.toString()).to.be.eq(limiterConfig.totalLimit.toString());
    expect(limiterConfig.isInitialized).to.be.true;
    const val = currentHourTotal(limiterConfig);
    console.log(`val.total is ${val.total}, totalLimit is ${totalLimit}`)
    expect(val.total.toString(10)).to.be.eq(totalLimit.toString(10))

    try {
      // limit exceed
      await mintSBtc(values, program, provider, nonce);
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'already in use'
          )
      );
    }
  }, 700000);
});

