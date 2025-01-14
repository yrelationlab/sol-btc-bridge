
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, createBridgeConfig, createCommitteeConfig, createValues, expectRevert } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
describe("Create Committee config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = createValues();
  });
  it("Creation", async () => {
    const tx = await createCommitteeConfig(program, values);
    console.log(`tx is ${tx}`)

    const submitterAccount = await program.account.submitter.fetch(values.submitterPda);
    console.log(`submitterAccount is ${JSON.stringify(submitterAccount)}`)
    expect(submitterAccount.admin.toString()).to.equal(
      values.submitter.publicKey.toString()
    );
    expect(submitterAccount.isSubmitter).to.be.true;

    for (const [index, committeePda] of values.committeePdas.entries()) {
      const committee = await program.account.committee.fetch(committeePda);
      console.log(`committee is ${JSON.stringify(committee)}`);
      expect(committee.index.toString()).to.equal(index.toString());
      expect(committee.stakeAmount.toString()).to.equal(values.stakes[index].toString());
      expect(committee.isBlocklisted).to.false;
    }
  });
});
