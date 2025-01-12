import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const DECIMALS9 = new anchor.BN(1_000_000_000);
export const FEE_DENOMINATOR = new anchor.BN(1000000);
export const GLOBAL_CONFIG = Buffer.from("GLOBAL_CONFIG");
export const TOKEN_CONFIG = Buffer.from("TOKEN_CONFIG");
export const SUPPORTED_CHAINS_CONFIG = Buffer.from("SUPPORTED_CHAINS_CONFIG");
export const BRIDGE_COMMITTEE_SUBMITTER_CONFIG = Buffer.from("COMMITTEE_SUBMITTER_CONFIG")
export const BRIDGE_COMMITTEE_CONFIG = Buffer.from("COMMITTEE_CONFIG");

export function getTokenConfigPda(keypair: anchor.web3.Keypair, curChainId: anchor.BN): anchor.web3.PublicKey {
    return PublicKey.findProgramAddressSync(
        [TOKEN_CONFIG, keypair.publicKey.toBuffer(), curChainId.toBuffer()],
        anchor.workspace.bridge.programId
    )[0];
}

export function getSubmitterPda(submitter: anchor.web3.Keypair) : anchor.web3.PublicKey{
  
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

export function getSupportChainPda(chainId: number): anchor.web3.PublicKey {
    return PublicKey.findProgramAddressSync(
        [SUPPORTED_CHAINS_CONFIG, new anchor.BN(chainId).toBuffer()],
        anchor.workspace.bridge.programId
    )[0];
}