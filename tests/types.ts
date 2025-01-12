import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export interface TestValues {
    payerAdmin: Keypair;
    feeRecipient: PublicKey;
    chainId: anchor.BN;
    supportedTokensKeypairs: Keypair[];
    prices: anchor.BN[];
    supportedChainsBuffer: Buffer;
    tokenFeePercentages: anchor.BN[];
    decimals: anchor.BN[];
    tokenMinAmounts: anchor.BN[];
    bridgeConfigPDA: PublicKey;
    tokenConfigPdas: PublicKey[];
    supportedChainsPdas: PublicKey[];
    committeeKeypairs: Keypair[];
    stakes: number[];
    minStake: number;
    submitter: Keypair;
    submitterPda: PublicKey;
    committeePdas: PublicKey[];
}


export type TestValuesDefaults = {
    [K in keyof TestValues]+?: TestValues[K];
};