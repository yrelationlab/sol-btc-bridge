import { BaseMsg } from "./base-msg";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ComputeBudgetProgram, Ed25519Program, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { Schema } from "borsh";

import { Bridge } from "../../target/types/bridge";

export class MintSbtcMessage extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    sourceChainId: number;
    sourceTokenId: number;
    fromAddress: Uint8Array;
    toChainId: number;
    toAddress: Uint8Array;
    amount: anchor.BN;

    static schema: Schema = new Map([
        [MintSbtcMessage,
            {
                kind: "struct",
                fields: [
                    ["messageType", "u8"],
                    ["version", "u8"],
                    ["nonce", "u64"],
                    ["sourceChainId", "u8"],
                    ["sourceTokenId", "u8"],
                    ["fromAddress", ["u8"]],
                    ["toChainId", "u8"],
                    ["toAddress", ["u8", 32]], // 固定 32 字节
                    ["amount", "u64"]
                ]
            }
        ]
    ]);

    constructor(obj: {
        messageType: number,
        version: number,
        nonce: anchor.BN,
        sourceChainId: number,
        sourceTokenId: number,
        fromAddress: Uint8Array,
        toChainId: number,
        toAddress: Uint8Array,
        amount: anchor.BN
    }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        console.log(`nonce ${this.nonce}`);
        this.toChainId = obj.toChainId;
        console.log(`toChainId ${this.toChainId}`);
        this.sourceChainId = obj.sourceChainId;
        this.sourceTokenId = obj.sourceTokenId;
        this.fromAddress = obj.fromAddress;
        this.toAddress = obj.toAddress;
        this.amount = obj.amount;
    }
}

type MintSbtcMessageTxnDetails = {
    signatures: {
        data: {
            encoded: Uint8Array;
            signature: Uint8Array;
        };
        publicKey: anchor.web3.PublicKey;
    }[],
    msg: MintSbtcMessage;
    chainID: number;
    numberOfSignatures: number;
    bridgeConfigPda: PublicKey;
    nonceMintSbtc: PublicKey;
    submitterPda: PublicKey;
    submitter: PublicKey;
    committeePdas: PublicKey[];
    tokenConfigPda: PublicKey;
    supportChainPda: PublicKey;
    limiterPda: PublicKey;
    sbtcMint: PublicKey;
    userSbtcAta: PublicKey;
    user: PublicKey;
};

export class MintSbtcMessageTxn {
    constructor(private readonly program: Program<Bridge>) { }

    async createTx({
        signatures,
        msg,
        chainID,
        numberOfSignatures,
        submitter,
        submitterPda,
        bridgeConfigPda,
        nonceMintSbtc,
        committeePdas,
        tokenConfigPda,
        supportChainPda,
        limiterPda,
        sbtcMint,
        userSbtcAta,
        user
    }: MintSbtcMessageTxnDetails) {
        console.log(`signature is ${signatures.length}, bridgeConfigPda is ${bridgeConfigPda}, chainID is ${chainID}`)

        const ixEd25519Programs = signatures.map(signature =>
            Ed25519Program.createInstructionWithPublicKey({
                publicKey: signature.publicKey.toBytes(),
                signature: signature.data.signature,
                message: signature.data.encoded,
            })
        );

        return this.program.methods
            .mintSbtcWithSignatures(numberOfSignatures, msg as any)
            .accounts({
                bridgeConfig: bridgeConfigPda,
                supportedChainConfig: supportChainPda,
                tokenConfig: tokenConfigPda,
                nonce: nonceMintSbtc,
                submitterAccount: submitterPda,
                submitter: submitter,
                limiter: limiterPda,
                // userSbtcAta: values.userSbtcAta,
                // user: values.user.publicKey,
                // sbtcMint: values.sbtcMint,
                instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
            })
            .remainingAccounts([
                ...committeePdas.map((pubkey) => ({
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
                }]),
            ]).preInstructions(
                [ComputeBudgetProgram.setComputeUnitLimit({ units: 10000000 }), ...ixEd25519Programs]
            ).transaction();
    }
}