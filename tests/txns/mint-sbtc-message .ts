import { BaseMsg } from "./base-msg";
import * as anchor from "@coral-xyz/anchor"; // Anchor 的 BN
import { Schema } from "borsh";

export class MintSbtcMessage extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    sourceChainId: number;
    sourceTokenId: number;
    fromAddressLength: number;
    fromAddress: Uint8Array;
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
                    ["fromAddressLength", "u8"], // 地址长度
                    ["fromAddress", ["u8"]], // 动态字节数组
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
        toAddress: Uint8Array,
        amount: anchor.BN
    }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        this.sourceChainId = obj.sourceChainId;
        this.sourceTokenId = obj.sourceTokenId;
        this.fromAddressLength = obj.fromAddress.length; // 计算长度
        this.fromAddress = obj.fromAddress;
        this.toAddress = obj.toAddress;
        this.amount = obj.amount;
    }
}
