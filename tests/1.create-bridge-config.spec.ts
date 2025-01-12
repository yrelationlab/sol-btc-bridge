
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, createBridgeConfig, createValues, expectRevert } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
describe("Create and mint token with metadata", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = createValues();
  });
  it("Creation", async () => {
    console.log(`values.chainId is ${values.chainId}`)
    console.log(`values.feeRecipient is ${values.feeRecipient}`)
    const tx = await createBridgeConfig(program, values);
    console.log(`tx is ${tx}`)
    const configAccount = await program.account.bridgeConfig.fetch(values.bridgeConfigPDA);
    console.log(`configAccount is ${JSON.stringify(configAccount)}`)
    expect(configAccount.admin.toString()).to.equal(
      values.payerAdmin.publicKey.toString()
    );
    expect(configAccount.chainId.toString()).to.equal(values.chainId.toString());
    expect(configAccount.feeRecipient.toString()).to.equal(values.feeRecipient.toString());

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
