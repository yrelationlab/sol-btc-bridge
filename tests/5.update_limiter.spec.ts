import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
  TestValues,
  createBridgeConfig,
  createValues,
  createCommitteeConfig,
  airdrop,
  updateLimiter,
} from "./init";
import { describe, beforeAll, it } from "vitest";
import { expect } from "chai";

describe("add_or_update_limiter_with_signatures", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeAll(async () => {
    values = await createValues();
    await createBridgeConfig(program, values);
    await createCommitteeConfig(program, values);
    await airdrop(provider.connection, values.submitter.publicKey, 1)
    await airdrop(provider.connection, values.payerAdmin.publicKey, 1)
  }, 100000);

  it("add_or_update_limiter_with_signatures", async () => {
    const { txid, totalLimit } = await updateLimiter(values, program, provider);
    const limiterConfig = await program.account.chainTokenLimiter.fetch(values.limiterPdas[0]);
    console.log(`limiterConfig is ${JSON.stringify(limiterConfig)}`)
    expect(totalLimit.toString()).to.be.eq(limiterConfig.totalLimit.toString());
    expect(limiterConfig.isInitialized).to.be.true;

    {
      // Get transaction from its signature
      const tx = await anchor.getProvider().connection.getTransaction(txid, {
        /** The level of finality desired */
        commitment: "confirmed",
        /** The max transaction version to return in responses. If the requested transaction is a higher version, an error will be returned */
        maxSupportedTransactionVersion: 0
      });

      const eventParser = new anchor.EventParser(program.programId, new anchor.BorshCoder(program.idl));
      const events = eventParser.parseLogs(tx.meta.logMessages);
      for (let event of events) {
        console.log(event);
      }
    }
  }, 700000);
});

