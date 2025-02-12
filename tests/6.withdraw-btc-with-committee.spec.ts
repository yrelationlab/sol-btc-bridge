import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import {
    TestValues,
    createAndSendV0Tx,
    createBridgeConfig,
    createValues,
    expectRevert,
    createCommitteeConfig,
    checkAssociatedTokenAccount,
    airdrop,
    createLookupTable,
    getTxnAddress,
    mintSBtc,
    getBalance,
} from "./init";
import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
    PublicKey,
    SYSVAR_RENT_PUBKEY,
    AddressLookupTableProgram,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    TransactionSignature,
    TransactionConfirmationStatus,
    SignatureStatus,
    AddressLookupTableAccount,
    Signer,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    Ed25519Program,
} from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    getAccount,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { describe, beforeAll, it } from "vitest";
import { expect, assert } from "chai";
import { BRIDGE_SBTC_AUTH, DECIMALS9, FEE_DENOMINATOR, MSG_VERSION } from "./constants";
import { MintSbtcMessage } from "./txns/mint-sbtc-message ";
import { MessageIds } from "./types";
import { BaseMsg } from "./txns/base-msg";
import { WithdrawBtcMessage } from "./txns/withdraw-btc-message";

describe("Withdraw Btc", () => {
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
    });

    it("should process withdrawal correctly", async () => {
        const { mintAmout, txid } = await mintSBtc(values, program, provider, false);
        const withdrawAmount = mintAmout;
        const feePercentage = values.tokenFeePercentages[0];
        const feeAmount = withdrawAmount.mul(new anchor.BN(feePercentage)).div(FEE_DENOMINATOR); // Calculate fee

        const msg = new WithdrawBtcMessage({
            messageType: MessageIds.TokenTransfer,
            version: MSG_VERSION,
            nonce: new anchor.BN(0),
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
                .catch(() => 0)  // 账户不存在时返回0
        ]);
        console.log("User sBTC balance before withdrawal:", userBeforeBalance);
        console.log("Fee Recipient sBTC balance after withdrawal:", feeRecipientBeforeBalance);


        // 生成委员会签名
        const signatures = values.committeeKeypairs.map(kp => ({
            data: msg.createSignature(kp),
            publicKey: kp.publicKey
        }));

        const numberOfSignatures = values.committeeKeypairs.length;
        const ed25519Instructions = signatures.map(sig =>
            Ed25519Program.createInstructionWithPublicKey({
                publicKey: sig.publicKey.toBytes(),
                signature: sig.data.signature,
                message: sig.data.encoded,
            })
        );

        const tx = await program.methods
            .withdrawBtcWithSignatures(numberOfSignatures, msg as any)
            .accounts({
                bridgeConfig: values.bridgeConfigPDA,
                supportedChainConfig: values.supportedChainsPdas[0],
                tokenConfig: values.tokenConfigPdas[0],
                nonce: values.nonceWithdrawBtc,
                submitterAccount: values.submitterPda,
                submitter: values.submitter.publicKey,
                userSbtcAta: values.userSbtcAta,
                feeRecipientSbtcAta: values.feeRecipientSbtcAta,
                sbtcMint: values.sbtcMint,
                user: values.user.publicKey,
                feeRecipient: values.feeRecipient,
                instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .remainingAccounts(
                values.committeePdas.map(pubkey => ({
                    pubkey,
                    isSigner: false,
                    isWritable: true,
                }))
            )
            .preInstructions([
                ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 }),
                ...ed25519Instructions
            ])
            .transaction();

        console.log(`tx.instructions[0] is ${JSON.stringify(tx.instructions[0].programId, null, 2)}`);
        console.log(`tx.instructions[1] is ${JSON.stringify(tx.instructions[1].programId, null, 2)}`);

        const LOOKUP_TABLE_ADDRESS = await createLookupTable(values.submitter.publicKey, values.submitter, provider.connection);

        await createAndSendV0Tx([AddressLookupTableProgram.extendLookupTable({
            payer: values.submitter.publicKey,
            authority: values.submitter.publicKey,
            lookupTable: LOOKUP_TABLE_ADDRESS,
            addresses: getTxnAddress(tx),
        })], [values.submitter], provider.connection, null, true);

        const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;
        console.log(`withdrawBtcWithSignatures...start...`);
        await createAndSendV0Tx(tx.instructions, [values.submitter], provider.connection, [lookupTable], false);
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
        expect(userBeforeBalance - userAfterBalance + feeDiff, "should withdraw the correct amount including fee").to.equal(withdrawAmount.toNumber());

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
    }, 700000);
});
