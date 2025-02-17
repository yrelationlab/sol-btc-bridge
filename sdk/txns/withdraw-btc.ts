import { BaseMsg } from "./base-msg";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { Schema } from "borsh";

import { Bridge } from "../../target/types/bridge";

export class WithdrawBtcMessage extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    toChainId: number;
    toTokenId: number;
    toAddress: Uint8Array;
    chainId: number;
    fromAddress: Uint8Array;
    amount: anchor.BN;

    static schema: Schema = new Map([
        [WithdrawBtcMessage,
            {
                kind: "struct",
                fields: [
                    ["messageType", "u8"],
                    ["version", "u8"],
                    ["nonce", "u64"],
                    ["toChainId", "u8"],
                    ["toTokenId", "u8"],
                    ["toAddress", ["u8"]], // 动态长度
                    ["chainId", "u8"],
                    ["fromAddress", ["u8", 32]], // 固定 32 字节
                    ["amount", "u64"]
                ]
            }
        ]
    ]);

    constructor(obj: {
        messageType: number,
        version: number,
        nonce: anchor.BN,
        toChainId: number,
        toTokenId: number,
        toAddress: Uint8Array,
        chainId: number,
        fromAddress: Uint8Array,
        amount: anchor.BN
    }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        this.toChainId = obj.toChainId;
        this.toTokenId = obj.toTokenId;
        this.toAddress = obj.toAddress;
        this.chainId = obj.chainId;
        this.fromAddress = obj.fromAddress;
        this.amount = obj.amount;
    }
}

type WithdrawBtcMessageTxnDetails = {
    msg: WithdrawBtcMessage;
    bridgeConfigPda: PublicKey;
    nonceWithdrawBtc: PublicKey;
    committeePdas: PublicKey[];
    tokenConfigPda: PublicKey;
    supportChainPda: PublicKey;
    sbtcMint: PublicKey;
    userSbtcAta: PublicKey;
    user: PublicKey;
    feeRecipientSbtcAta: PublicKey;
    feeRecipient: PublicKey;
};

export class WithdrawBtcMessageTxn {
    constructor(private readonly program: Program<Bridge>) { }

    async createTx({
        msg,
        bridgeConfigPda,
        nonceWithdrawBtc,
        committeePdas,
        tokenConfigPda,
        supportChainPda,
        sbtcMint,
        userSbtcAta,
        user,
        feeRecipientSbtcAta,
        feeRecipient
    }: WithdrawBtcMessageTxnDetails) {

        return this.program.methods
            .withdrawBtc(msg as any)
            .accounts({
                user: user,
                bridgeConfig: bridgeConfigPda,
                supportedChainConfig: supportChainPda,
                tokenConfig: tokenConfigPda,
                // sbtcMint: values.sbtcMint,
                // userSbtcAta: values.userSbtcAta,
                // user: values.user.publicKey,
                // feeRecipientSbtcAta: values.feeRecipientSbtcAta,
                // feeRecipient: values.feeRecipient,
                nonce: nonceWithdrawBtc,
            })
            .remainingAccounts(
                committeePdas.map(pubkey => ({
                    pubkey,
                    isSigner: false,
                    isWritable: true,
                })).concat([{
                    pubkey: sbtcMint,
                    isSigner: false,
                    isWritable: true,
                }, {
                    pubkey: userSbtcAta,
                    isSigner: false,
                    isWritable: true,
                }, {
                    pubkey: user,
                    isSigner: false,
                    isWritable: true,
                }, {
                    pubkey: feeRecipientSbtcAta,
                    isSigner: false,
                    isWritable: true,
                }, {
                    pubkey: feeRecipient,
                    isSigner: false,
                    isWritable: true,
                }])
            )
            .preInstructions([
                ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 }),
            ])
            .transaction();
    }
}