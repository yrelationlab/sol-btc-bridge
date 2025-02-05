
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { Ed25519Program, Keypair, PublicKey, sendAndConfirmTransaction, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from "@solana/web3.js";
import { getAccount, NATIVE_MINT } from "@solana/spl-token";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Schema } from "borsh";

import { Bridge } from "../../target/types/bridge";
import { BaseMsg } from "./baseMsg";

export class UpdateTokenPriceMsg extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    chainId: number;
    tokenId: number;
    tokenPrice: anchor.BN;

    static schema: Schema = new Map([
        [UpdateTokenPriceMsg,
            {
                kind: 'struct',
                fields: [
                    ['messageType', "u8"],
                    ['version', "u8"],
                    ["nonce", "u64"],
                    ['chainId', "u8"],
                    ['tokenId', "u8"],
                    ["tokenPrice", "u64"],
                ]
            }],
    ]);

    constructor(obj: { messageType: number, version: number, nonce: anchor.BN, chainId: number, tokenId: number, tokenPrice: anchor.BN }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        this.chainId = obj.chainId;
        this.tokenId = obj.tokenId;
        this.tokenPrice = obj.tokenPrice;
    }
}


type UpdateTokenPriceMsgTxnDetails = {
    signatures: {
        data: {
            encoded: Uint8Array;
            signature: Uint8Array;
        };
        publicKey: anchor.web3.PublicKey;
    }[],
    msg: UpdateTokenPriceMsg;
    chainID: number;
    numberOfSignatures: number;
    payer: PublicKey;
    bridgeConfigPDA: PublicKey;
    noncePdaUpdateTokenPrice: PublicKey;
    submitterPda: PublicKey;
    submitter: PublicKey;
    committeePdas: PublicKey[];
    tokenConfigPdas: PublicKey;
};

export class UpdateTokenPriceMsgTxn {
    constructor(private readonly programAPI: Program<Bridge>) { }

    async createTx({
        signatures,
        msg,
        chainID,
        numberOfSignatures,
        payer,
        bridgeConfigPDA,
        noncePdaUpdateTokenPrice,
        submitterPda,
        submitter,
        committeePdas,
        tokenConfigPdas,
    }: UpdateTokenPriceMsgTxnDetails) {
        console.log(`signature is ${signatures.length}, bridgeConfigPDA is ${bridgeConfigPDA}, chainID is ${chainID}`)

        // 我希望用signatures循环创建ixEd25519Program
        const ixEd25519Programs = signatures.map(signature =>
            Ed25519Program.createInstructionWithPublicKey({
                publicKey: signature.publicKey.toBytes(),
                signature: signature.data.signature,
                message: signature.data.encoded,
            })
        );

        return this.programAPI.methods
            .updateTokenPriceWithSignatures(
                chainID,
                numberOfSignatures,
                msg as any,
            )
            .accounts({
                payer: payer,
                bridgeConfig: bridgeConfigPDA,
                nonce: noncePdaUpdateTokenPrice,
                submitterAccount: submitterPda,
                submitter: submitter,
                instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
            })
            .remainingAccounts([
                ...committeePdas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
                , {
                    pubkey: tokenConfigPdas,
                    isSigner: false,
                    isWritable: true,
                },
            ])
            .preInstructions(
                [...ixEd25519Programs]
            )
            .transaction();
    }
}
