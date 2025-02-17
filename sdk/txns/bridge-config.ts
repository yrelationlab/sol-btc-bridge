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

type AddOrUpdateChainMessage = {
    chainId: number;
    payerAdmin: PublicKey;
    supportedChainId: number;
    supported: boolean;
    bridgeConfigPda: PublicKey;
    supportedChainPda: PublicKey;
};

export class AddOrUpdateChainMessageTxn {
    constructor(private readonly program: Program<Bridge>) { }

    async createTx({
        chainId,
        payerAdmin,
        supportedChainId,
        supported,
        bridgeConfigPda,
        supportedChainPda
    }: AddOrUpdateChainMessage) {
        return this.program.methods
            .addOrUpdateChain(
                chainId,
                supportedChainId,
                supported
            )
            .accounts({
                payer: payerAdmin, bridgeConfig: bridgeConfigPda, supportedChainConfig: supportedChainPda,
            })
            .transaction();
    }
}

type AddOrUpdateChainTokenMessage = {
    chainId: number;
    payerAdmin: PublicKey;
    supportedChainId: number;
    tokenId: number,
    tokenFeePercentages: anchor.BN,
    tokenMinAmount: anchor.BN,
    withdrawPaused: boolean,
    bridgeConfigPda: PublicKey;
    supportedChainPda: PublicKey;
    tokenConfigPda: PublicKey;
};

export class AddOrUpdateChainTokenMessageTxn {
    constructor(private readonly program: Program<Bridge>) { }

    async createTx({
        chainId,
        payerAdmin,
        supportedChainId,
        tokenId,
        tokenFeePercentages,
        tokenMinAmount,
        withdrawPaused,
        bridgeConfigPda,
        supportedChainPda,
        tokenConfigPda
    }: AddOrUpdateChainTokenMessage) {
        return this.program.methods
            .addOrUpdateChainToken(
                chainId,
                supportedChainId,
                tokenId,
                tokenFeePercentages,
                tokenMinAmount,
                withdrawPaused
            )
            .accounts({
                payer: payerAdmin, bridgeConfig: bridgeConfigPda, supportedChainConfig: supportedChainPda, tokenConfig: tokenConfigPda
            })
            .transaction();
    }
}