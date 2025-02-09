
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, airdrop, assembleUpdateTokenPricePayload, createAndSendV0Tx, createBridgeConfig, createCommitteeConfig, createValues, expectRevert, createLookupTable, getTxnAddress } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
import { MessageType, MessageIds } from "./types";
import { Keypair, SYSVAR_INSTRUCTIONS_PUBKEY, AddressLookupTableProgram, PublicKey } from '@solana/web3.js'
import { UpdateTokenPriceMsg, UpdateTokenPriceMsgTxn } from "./txns/update-token-price";
import { MSG_VERSION } from "./constants";

describe("Update Token Price", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = await createValues();
    console.log(`connection: ${provider.connection.rpcEndpoint}`)
    const createBridgeConfig_tx = await createBridgeConfig(program, values);
    console.log(`createBridgeConfig_tx is ${createBridgeConfig_tx}`)
    const createCommitteeConfig_tx = await createCommitteeConfig(program, values);
    console.log(`createCommitteeConfig_tx is ${createCommitteeConfig_tx}`)
  }, 1000000);
  it("1. update Token Price with only submitter", async () => {
    await airdrop(provider.connection, values.submitter.publicKey);
    const changedPrice = new anchor.BN(999);
    const payload = assembleUpdateTokenPricePayload( values.supportedTokensIndex[0], changedPrice)
    // Create the msg object
    const msg = new UpdateTokenPriceMsg({
      messageType: MessageIds.UpdateTokenPrice,
      version: MSG_VERSION,
      nonce: new anchor.BN(1), // todo: should get nonce from chian
      chainId: values.chainId,
      payload: payload,
    });

    const signatures = values.committeeKeypairs.map(committeeKeypair => {
      return {
        data: msg.createSignature(committeeKeypair),
        publicKey: committeeKeypair.publicKey
      };
    });

    const numberOfSignatures = values.committeeKeypairs.length;

    let tx = await new UpdateTokenPriceMsgTxn(program).createTx({
      signatures,
      msg,
      chainID: values.chainId,
      numberOfSignatures,
      payer: values.submitter.publicKey,
      bridgeConfigPDA: values.bridgeConfigPDA,
      noncePdaUpdateTokenPrice: values.noncePdaUpdateTokenPrice,
      submitterPda: values.submitterPda,
      submitter: values.submitter.publicKey,
      committeePdas: values.committeePdas,
      tokenConfigPdas: values.tokenConfigPdas[0],
    });

    console.log(`tx.instructions[0] is ${JSON.stringify(tx.instructions[0].programId, null, 2)}`);
    console.log(`tx.instructions[1] is ${JSON.stringify(tx.instructions[1].programId, null, 2)}`);

    // const LOOKUP_TABLE_ADDRESS = new PublicKey("8j3Tgegjq5hY2joaC6hGUZQZhTg2cohkxVhCPVxYj3WP")
    // const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
    // console.log(`LOOKUP_TABLE_ADDRESS is : ${LOOKUP_TABLE_ADDRESS}`);

    // await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
    //   payer: values.submitter.publicKey,
    //   authority: values.submitter.publicKey,
    //   lookupTable: LOOKUP_TABLE_ADDRESS,
    //   addresses: getTxnAddress(tx),
    // })], [values.submitter], provider.connection, null, true);
    // console.log(`table create success 0 !`);

    // const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value; 

    console.log(`claimLpRewards...start...`)
    // https://explorer.solana.com/tx/2EmXQsAbFxWQoNAZNYdVTRgmu649i9p8xm73U8M5MVcWWCpWWidqMV7jwPAd8C1Em2Q9K8ASJg885HDAASsGRFVG?cluster=devnet
    // await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection);
    console.log(`claimLpRewards....end...`)

    const tokenConfig = await program.account.tokenConfig.fetch(values.tokenConfigPdas[0]);
    console.log(`tokenConfig is ${JSON.stringify(tokenConfig)}`);
    expect(tokenConfig.chainId.toString()).to.equal(values.supportedChainsBuffer[0].toString());
    expect(tokenConfig.tokenPrice.toString()).to.equal(changedPrice.toString());
    expect(tokenConfig.tokenFeePercentage.toString()).to.equal(values.tokenFeePercentages[0].toString());
    expect(tokenConfig.tokenMinAmount.toString()).to.equal(values.tokenMinAmounts[0].toString());

    for (const [index, supportedChainPda] of values.supportedChainsPdas.entries()) {
      const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
      console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);
      expect(supportedChain.chainId.toString()).to.equal(values.supportedChainsBuffer[index].toString());
    }
  }, 10000000);

});
