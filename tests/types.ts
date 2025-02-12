import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Schema, serialize, deserialize } from "borsh";



export type TestValuesDefaults = {
  [K in keyof TestValues]+?: TestValues[K];
};

export enum MessageIds {
  TokenTransfer = 0,
  Blocklist = 1,
  EmergencyOp = 2,
  UpdateBridgeLimit = 3,
  UpdateTokenPrice = 4,
  Upgrade = 5,
  AddEvmTokens = 7,
  UpdateChainId = 8,
}

