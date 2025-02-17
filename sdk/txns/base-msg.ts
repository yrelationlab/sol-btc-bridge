import nacl from "tweetnacl";
import { Schema, serialize, deserialize } from "borsh";
import { Keypair } from "@solana/web3.js";

export class BaseMsg {
    static schema: Schema;

    serialize(): Uint8Array {
        return serialize((this.constructor as typeof BaseMsg).schema, this);
    }

    static deserialize<T>(this: new (...args: any[]) => T, data: Buffer): T {
        return deserialize((this as any).schema, this, data);
    }

    
    createSignature(signer: Keypair): { encoded: Uint8Array; signature: Uint8Array } {
        const encoded = this.serialize();
        console.log('Serialized message:', encoded);
        // Calculate Ed25519 signature
        const signature = nacl.sign.detached(encoded, signer.secretKey);
        console.log('signature:', signature);
        const signatureHex = Buffer.from(signature).toString('hex');
        console.log('signatureHex:', signatureHex);
        return { encoded, signature };
    }
}
