import { BaseMsg } from "./base-msg";
import * as anchor from "@coral-xyz/anchor"; // Anchor 的 BN
import { Schema } from "borsh";
export class WithdrawBtcMessage extends BaseMsg {
    messageType: number;
    version: number;
    nonce: anchor.BN;
    toChainId: number;
    toTokenId: number;
    toAddress: Uint8Array;
    chainId: number;
    fromAddress: Uint8Array;
    amount: anchor.BN;

    static schema: Schema = new Map([
        [WithdrawBtcMessage,
            {
                kind: "struct",
                fields: [
                    ["messageType", "u8"],
                    ["version", "u8"],
                    ["nonce", "u64"],
                    ["toChainId", "u8"],
                    ["toTokenId", "u8"],
                    ["toAddress", ["u8"]], // 动态长度
                    ["chainId", "u8"],
                    ["fromAddress", ["u8", 32]], // 固定 32 字节
                    ["amount", "u64"]
                ]
            }
        ]
    ]);

    constructor(obj: {
        messageType: number,
        version: number,
        nonce: anchor.BN,
        toChainId: number,
        toTokenId: number,
        toAddress: Uint8Array,
        chainId: number,
        fromAddress: Uint8Array,
        amount: anchor.BN
    }) {
        super();
        this.messageType = obj.messageType;
        this.version = obj.version;
        this.nonce = obj.nonce;
        this.toChainId = obj.toChainId;
        this.toTokenId = obj.toTokenId;
        this.toAddress = obj.toAddress;
        this.chainId = obj.chainId;
        this.fromAddress = obj.fromAddress;
        this.amount = obj.amount;
    }
}