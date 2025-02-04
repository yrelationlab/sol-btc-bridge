
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

    constructor(obj: { messageType: number, version: number, nonce: anchor.BN, chainId: number, tokenId:number, tokenPrice: anchor.BN }) {
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
    serialized: Uint8Array;
    signature: Uint8Array;
    signerPublicKey: PublicKey;
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
    addixEd25519Program: boolean;
};

export class UpdateTokenPriceMsgTxn {
    constructor(private readonly programAPI: Program<Bridge>) { }

    async createTx({
        serialized,
        signature,
        signerPublicKey,
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
        addixEd25519Program,
    }: UpdateTokenPriceMsgTxnDetails) {
        console.log(`signature is ${signature.length}, bridgeConfigPDA is ${bridgeConfigPDA}, chainID is ${chainID}`)
        let ixEd25519Program = Ed25519Program.createInstructionWithPublicKey({
            publicKey: signerPublicKey.toBytes(),
            signature,
            message: serialized,
        });
        if (!addixEd25519Program) {
            ixEd25519Program = null;
        }
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
                [ixEd25519Program].filter(Boolean)
            )
            .transaction();
    }
}
