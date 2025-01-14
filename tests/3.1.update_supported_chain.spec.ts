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
import { describe, beforeAll, it } from "vitest";
import { expect, assert } from "chai";
describe("Update Token Price", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeAll(async () => {
    values = createValues();
    await createBridgeConfig(program, values);
  });

  it("Update supported chain with admin", async () => {
    const chainConfigData = await program.account.supportedChainConfig.fetch(
      values.supportedChainsPdas[0]
    );
    console.log("chainConfigData: ", chainConfigData);
    const tx = await program.methods
      .updateSupportedChain(values.supportedChains[0], false)
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
  it("Update supported chain without admin", async () => {
    const chainConfigData = await program.account.supportedChainConfig.fetch(
      values.supportedChainsPdas[0]
    );
    console.log("chainConfigData: ", chainConfigData);
    const tx = await program.methods
      .updateSupportedChain(values.supportedChains[0], false)
      .accounts({
        chainConfig: values.supportedChainsPdas[0],
        admin: values.committeeKeypairs[0].publicKey,
      })
      .transaction();
    console.log(
      "chainConfigData is supported before tx:",
      chainConfigData.supported
    );
    try {
      await createAndSendV0Tx(
        tx.instructions,
        values.committeeKeypairs[0],
        provider.connection
      );
    } catch (error) {
      console.log("error: ", error);
      assert.ok(error.toString());
    }
  });
});
