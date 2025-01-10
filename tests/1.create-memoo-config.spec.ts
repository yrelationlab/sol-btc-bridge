
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
  });
});
