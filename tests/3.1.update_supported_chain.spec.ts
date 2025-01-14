import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
  TestValues,
  createAndSendV0Tx,
  createBridgeConfig,
  createValues,
  expectRevert,
} from "./init";
import { describe, beforeEach, it } from "vitest";
import { expect } from "chai";
describe("Update Token Price", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = createValues();
  });
  it("Creation", async () => {
    console.log(`values.chainId is ${values.chainId}`);
    console.log(`values.feeRecipient is ${values.feeRecipient}`);
    const tx = await createBridgeConfig(program, values);
    console.log(`tx is ${tx}`);
    const configAccount = await program.account.bridgeConfig.fetch(
      values.bridgeConfigPDA
    );
    console.log(`configAccount is ${JSON.stringify(configAccount)}`);
    expect(configAccount.admin.toString()).to.equal(
      values.payerAdmin.publicKey.toString()
    );
    expect(configAccount.chainId.toString()).to.equal(
      values.chainId.toString()
    );
    expect(configAccount.feeRecipient.toString()).to.equal(
      values.feeRecipient.toString()
    );
  });
  it("Update supported chain with admin", async () => {
    const tx0 = await createBridgeConfig(program, values);
    const chainConfigData = await program.account.supportedChainConfig.fetch(
      values.supportedChainsPdas[0]
    );
    const tx = await program.methods
      .updateSupportedChain(false)
      .accounts({
        chainConfig: values.supportedChainsPdas[0],
        admin: values.payerAdmin.publicKey,
      })
      .transaction();
    console.log(
      "chainConfigData is supported before tx:",
      chainConfigData.supported
    );
    await createAndSendV0Tx(
      tx.instructions,
      values.payerAdmin,
      provider.connection
    );
    const chainConfigData1 = await program.account.supportedChainConfig.fetch(
      values.supportedChainsPdas[0]
    );
    expect(chainConfigData1.supported).to.be.false;
  });
});
