import * as anchor from "@coral-xyz/anchor";
import { MintSbtcMessage } from "./txns/mint-sbtc-message ";
const ethBtcAddress = Buffer.from("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599".replace("0x", ""), "hex");
const fromAddress = new Uint8Array(35); // 固定 32 字节
fromAddress.set(ethBtcAddress, 0); // 将前 20 字节
const msg = new MintSbtcMessage({
    messageType: 1,
    version: 1,
    nonce: new anchor.BN(123456789), // 确保是 BN 类型
    sourceChainId: 3,
    sourceTokenId: 5,
    fromAddress: fromAddress, // 确保 35 字节
    toChainId: 1,
    toAddress: new Uint8Array(32), // 32 字节全 0
    amount: new anchor.BN(1000000), // 确保是 BN 类型
});

console.log("Serialized:", Buffer.from(msg.serialize()).toString("hex"));
// 010115cd5b07000000000305230000002260fac5e5542a773aa44fbcfedf7c193bc2c59900000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000040420f0000000000