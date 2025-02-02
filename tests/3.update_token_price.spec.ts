
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, airdrop, assembleUpdateTokenPricePayload, createAndSendV0Tx, createBridgeConfig, createCommitteeConfig, createValues, expectRevert } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
import { MessageType, MessageIds } from "./types";
import { Keypair, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js'
import { UpdateTokenPriceMsg, UpdateTokenPriceMsgTxn } from "./txns/updateTokenPrice";
import { MSG_VERSION } from "./constants";





describe("Update Token Price", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = createValues();
    const createBridgeConfig_tx = await createBridgeConfig(program, values);
    console.log(`createBridgeConfig_tx is ${createBridgeConfig_tx}`)
    const createCommitteeConfig_tx = await createCommitteeConfig(program, values);
    console.log(`createCommitteeConfig_tx is ${createCommitteeConfig_tx}`)
  });
  it("1. update Token Price with only submitter", async () => {

    await airdrop(provider.connection, values.submitter.publicKey);
    // Create the msg object
    const msg = new UpdateTokenPriceMsg({
      messageType: new BN(MessageIds.UpdateTokenPrice),
      version: MSG_VERSION,
      nonce: new anchor.BN(1), // todo: should get nonce from chian
      chainId: values.chainId,
      tokenId: values.supportedTokensIndex[0],
      tokenPrice: new anchor.BN(999)
    });

    const { encoded, signature } = msg.createSignature(values.submitter);
    const numberOfSignatures = new anchor.BN(1)
    let tx = await new UpdateTokenPriceMsgTxn(program).createTx({
      serialized: encoded,
      signature,
      signerPublicKey: values.submitter.publicKey,
      payer: values.submitter.publicKey,
      addixEd25519Program: true,
      msg,
      chainID: values.chainId,
      numberOfSignatures,
      bridgeConfigPDA: values.bridgeConfigPDA,
      noncePdaUpdateTokenPrice: values.noncePdaUpdateTokenPrice,
      submitterPda: values.submitterPda,
      submitter: values.submitter.publicKey,
      committeePdas: values.committeePdas,
      tokenConfigPdas: values.tokenConfigPdas[0]
    });
    // tx.feePayer = values.idoBuyer.publicKey;
    console.log(`tx.instructions[0] is ${JSON.stringify(tx.instructions[0].programId, null, 2)}`);
    console.log(`tx.instructions[1] is ${JSON.stringify(tx.instructions[1].programId, null, 2)}`);
    // try {

    console.log(`claimLpRewards...start...`)
    await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection);
    console.log(`claimLpRewards....end...`)

    for (const [index, tokenConfigPda] of values.tokenConfigPdas.entries()) {
      const tokenConfig = await program.account.tokenConfig.fetch(tokenConfigPda);
      console.log(`tokenConfig is ${JSON.stringify(tokenConfig)}`);
      expect(tokenConfig.tokenAddress.toString()).to.equal(values.supportedTokensKeypairs[index].publicKey.toString());
      expect(tokenConfig.chainId.toString()).to.equal(values.supportedChainsBuffer[index].toString());
      expect(tokenConfig.tokenPrice.toString()).to.equal(values.prices[index].toString());
      expect(tokenConfig.tokenFeePercentage.toString()).to.equal(values.tokenFeePercentages[index].toString());
      expect(tokenConfig.tokenMinAmount.toString()).to.equal(values.tokenMinAmounts[index].toString());
    }

    for (const [index, supportedChainPda] of values.supportedChainsPdas.entries()) {
      const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
      console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);
      expect(supportedChain.chainId.toString()).to.equal(values.supportedChainsBuffer[index].toString());
    }
  });

});
