import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {Schema, serialize, deserialize} from "borsh";

export interface TestValues {
    payerAdmin: Keypair;
    feeRecipient: PublicKey;
    chainId: anchor.BN;
    supportedTokensKeypairs: Keypair[];
    supportedTokensIndex: anchor.BN[];
    prices: anchor.BN[];
    supportedChainsBuffer: Buffer;
    tokenFeePercentages: anchor.BN[];
    decimals: anchor.BN[];
    tokenMinAmounts: anchor.BN[];
    bridgeConfigPDA: PublicKey;
    bridgePDA: PublicKey;
    sbtcMint: PublicKey;
    tokenConfigPdas: PublicKey[];
    supportedChainsPdas: PublicKey[];
    committeeKeypairs: Keypair[];
    stakes: anchor.BN[];
    minStake: anchor.BN;
    submitter: Keypair;
    submitterPda: PublicKey;
    committeePdas: PublicKey[];
    noncePdaUpdateTokenPrice: PublicKey;
    nonceMintSbtc: PublicKey;
    supportedChains: anchor.BN[]
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

  export enum MessageIds {
    TokenTransfer = 0,
    Blocklist = 1,
    EmergencyOp = 2,
    UpdateBridgeLimit = 3,
    UpdateTokenPrice = 4,
    Upgrade = 5,
    AddEvmTokens = 7,
    UpdateChainId = 8,
    MintSbtc = 9
  }

