
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { ComputeBudgetProgram, Ed25519Program, Keypair, PublicKey, sendAndConfirmTransaction, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from "@solana/web3.js";
import { getAccount, NATIVE_MINT } from "@solana/spl-token";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Schema } from "borsh";

import { Bridge } from "../../target/types/bridge";
import { BaseMsg } from "./base-msg";

export class UpdateLimiterMsg extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    chainId: number;
    targetChainId: number;
    tokenId: number;
    totalLimit: anchor.BN;

    static schema: Schema = new Map([
        [UpdateLimiterMsg,
            {
                kind: 'struct',
                fields: [
                    ['messageType', "u8"],
                    ['version', "u8"],
                    ["nonce", "u64"],
                    ['chainId', "u8"],
                    ['targetChainId', "u8"],
                    ['tokenId', "u8"],
                    ["totalLimit", "u64"],
                ]
            }],
    ]);

    constructor(obj: {
        targetChainId: number;
        tokenId: number;
        totalLimit: anchor.BN; messageType: number, version: number, nonce: anchor.BN, chainId: number
    }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        this.chainId = obj.chainId;
        this.targetChainId = obj.targetChainId;
        this.tokenId = obj.tokenId;
        this.totalLimit = obj.totalLimit;
    }
}


type UpdateLimiterMsgTxnDetails = {
    signatures: {
        data: {
            encoded: Uint8Array;
            signature: Uint8Array;
        };
        publicKey: anchor.web3.PublicKey;
    }[],
    msg: UpdateLimiterMsg;
    chainID: number;
    numberOfSignatures: number;
    bridgeConfigPda: PublicKey;
    noncePdaUpdateLimter: PublicKey;
    submitterPda: PublicKey;
    submitter: PublicKey;
    committeePdas: PublicKey[];
    tokenConfigPda: PublicKey;
    supportChainPda: PublicKey;
    limiterPda: PublicKey;
};

export class UpdateLimiterMsgTxn {
    constructor(private readonly programAPI: Program<Bridge>) { }

    async createTx({
        signatures,
        msg,
        chainID,
        numberOfSignatures,
        submitter,
        submitterPda,
        bridgeConfigPda: bridgeConfigPda,
        noncePdaUpdateLimter: noncePdaUpdateLimter,
        committeePdas,
        tokenConfigPda,
        supportChainPda,
        limiterPda: limiterPda,
    }: UpdateLimiterMsgTxnDetails) {
        console.log(`signature is ${signatures.length}, bridgeConfigPDA is ${bridgeConfigPda}, chainID is ${chainID}`)

        const ixEd25519Programs = signatures.map(signature =>
            Ed25519Program.createInstructionWithPublicKey({
                publicKey: signature.publicKey.toBytes(),
                signature: signature.data.signature,
                message: signature.data.encoded,
            })
        );

        return this.programAPI.methods
            .addOrUpdateLimiterWithSignatures(
                numberOfSignatures,
                msg as any,
            )
            .accounts({
                submitter: submitter,
                submitterAccount: submitterPda,
                bridgeConfig: bridgeConfigPda,
                limiter: limiterPda,
                supportedChainConfig:supportChainPda,
                tokenConfig:tokenConfigPda,
                nonce: noncePdaUpdateLimter,
                instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
            })
            .remainingAccounts([
                ...committeePdas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
                , 
                // {
                //     pubkey: tokenConfigPdas,
                //     isSigner: false,
                //     isWritable: true,
                // },
            ])
            .preInstructions(
                [ComputeBudgetProgram.setComputeUnitLimit({ units: 10000000 }), ...ixEd25519Programs]
            )
            .transaction();
    }
}
