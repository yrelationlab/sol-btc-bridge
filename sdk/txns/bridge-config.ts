import { BaseMsg } from "./base-msg";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { Schema } from "borsh";

import { Bridge } from "../../target/types/bridge";


type CreateBridgeConfigTxnDetails = {
    chainId: number;
    payerAdmin: PublicKey;
    chainIds: Buffer;
    tokenIds: Buffer;
    tokenFeePercentages: anchor.BN[];
    tokenMinAmounts: anchor.BN[];
    bridgeConfigPda: PublicKey;
    sbtcMint: PublicKey;
    feeRecipient: PublicKey;
    tokenConfigPdas: {
        pubkey: anchor.web3.PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[];
    supportedChainsPdas: {
        pubkey: anchor.web3.PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[];
};

export class CreateBridgeConfigMessageTxn {
    constructor(private readonly program: Program<Bridge>) { }

    async createTx({
        chainId,
        payerAdmin,
        chainIds,
        tokenIds,
        tokenFeePercentages,
        tokenMinAmounts,
        bridgeConfigPda,
        sbtcMint,
        feeRecipient,
        tokenConfigPdas,
        supportedChainsPdas
    }: CreateBridgeConfigTxnDetails) {

        return this.program.methods
            .createBridgeConfig(
                chainId,
                payerAdmin,
                feeRecipient,
                tokenIds,
                chainIds,
                tokenFeePercentages,
                tokenMinAmounts
            )
            .accounts({
                payer: payerAdmin, bridgeConfig: bridgeConfigPda, sbtcMint: sbtcMint,
            })
            .remainingAccounts([
                ...tokenConfigPdas,
                ...supportedChainsPdas
            ])
            .transaction();
    }
}