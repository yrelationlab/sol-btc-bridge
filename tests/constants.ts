import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const MSG_VERSION = 1;
export const DECIMALS9 = new anchor.BN(1_000_000_000);
export const FEE_DENOMINATOR = new anchor.BN(1000000);
export const GLOBAL_CONFIG = Buffer.from("GLOBAL_CONFIG");
export const BRIDGE_SBTC_AUTH = Buffer.from("BRIDGE_SBTC_AUTH");
export const SBTC_MINT = Buffer.from("SBTC_MINT");

export const NONCE_CONFIG = Buffer.from("NONCE_CONFIG");
export const TOKEN_CONFIG = Buffer.from("TOKEN_CONFIG");
export const SUPPORTED_CHAINS_CONFIG = Buffer.from("SUPPORTED_CHAINS_CONFIG");
export const BRIDGE_COMMITTEE_SUBMITTER_CONFIG = Buffer.from("COMMITTEE_SUBMITTER_CONFIG")
export const BRIDGE_COMMITTEE_CONFIG = Buffer.from("COMMITTEE_CONFIG");

// Function to convert a u8 number to bytes (big-endian representation)
// function toU8Bytes(tokenId: number): Buffer {
//     if (tokenId < 0 || tokenId > 255) {
//         throw new Error("tokenId must be a valid u8 (0-255)");
//     }
//     return Buffer.from([tokenId]); // Create a single-byte buffer
// }

export function getTokenConfigPda(chainId: number, tokenId: number): anchor.web3.PublicKey {
    return PublicKey.findProgramAddressSync(
        [TOKEN_CONFIG, new anchor.BN(chainId).toArrayLike(Buffer, 'be', 1), new anchor.BN(tokenId).toArrayLike(Buffer, 'be', 1)],
        anchor.workspace.bridge.programId
    )[0];
}

export function getSubmitterPda(submitter: anchor.web3.Keypair): anchor.web3.PublicKey {

    console.log(`submitter is ${submitter.publicKey.toString()}`)
    return PublicKey.findProgramAddressSync(
        [BRIDGE_COMMITTEE_SUBMITTER_CONFIG, submitter.publicKey.toBuffer()],
        anchor.workspace.bridge.programId
    )[0];
}

export function getCommitteePda(committeeAddress: anchor.web3.Keypair): anchor.web3.PublicKey {
    return PublicKey.findProgramAddressSync(
        [BRIDGE_COMMITTEE_CONFIG, committeeAddress.publicKey.toBuffer()],
        anchor.workspace.bridge.programId
    )[0];
}

export function getSupportChainPda(chainId: anchor.BN): anchor.web3.PublicKey {
    return PublicKey.findProgramAddressSync(
        [SUPPORTED_CHAINS_CONFIG, chainId.toArrayLike(Buffer, 'be', 1)],
        anchor.workspace.bridge.programId
    )[0];
}