import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export interface TestValues {
    payerAdmin: Keypair;
    feeRecipient: PublicKey;
    chainId: anchor.BN;
    supportedTokensKeypairs: Keypair[];
    supportedTokensIndex: number[];
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
    noncePdaUpdateTokenPrice: PublicKey;
    supportedChains: number[]
}


export type TestValuesDefaults = {
    [K in keyof TestValues]+?: TestValues[K];
};

// Define the structure of the Message object
export interface MessageType {
    message_type: number; // Corresponds to u8 in Rust
    version: number;      // Corresponds to u8 in Rust
    nonce: anchor.BN;     // Corresponds to u64 in Rust
    chain_id: number;     // Corresponds to u8 in Rust
    payload: Uint8Array;  // Corresponds to Vec<u8> in Rust
  }

  export enum Operation {
    TokenTransfer = 0,
    Blocklist = 1,
    EmergencyOp = 2,
    UpdateBridgeLimit = 3,
    UpdateTokenPrice = 4,
    Upgrade = 5,
    AddEvmTokens = 7,
    UpdateChainId = 8,
  }
  