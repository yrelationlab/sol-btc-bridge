import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
  TestValues,
  createBridgeConfig,
  createValues,
  createCommitteeConfig,
  airdrop,
  mintSBtc,
  updateLimiter,
  currentHourTotal,
} from "./init";
import {
  getAccount,
} from "@solana/spl-token";
import { describe, beforeAll, it } from "vitest";
import { expect, assert } from "chai";

describe("Mint sbtc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  let totalLimit: anchor.BN;
  beforeAll(async () => {
    values = await createValues();
    await createBridgeConfig(program, values);
    await createCommitteeConfig(program, values);
    await airdrop(provider.connection, values.submitter.publicKey, 1)
    await airdrop(provider.connection, values.payerAdmin.publicKey, 1)
    totalLimit = (await updateLimiter(values, program, provider)).totalLimit;
    console.log("totalLimit:", totalLimit.toString(10));
  }, 100000);

  it("mint sbtc with committee", async () => {

    let beforeBalance = 0;
    try {
      const beforeAccountInfo = await getAccount(
        provider.connection,
        values.userSbtcAta
      );
      beforeBalance = Number(beforeAccountInfo.amount);
    } catch (err) {
      console.log("No existing user ATA info, assume zero balance:", err);
      beforeBalance = 0;
    }
    console.log(`User sBTC balance before mint: ${beforeBalance}`);
    const { mintAmout, txid } = await mintSBtc(values, program, provider);
    let afterBalance = 0;
    try {
      const afterAccountInfo = await getAccount(
        provider.connection,
        values.userSbtcAta
      );
      afterBalance = Number(afterAccountInfo.amount);
    } catch (err) {
      console.error("Failed to get user ATA after mint:", err);
      afterBalance = 0;
    }
    console.log(`User sBTC balance after mint: ${afterBalance}`);
    expect(afterBalance, "user sBTC balance must increase").to.be.greaterThan(
      beforeBalance
    );
    expect(afterBalance - beforeBalance, "should minted 1000").to.equal(mintAmout.toNumber());

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
        // **转换 ETH 地址**
        // const fromEthAddress = "0x" + event.data.fromAddress.toString("hex");
        // const toSolAddress = new PublicKey(event.data.toAddress).toBase58();
        // console.log("ETH Address:", fromEthAddress);
        // console.log("Solana Address:", toSolAddress);
      }
    }

    const limiterConfig = await program.account.chainTokenLimiter.fetch(values.limiterPdas[0]);
    console.log(`limiterConfig is ${JSON.stringify(limiterConfig)}`)
    expect(totalLimit.toString()).to.be.eq(limiterConfig.totalLimit.toString());
    expect(limiterConfig.isInitialized).to.be.true;
    const val = currentHourTotal(limiterConfig);
    console.log(`val.total is ${val.total}, totalLimit is ${totalLimit}`)
    expect(val.total.toString(10)).to.be.eq(totalLimit.toString(10))

    try {
      // limit exceed
      await mintSBtc(values, program, provider, new anchor.BN(1));
    } catch (error) {
      assert.ok(
        error
          .toString()
          .includes(
            'TransferLimitExceeded'
          )
      );
    }
  }, 700000);
});

