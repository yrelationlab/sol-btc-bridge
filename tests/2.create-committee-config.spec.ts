
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, createAndSendV0Tx, createBridgeConfig, createCommitteeConfig, createValues, expectRevert, keypairsToPublicArrays } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import cm8 from "../sdk/.config/cm8.json";
import cm7 from "../sdk/.config/cm7.json";

import { getCommitteePda, getSubmitterPda } from "./constants";

describe("Create Committee config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = await createValues();

  });
  it("create Committee Config and submitter", async () => {
    await createBridgeConfig(program, values);

    const tx = await createCommitteeConfig(program, values);
    console.log(`tx is ${tx}`)

    const submitterAccount = await program.account.submitter.fetch(values.submitterPda);
    console.log(`submitterAccount is ${JSON.stringify(submitterAccount)}`)
    expect(submitterAccount.submitter.toString()).to.equal(
      values.submitter.publicKey.toString()
    );
    expect(submitterAccount.isSubmitter).to.be.true;

    for (const [index, committeePda] of values.committeePdas.entries()) {
      const committee = await program.account.committee.fetch(committeePda);
      console.log(`committee is ${JSON.stringify(committee)}`);
      expect(committee.stakeAmount.toString()).to.equal(values.stakes[index].toString());
      expect(committee.isBlocklisted).to.false;
    }
  });

  it.skip("only create submitter", async () => {
    await program.methods
      .createBridgeCommittee(
        values.chainId,
        [], []
      )
      .accounts({
        bridgeConfig: values.bridgeConfigPDA,
        submitterPda: values.submitterPda,
        submitter: values.submitter.publicKey,
      })
      .remainingAccounts([
        ...values.committeePdas.map((pubkey) => ({
          pubkey,
          isSigner: false,
          isWritable: true,
        })),
      ])
      .rpc({ skipPreflight: false });

    const submitterAccount = await program.account.submitter.fetch(values.submitterPda);
    console.log(`submitterAccount is ${JSON.stringify(submitterAccount)}`)
    expect(submitterAccount.submitter.toString()).to.equal(
      values.submitter.publicKey.toString()
    );
    expect(submitterAccount.isSubmitter).to.be.true;
  });

  it("add Committee with createBridgeCommittee", async () => {
    const committeeKeypairs = [
      Keypair.fromSecretKey(new Uint8Array(cm8)),
    ];
    committeeKeypairs.forEach((keypair, index) => {
      console.log(`PublicKey of committeeKeypair ${index} is ${keypair.publicKey.toBase58()}`);
    });
    const committeePdas = committeeKeypairs.map((committeeAddress) => {
      return getCommitteePda(committeeAddress);
    });
    console.log(`committeePdas is ${JSON.stringify(committeePdas)}`);

    const stakes = [9000,];
    await program.methods
      .createBridgeCommittee(
        values.chainId,
        keypairsToPublicArrays(committeeKeypairs),
        stakes,
      )
      .accounts({
        bridgeConfig: values.bridgeConfigPDA,
        submitterPda: values.submitterPda,
        submitter: values.submitter.publicKey,
      })
      .remainingAccounts([
        ...committeePdas.map((pubkey) => ({
          pubkey,
          isSigner: false,
          isWritable: true,
        })),
      ])
      .rpc({ skipPreflight: false });

    const submitterAccount = await program.account.submitter.fetch(values.submitterPda);
    console.log(`submitterAccount is ${JSON.stringify(submitterAccount)}`)
    expect(submitterAccount.submitter.toString()).to.equal(
      values.submitter.publicKey.toString()
    );
    expect(submitterAccount.isSubmitter).to.be.true;

    for (const [index, committeePda] of committeePdas.entries()) {
      const committee = await program.account.committee.fetch(committeePda);
      console.log(`committee is ${JSON.stringify(committee)}`);
      expect(committee.stakeAmount.toString()).to.equal(stakes[index].toString());
      expect(committee.isBlocklisted).to.false;
    }
  });


  it.skip("add Committee with add_or_update_committee", async () => {
    await createBridgeConfig(program, values);
    const committeeKeypair = Keypair.fromSecretKey(new Uint8Array(cm8));
    const committeePda = getCommitteePda(committeeKeypair);
    console.log(`committeePda is ${JSON.stringify(committeePda)}`);
    const stakes = 9000;
    const is_blocklisted = false;
    await program.methods
      .addOrUpdateCommittee(
        values.chainId,
        committeeKeypair.publicKey,
        stakes,
        is_blocklisted,
      )
      .accounts({
        bridgeConfig: values.bridgeConfigPDA,
        committeeConfig: committeePda
      })
      .rpc({ skipPreflight: false });

    const committee = await program.account.committee.fetch(committeePda);
    console.log(`committee is ${JSON.stringify(committee)}`);
    expect(committee.stakeAmount.toString()).to.equal(stakes.toString());
    expect(committee.isBlocklisted).to.false;
  });

  it.skip("add Committee batch with add_or_update_committee", async () => {
    await createBridgeConfig(program, values);

    const txns = []
    const pdas = []
    const stakes = 9000;

    {
      const committeeKeypair = Keypair.fromSecretKey(new Uint8Array(cm8));
      const committeePda = getCommitteePda(committeeKeypair);
      console.log(`committeePda is ${JSON.stringify(committeePda)}`);
      const is_blocklisted = false;
      const tx = await program.methods
        .addOrUpdateCommittee(
          values.chainId,
          committeeKeypair.publicKey,
          stakes,
          is_blocklisted,
        )
        .accounts({
          bridgeConfig: values.bridgeConfigPDA,
          committeeConfig: committeePda
        })
        .transaction();
      txns.push(tx);
      pdas.push(committeePda);
    }
    {
      const committeeKeypair = Keypair.fromSecretKey(new Uint8Array(cm7));
      const committeePda = getCommitteePda(committeeKeypair);
      console.log(`committeePda2 is ${JSON.stringify(committeePda)}`);
      const is_blocklisted = false;
      const tx = await program.methods
        .addOrUpdateCommittee(
          values.chainId,
          committeeKeypair.publicKey,
          stakes,
          is_blocklisted,
        )
        .accounts({
          bridgeConfig: values.bridgeConfigPDA,
          committeeConfig: committeePda
        })
        .transaction();
      txns.push(tx);
      pdas.push(committeePda);
    }

    console.log("-------------------")
    console.log(txns[0]);  // 打印 txs[0] 以检查它的结构
    console.log(txns[0].instructions);  // 检查 instructions 是否存在且是数组

    const txid = await createAndSendV0Tx([...txns[0].instructions, ...txns[1].instructions], [values.payerAdmin], provider.connection, [], false);
    console.log(`txid is ${JSON.stringify(txid)}`);
    const committee = await program.account.committee.fetch(pdas[0]);
    console.log(`committee is ${JSON.stringify(committee)}`);
    expect(committee.stakeAmount.toString()).to.equal(stakes.toString());
    expect(committee.isBlocklisted).to.false;
  }, 100000);

  
  it.only("add submitter with add_or_update_submitter", async () => {
    await createBridgeConfig(program, values);
    const submitter = Keypair.fromSecretKey(new Uint8Array(cm8));
    const submitterPda = getSubmitterPda(submitter);
    console.log(`submitterPda is ${JSON.stringify(submitterPda)}`);
    const stakes = 9000;
    const is_submitter = true;
    await program.methods
      .addOrUpdateSubmitter(
        values.chainId,
        is_submitter,
      )
      .accounts({
        bridgeConfig: values.bridgeConfigPDA,
        submitterPda: submitterPda,
        submitter: submitter.publicKey
      })
      .rpc({ skipPreflight: false });

    const submitterConfig = await program.account.submitter.fetch(submitterPda);
    console.log(`submitterConfig is ${JSON.stringify(submitterConfig)}`);
    expect(submitterConfig.isSubmitter).to.true;
  });
});
