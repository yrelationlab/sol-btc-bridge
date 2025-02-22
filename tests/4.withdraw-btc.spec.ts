import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
    TestValues,
    createAndSendV0Tx,
    createBridgeConfig,
    createValues,
    createCommitteeConfig,
    airdrop,
    mintSBtc,
    updateLimiter,
} from "./init";
import {
    PublicKey,
} from "@solana/web3.js";
import {
    getAccount,
} from "@solana/spl-token";
import { describe, beforeAll, it } from "vitest";
import { expect, assert } from "chai";
import { FEE_DENOMINATOR, MSG_VERSION } from "./constants";
import { MessageIds } from "./types";
import { WithdrawBtcMessage, WithdrawBtcMessageTxn } from "../sdk/txns/withdraw-btc";

describe("Withdraw Btc", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Bridge as Program<Bridge>;
    let values: TestValues;
    let mintAmout: anchor.BN;
    beforeAll(async () => {
        values = await createValues();
        await airdrop(provider.connection, values.submitter.publicKey, 1)
        await airdrop(provider.connection, values.payerAdmin.publicKey, 1)
        await airdrop(provider.connection, values.user.publicKey, 1)

        await createBridgeConfig(program, values);
        await createCommitteeConfig(program, values);
        await updateLimiter(values, program, provider);
        mintAmout = (await mintSBtc(values, program, provider)).mintAmout;
    }, 700000);

    it("should process withdrawal correctly", async () => {
        const withdrawAmount = mintAmout;
        const feePercentage = values.tokenFeePercentages[0];
        const feeAmount = withdrawAmount.mul(new anchor.BN(feePercentage)).div(FEE_DENOMINATOR); // Calculate fee
        await withdrawBtc(values, withdrawAmount, provider, program, feeAmount);
    }, 700000);

    it("should process withdrawal failed, token exceed", async () => {
        const withdrawAmount = mintAmout.add(new anchor.BN(1));
        const feePercentage = values.tokenFeePercentages[0];
        const feeAmount = withdrawAmount.mul(new anchor.BN(feePercentage)).div(FEE_DENOMINATOR); // Calculate fee
        try {
            await withdrawBtc(values, withdrawAmount, provider, program, feeAmount);
        } catch (error) {
            assert.ok(
                error
                    .toString()
                    .includes(
                        'LackTargetMint'
                    )
            );
        }
    }, 700000);
});
async function withdrawBtc(values: TestValues, withdrawAmount: anchor.BN, provider: anchor.AnchorProvider, program: anchor.Program<Bridge>, feeAmount: anchor.BN) {
    const msg = new WithdrawBtcMessage({
        toChainId: values.supportedChains[0],
        toTokenId: values.supportedTokensIndex[0],
        toAddress: values.ethBtcAddress, // BTC地址
        chainId: values.chainId,
        fromAddress: values.user.publicKey.toBuffer(), // 用户地址
        amount: withdrawAmount,
    });

    // 获取初始余额
    const [userBeforeBalance, feeRecipientBeforeBalance] = await Promise.all([
        getAccount(provider.connection, values.userSbtcAta)
            .then(a => Number(a.amount))
            .catch(() => 0), // 账户不存在时返回0
        getAccount(provider.connection, values.feeRecipientSbtcAta)
            .then(a => Number(a.amount))
            .catch(() => 0) // 账户不存在时返回0
    ]);
    console.log("User sBTC balance before withdrawal:", userBeforeBalance);
    console.log("Fee Recipient sBTC balance after withdrawal:", feeRecipientBeforeBalance);

    let tx = await new WithdrawBtcMessageTxn(program).createTx({
        msg,
        bridgeConfigPda: values.bridgeConfigPDA,
        supportChainPda: values.supportedChainsPdas[0],
        tokenConfigPda: values.tokenConfigPdas[0],
        nonceWithdrawBtc: values.nonceWithdrawBtc,

        committeePdas: values.committeePdas,
        sbtcMint: values.sbtcMint,

        userSbtcAta: values.userSbtcAta,
        user: values.user.publicKey,
        feeRecipientSbtcAta: values.feeRecipientSbtcAta,
        feeRecipient: values.feeRecipient
    });

    console.log(`tx.instructions[0] is ${JSON.stringify(tx.instructions[0].programId, null, 2)}`);
    console.log(`tx.instructions[1] is ${JSON.stringify(tx.instructions[1].programId, null, 2)}`);

    // const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);
    // await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
    //     payer: values.submitter.publicKey,
    //     authority: values.submitter.publicKey,
    //     lookupTable: LOOKUP_TABLE_ADDRESS,
    //     addresses: getTxnAddress(tx),
    // })], [values.submitter], provider.connection, null, true);
    // const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
    console.log(`withdrawBtcWithSignatures...start...`);
    // await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
    const txid = await createAndSendV0Tx(tx.instructions, [values.user], provider.connection);

    console.log(`withdrawBtcWithSignatures...end...`);

    const [userAfterBalance, feeRecipientAfterBalance] = await Promise.all([
        getAccount(provider.connection, values.userSbtcAta).then(a => Number(a.amount)),
        getAccount(provider.connection, values.feeRecipientSbtcAta).then(a => Number(a.amount)),
    ]);

    console.log("User sBTC balance after withdrawal:", userAfterBalance);
    console.log("Fee Recipient sBTC balance after withdrawal:", feeRecipientAfterBalance);

    expect(userAfterBalance, "user sBTC balance must decrease").to.be.lessThan(userBeforeBalance);
    const feeDiff = feeRecipientAfterBalance - feeRecipientBeforeBalance;
    expect(feeDiff, "should withdraw the correct amount including fee").to.equal(feeAmount.toNumber());
    expect(userBeforeBalance - userAfterBalance, "should withdraw the correct amount including fee").to.equal(withdrawAmount.toNumber());
    {
        // Event Check
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
            const fromEthAddress = "0x" + event.data.fromAddress.toString("hex");
            const toSolAddress = new PublicKey(event.data.toAddress).toBase58();
            console.log("ETH Address:", fromEthAddress);
            console.log("Solana Address:", toSolAddress);
        }
    }
}

