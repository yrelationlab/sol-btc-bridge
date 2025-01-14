
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, assembleUpdateTokenPricePayload, createBridgeConfig, createCommitteeConfig, createValues, expectRevert } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
import { MessageType, Operation } from "./types";
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
  it("Creation", async () => {

    const tokenId = values.supportedTokensIndex[0];
    const tokenPrice = 999;
    const payload = assembleUpdateTokenPricePayload(tokenId, tokenPrice);
    // Create the msg object
    const msg = {
      messageType: 0,              // Example: 1 for some type of message
      version: 1,                   // Example: version 1
      nonce: new anchor.BN(1), // Example nonce value
      chainId: values.chainId.toNumber(),            // Chain ID passed as an argument
      payload: payload, // Example payload data
    };
    await program.methods
      .updateTokenPriceWithSignatures(
        msg as any,
        3,
        values.chainId.toNumber()
      )
      .accounts({ 
        bridgeConfig: values.bridgeConfigPDA, 
        nonce: values.noncePdaUpdateTokenPrice,
        submitterAccount: values.submitterPda, 
        submitter:values.submitter.publicKey
      })
      .remainingAccounts([
        ...values.committeePdas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
        ,{
          pubkey: values.tokenConfigPdas[0],
          isSigner: false,
          isWritable: true,
      },

      ]).signers([values.submitter,values.payerAdmin])
      .rpc({ skipPreflight: false });

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
