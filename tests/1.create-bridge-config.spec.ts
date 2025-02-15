
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, airdrop, createBridgeConfig, createValues, expectRevert } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
import { getSupportChainPda, getTokenConfigPda } from "./constants";
describe("Create Bridge Config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = await createValues();
    await airdrop(provider.connection, values.submitter.publicKey);

  });

  it("create_bridge_config should work", async () => {
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
      expect(tokenConfig.chainId.toString()).to.equal(values.supportedChainsBuffer[index].toString());
      expect(tokenConfig.tokenFeePercentage.toString()).to.equal(values.tokenFeePercentages[index].toString());
      expect(tokenConfig.tokenMinAmount.toString()).to.equal(values.tokenMinAmounts[index].toString());
    }

    for (const [index, supportedChainPda] of values.supportedChainsPdas.entries()) {
      const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
      console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);
      expect(supportedChain.chainId.toString()).to.equal(values.supportedChainsBuffer[index].toString());
    }
  });

  it("add chain", async () => {
    // await createBridgeConfig(program, values);
    const supported_chain_id = 100;
    const supported = true;
    const supportedChainPda = getSupportChainPda(new anchor.BN(supported_chain_id));
    await program.methods
      .addOrUpdateChain(
        values.chainId,
        supported_chain_id,
        supported
      )
      .accounts({
        payer: values.payerAdmin.publicKey, bridgeConfig: values.bridgeConfigPDA, supportedChainConfig: supportedChainPda,
      })
      .signers([values.payerAdmin])
      .rpc({ skipPreflight: false });

    const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
    console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);
    expect(supportedChain.chainId.toString()).to.equal(supported_chain_id.toString());
    expect(supportedChain.supported.toString()).to.equal(supported.toString());

  });

  it("disable chain", async () => {
    // await createBridgeConfig(program, values);
    const supported_chain_id = 100; // can not change id
    const supported = false;
    const supportedChainPda = getSupportChainPda(new anchor.BN(supported_chain_id));
    await program.methods
      .addOrUpdateChain(
        values.chainId,
        supported_chain_id,
        supported
      )
      .accounts({
        payer: values.payerAdmin.publicKey, bridgeConfig: values.bridgeConfigPDA, supportedChainConfig: supportedChainPda,
      })
      .signers([values.payerAdmin])
      .rpc({ skipPreflight: false });

    const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
    console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);
    expect(supportedChain.chainId.toString()).be.equal(supported_chain_id.toString());
    expect(supportedChain.supported.toString()).to.equal(supported.toString());
  });

  it("add chain & token", async () => {
    const supported_chain_id = 100;
    const supported = true;
    const supportedChainPda = getSupportChainPda(new anchor.BN(supported_chain_id));
    const token_id = 99;
    const token_fee_percentages = 1000;
    const token_min_amount = 100;
    const withdraw_paused = false;
    const tokenConfigPda = getTokenConfigPda(supported_chain_id, token_id);

    await program.methods
      .addOrUpdateChainToken(
        values.chainId,
        supported_chain_id,
        token_id,
        new anchor.BN(token_fee_percentages),
        new anchor.BN(token_min_amount),
        withdraw_paused
      )
      .accounts({
        payer: values.payerAdmin.publicKey, bridgeConfig: values.bridgeConfigPDA, supportedChainConfig: supportedChainPda, tokenConfig: tokenConfigPda
      })
      .signers([values.payerAdmin])
      .rpc({ skipPreflight: false });

    const tokenConfig = await program.account.tokenConfig.fetch(tokenConfigPda);
    const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
    console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);

    console.log(`tokenConfig is ${JSON.stringify(tokenConfig)}`);
    expect(tokenConfig.chainId.toString()).to.equal(supportedChain.chainId.toString());
    expect(tokenConfig.tokenFeePercentage.toString()).to.equal(token_fee_percentages.toString());
    expect(tokenConfig.tokenMinAmount.toString()).to.equal(token_min_amount.toString());
    expect(tokenConfig.withdrawPaused.toString()).to.equal(withdraw_paused.toString());
  });

  it("update chain & token", async () => {
    const supported_chain_id = 100;
    const supported = true;
    const supportedChainPda = getSupportChainPda(new anchor.BN(supported_chain_id));
    const token_id = 99;
    const token_fee_percentages = 500;
    const token_min_amount = 11;
    const withdraw_paused = true;
    const tokenConfigPda = getTokenConfigPda(supported_chain_id, token_id);

    await program.methods
      .addOrUpdateChainToken(
        values.chainId,
        supported_chain_id,
        token_id,
        new anchor.BN(token_fee_percentages),
        new anchor.BN(token_min_amount),
        withdraw_paused
      )
      .accounts({
        payer: values.payerAdmin.publicKey, bridgeConfig: values.bridgeConfigPDA, supportedChainConfig: supportedChainPda, tokenConfig: tokenConfigPda
      })
      .signers([values.payerAdmin])
      .rpc({ skipPreflight: false });

    const tokenConfig = await program.account.tokenConfig.fetch(tokenConfigPda);
    const supportedChain = await program.account.supportedChainConfig.fetch(supportedChainPda);
    console.log(`supportedChain is ${JSON.stringify(supportedChain)}`);

    console.log(`tokenConfig is ${JSON.stringify(tokenConfig)}`);
    expect(tokenConfig.chainId.toString()).to.equal(supportedChain.chainId.toString());
    expect(tokenConfig.tokenFeePercentage.toString()).to.equal(token_fee_percentages.toString());
    expect(tokenConfig.tokenMinAmount.toString()).to.equal(token_min_amount.toString());
    expect(tokenConfig.withdrawPaused.toString()).to.equal(withdraw_paused.toString());
  });



});
