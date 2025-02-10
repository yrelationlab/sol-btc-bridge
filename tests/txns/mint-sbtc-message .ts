import { BaseMsg } from "./base-msg";
import * as anchor from "@coral-xyz/anchor"; // Anchor 的 BN
import { Schema } from "borsh";

export class MintSbtcMessage extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    sourceChainId: number;
    sourceTokenId: number;
    fromAddress: Uint8Array;
    toChainId: number;
    toAddress: Uint8Array;
    amount: anchor.BN;

    static schema: Schema = new Map([
        [MintSbtcMessage,
            {
                kind: "struct",
                fields: [
                    ["messageType", "u8"],
                    ["version", "u8"],
                    ["nonce", "u64"],
                    ["sourceChainId", "u8"],
                    ["sourceTokenId", "u8"],
                    ["fromAddress", ["u8"]], // 固定 32 字节
                    ["toChainId", "u8"],
                    ["toAddress", ["u8", 32]], // 固定 32 字节
                    ["amount", "u64"]
                ]
            }
        ]
    ]);

    constructor(obj: {
        messageType: number,
        version: number,
        nonce: anchor.BN,
        sourceChainId: number,
        sourceTokenId: number,
        fromAddress: Uint8Array,
        toChainId: number,
        toAddress: Uint8Array,
        amount: anchor.BN
    }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        this.toChainId = obj.toChainId;
        console.log(`toChainId ${this.toChainId}`);
        this.sourceChainId = obj.sourceChainId;
        this.sourceTokenId = obj.sourceTokenId;
        this.fromAddress = obj.fromAddress;
        this.toAddress = obj.toAddress;
        this.amount = obj.amount;
    }
}
