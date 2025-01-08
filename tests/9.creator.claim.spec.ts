import {
    AddressLookupTableProgram,
    ComputeBudgetProgram,
    Ed25519Program,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import BN from "bn.js";
import { serialize } from "borsh";
import { beforeEach, describe, it } from "vitest";
import { createValues, createToken, TestValues, createMemooConfig, createLookupTable, createAndSendV0Tx } from "./init";
import nacl from "tweetnacl";
import { Bridge } from "../target/types/bridge";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MEMO_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { getAccount } from "@solana/spl-token";
import { assert, expect } from "chai";



export type WhitelistPairModel = {
    address: PublicKey;
    percent: number;
};

export type WhiteListMessageModel = {
    meme: PublicKey;
    expiry: number;
    items: Array<WhitelistPairModel>;
};


export class WhitelistPair {
    address: Uint8Array // [32] (32 bytes)
    percent: number; // u8 (1 bytes)

    constructor(args: WhitelistPair) {
        Object.assign(this, args);
    }

    static serialize(msg: WhitelistPairModel): Uint8Array {
        return serialize(new Map([
            [WhitelistPair,
                {
                    kind: 'struct',
                    fields: [
                        ['address', [32]],
                        ['percent', 'u8'],
                    ]
                }],
        ]), new WhitelistPair({ address: msg.address.toBytes(), percent: msg.percent }))
    }
}

const sizeOfWhitelistPair = 33;
//4 is the reserved number of bytes, which might be used to store the length information of the project.
const lengthSize = 4;
const getItemsBuffAllocation = (items: Array<unknown>) => lengthSize + items.length * sizeOfWhitelistPair;


export class WhiteListMessage {
    meme: Uint8Array;
    expiry: number;
    items: Uint8Array;

    constructor(args: WhiteListMessage) {
        Object.assign(this, args);
    }
    static serializePairs(items: WhiteListMessageModel["items"]): Uint8Array {
        const bufferLayout = new Uint8Array(getItemsBuffAllocation(items));
        let offset = 0;
        return [Uint8Array.from([items.length, 0, 0, 0])]
            .concat(items.map(WhitelistPair.serialize))
            .reduce((layout, item) => {
                layout.set(item, offset);
                offset += item.length;
                return layout;
            }, bufferLayout);
    }

    static serialize(msg: WhiteListMessageModel): Uint8Array {
        return serialize(new Map([
            [WhiteListMessage,
                {
                    kind: 'struct',
                    fields: [
                        ['meme', [32]],
                        ['expiry', 'u64'],
                        ["items", [getItemsBuffAllocation(msg.items)]],
                    ]
                }],
        ]), new WhiteListMessage({ meme: msg.meme.toBytes(), expiry: msg.expiry, items: WhiteListMessage.serializePairs(msg.items) }))
    }
}


describe('claim creator', () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Memoo as Program<Bridge>;


    let signature: Uint8Array;

    let values: TestValues;
    beforeEach(async () => {
        values = createValues();
        await createMemooConfig(program, values);
        await createToken(program, values);
    }, 1000000);

    it('whitelist 0 claim', async () => {

        const currentDate = new Date();
        const futureDate = new Date(currentDate);
        futureDate.setDate(futureDate.getDate() + 14);
        const whiteLists = [
            { key: values.creators[0], percent: 60 },
            { key: values.creators[1], percent: 20 },
            { key: values.creators[2], percent: 10 },
            { key: values.creators[3], percent: 6 },
            { key: values.creators[4], percent: 4 },
        ];

        const encoded = WhiteListMessage.serialize({
            items: whiteLists.map((entry) => ({
                address: entry.key.publicKey,
                percent: entry.percent,
            })),
            meme: values.memee_config_id,
            expiry: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 // add 14 days
        });
        console.log('Serialized message:', encoded);

        // Calculate Ed25519 signature
        // note: admin sign
        signature = nacl.sign.detached(encoded, values.platform.secretKey);
        console.log('signature:', signature);
        const signatureHex = Buffer.from(signature).toString('hex');
        console.log('signatureHex:', signatureHex);

        let ixEd25519Program = Ed25519Program.createInstructionWithPublicKey({
            publicKey: values.platform.publicKey.toBytes(),
            signature,
            message: encoded,
        });

        const accounts = {
            payer: values.creators[0].publicKey,
            creator: values.creators[0].publicKey,
            instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
            memooConfig: values.memooConfigPda,
            memeConfig: values.memeConfigPda,
            memeUserData: values.creatorsUserDataPdas[0],
            memeUserDataCreator: values.creatorsUserDataPdas[0],
            mintA: values.mintAKeypair.publicKey,
        };
        const remainingAccounts = [
            {
                pubkey: values.poolAuthorityA,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: values.poolAccountA,
                isSigner: false,
                isWritable: true,
            },
            ...values.creatorsTokenAtas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
        ];
        const tx = await program.methods
            .creatorClaimWhitelist(
                values.memee_config_id,
            )
            .accounts(accounts)
            .remainingAccounts(remainingAccounts)
            .preInstructions(
                [ixEd25519Program]
            )
            .transaction();

        var addrs = [
            ...Object.values(accounts).filter(
                (account) => account instanceof PublicKey
            ),
            ...remainingAccounts.map((account) => account.pubkey),
            ComputeBudgetProgram.programId,
            MEMO_PROGRAM_ID
        ];
        // console.log(`table is : ${addrs}`);
        // // you can use this address
        // const LOOKUP_TABLE_ADDRESS = new PublicKey("9BTtHg37ZacJZvuQ71A11G2uXaQGkEwjC9K3AX5bTUCh")
        // // const LOOKUP_TABLE_ADDRESS =  await createLookupTable(values.platform.publicKey, values.platform, provider.connection);
        // const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
        //     payer: values.platform.publicKey,
        //     authority: values.platform.publicKey,
        //     lookupTable: LOOKUP_TABLE_ADDRESS,
        //     addresses: addrs,
        // });

        // await createAndSendV0Tx([addAddressesInstruction], values.platform, provider.connection);
        // console.log(`table create success : ${LOOKUP_TABLE_ADDRESS} !`);
        // const lookupTable = (await provider.connection.getAddressLookupTable(LOOKUP_TABLE_ADDRESS)).value;

        console.log(`creatorClaimWhitelist...start...`)
        let userDataCreator = await program.account.memeUserIdoData.fetch(values.creatorsUserDataPdas[0]);
        console.log(`userDataCreator.creatorTeamCount: ${userDataCreator.creatorTeamCount.toString()}`);
        console.log(`userDataCreator.creatorTeamCountClaimed: ${userDataCreator.creatorTeamCountClaimed.toString()}`);

        const creatorCounts = whiteLists.map(w => {
            const creatorCount = userDataCreator.creatorTeamCount.mul(new BN(w.percent)).div(new BN(100));
            console.log(`creatorCount: ${creatorCount.toString()}`);
            return creatorCount;
        })


        // await createAndSendV0Tx(tx.instructions, values.creators[0], provider.connection, [lookupTable]);
        await createAndSendV0Tx(tx.instructions, values.creators[0], provider.connection, []);

        userDataCreator = await program.account.memeUserIdoData.fetch(values.creatorsUserDataPdas[0]);
        console.log(`userDataCreator.memeUserIdoCount: ${userDataCreator.creatorTeamCount.toString()}`);
        console.log(`userDataCreator.memeUserIdoClaimedCount: ${userDataCreator.creatorTeamCountClaimed.toString()}`);

        const creatorsTokenAtas = await getAccount(provider.connection, values.creatorsTokenAtas[0]);
        console.log(`creatorsTokenAtas${0}: ${creatorsTokenAtas.amount}`);
        expect(creatorsTokenAtas.amount.toString()).eq(creatorCounts[0].toString());
        expect(creatorsTokenAtas.amount.toString()).eq(userDataCreator.creatorTeamCountClaimed.toString());

  
        console.log(`proxyIniticreatorClaimWhitelistalizeSimple....end...`)
        // https://solana.fm/tx/tEdc14PtyLUXKkr8uEmenPmtndZpSbLTogZUsZeqzTBbfuuRyGG4FRUxEQH6yuAC91prpogpc4YXiL11SQk7LU5?cluster=devnet-alpha
    });


    it('whitelist 1 claim', async () => {

        const currentDate = new Date();
        const futureDate = new Date(currentDate);
        futureDate.setDate(futureDate.getDate() + 14);
        const whiteLists = [
            { key: values.creators[0], percent: 60 },
            { key: values.creators[1], percent: 20 },
            { key: values.creators[2], percent: 10 },
            { key: values.creators[3], percent: 6 },
            { key: values.creators[4], percent: 4 },
        ];

        const encoded = WhiteListMessage.serialize({
            items: whiteLists.map((entry) => ({
                address: entry.key.publicKey,
                percent: entry.percent,
            })),
            meme: values.memee_config_id,
            expiry: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 // add 14 days
        });
        console.log('Serialized message:', encoded);

        // Calculate Ed25519 signature
        // note: admin sign
        signature = nacl.sign.detached(encoded, values.platform.secretKey);
        console.log('signature:', signature);
        const signatureHex = Buffer.from(signature).toString('hex');
        console.log('signatureHex:', signatureHex);

        let ixEd25519Program = Ed25519Program.createInstructionWithPublicKey({
            publicKey: values.platform.publicKey.toBytes(),
            signature,
            message: encoded,
        });

        const accounts = {
            payer: values.creators[1].publicKey, // creator 1 claim
            creator: values.creators[0].publicKey,
            instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
            memooConfig: values.memooConfigPda,
            memeConfig: values.memeConfigPda,
            memeUserData: values.creatorsUserDataPdas[1],  // creator 1 claim
            memeUserDataCreator: values.creatorsUserDataPdas[0],
            mintA: values.mintAKeypair.publicKey,
        };
        const remainingAccounts = [
            {
                pubkey: values.poolAuthorityA,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: values.poolAccountA,
                isSigner: false,
                isWritable: true,
            },
            ...values.creatorsTokenAtas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
        ];
        const tx = await program.methods
            .creatorClaimWhitelist(
                values.memee_config_id,
            )
            .accounts(accounts)
            .remainingAccounts(remainingAccounts)
            .preInstructions(
                [ixEd25519Program]
            )
            .transaction();

        console.log(`creatorClaimWhitelist...start...`)
        let userDataCreator1 = await program.account.memeUserIdoData.fetch(values.creatorsUserDataPdas[0]);
        console.log(`userDataCreator.creatorTeamCount: ${userDataCreator1.creatorTeamCount.toString()}`);
        console.log(`userDataCreator.creatorTeamCountClaimed: ${userDataCreator1.creatorTeamCountClaimed.toString()}`);

        const creatorCounts = whiteLists.map(w => {
            const creatorCount = userDataCreator1.creatorTeamCount.mul(new BN(w.percent)).div(new BN(100));
            console.log(`creatorCount: ${creatorCount.toString()}`);
            return creatorCount;
        })

        await createAndSendV0Tx(tx.instructions, values.creators[1], provider.connection, []);

        userDataCreator1 = await program.account.memeUserIdoData.fetch(values.creatorsUserDataPdas[1]);
        console.log(`userDataCreator1.memeUserIdoCount: ${userDataCreator1.creatorTeamCount.toString()}`);
        console.log(`userDataCreator1.memeUserIdoClaimedCount: ${userDataCreator1.creatorTeamCountClaimed.toString()}`);

        const creatorsTokenAtas = await getAccount(provider.connection, values.creatorsTokenAtas[1]);
        console.log(`creatorsTokenAtas${1}: ${creatorsTokenAtas.amount}`);
        expect(creatorsTokenAtas.amount.toString()).eq(creatorCounts[1].toString());
        expect(creatorsTokenAtas.amount.toString()).eq(userDataCreator1.creatorTeamCountClaimed.toString());

  
        console.log(`proxyIniticreatorClaimWhitelistalizeSimple....end...`)
        // https://solana.fm/tx/tEdc14PtyLUXKkr8uEmenPmtndZpSbLTogZUsZeqzTBbfuuRyGG4FRUxEQH6yuAC91prpogpc4YXiL11SQk7LU5?cluster=devnet-alpha
    });

    
    it('whitelist 2 claim twice failed', async () => {

        const creatorNum = 2;
        const currentDate = new Date();
        const futureDate = new Date(currentDate);
        futureDate.setDate(futureDate.getDate() + 14);
        const whiteLists = [
            { key: values.creators[0], percent: 60 },
            { key: values.creators[1], percent: 20 },
            { key: values.creators[2], percent: 10 },
            { key: values.creators[3], percent: 6 },
            { key: values.creators[4], percent: 4 },
        ];

        const encoded = WhiteListMessage.serialize({
            items: whiteLists.map((entry) => ({
                address: entry.key.publicKey,
                percent: entry.percent,
            })),
            meme: values.memee_config_id,
            expiry: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 // add 14 days
        });
        console.log('Serialized message:', encoded);

        // Calculate Ed25519 signature
        // note: admin sign
        signature = nacl.sign.detached(encoded, values.platform.secretKey);
        console.log('signature:', signature);
        const signatureHex = Buffer.from(signature).toString('hex');
        console.log('signatureHex:', signatureHex);

        let ixEd25519Program = Ed25519Program.createInstructionWithPublicKey({
            publicKey: values.platform.publicKey.toBytes(),
            signature,
            message: encoded,
        });

        const accounts = {
            payer: values.creators[creatorNum].publicKey, // creator 2 claim
            creator: values.creators[0].publicKey,
            instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
            memooConfig: values.memooConfigPda,
            memeConfig: values.memeConfigPda,
            memeUserData: values.creatorsUserDataPdas[creatorNum],  // creator 2 claim
            memeUserDataCreator: values.creatorsUserDataPdas[0],
            mintA: values.mintAKeypair.publicKey,
        };
        const remainingAccounts = [
            {
                pubkey: values.poolAuthorityA,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: values.poolAccountA,
                isSigner: false,
                isWritable: true,
            },
            ...values.creatorsTokenAtas.map(pubkey => ({ pubkey, isSigner: false, isWritable: true }))
        ];
        const tx = await program.methods
            .creatorClaimWhitelist(
                values.memee_config_id,
            )
            .accounts(accounts)
            .remainingAccounts(remainingAccounts)
            .preInstructions(
                [ixEd25519Program]
            )
            .transaction();

        console.log(`creatorClaimWhitelist...start...`)
        let userDataCreator = await program.account.memeUserIdoData.fetch(values.creatorsUserDataPdas[0]);
        console.log(`userDataCreator.creatorTeamCount: ${userDataCreator.creatorTeamCount.toString()}`);
        console.log(`userDataCreator.creatorTeamCountClaimed: ${userDataCreator.creatorTeamCountClaimed.toString()}`);

        const creatorCounts = whiteLists.map(w => {
            const creatorCount = userDataCreator.creatorTeamCount.mul(new BN(w.percent)).div(new BN(100));
            console.log(`creatorCount: ${creatorCount.toString()}`);
            return creatorCount;
        })

        await createAndSendV0Tx(tx.instructions, values.creators[creatorNum], provider.connection, []);

        const userDataCreator2 = await program.account.memeUserIdoData.fetch(values.creatorsUserDataPdas[creatorNum]);
        console.log(`userDataCreator2.memeUserIdoCount: ${userDataCreator2.creatorTeamCount.toString()}`);
        console.log(`userDataCreator2.memeUserIdoClaimedCount: ${userDataCreator2.creatorTeamCountClaimed.toString()}`);

        const creatorsTokenAtas = await getAccount(provider.connection, values.creatorsTokenAtas[creatorNum]);
        console.log(`creatorsTokenAtas${creatorNum}: ${creatorsTokenAtas.amount}`);
        expect(creatorsTokenAtas.amount.toString()).eq(creatorCounts[creatorNum].toString());
        // expect(creatorsTokenAtas.amount.toString()).eq(userDataCreator2.creatorTeamCountClaimed.toString());

  
        console.log(`proxyIniticreatorClaimWhitelistalizeSimple....end...`)
        try{
         await createAndSendV0Tx(tx.instructions, values.creators[creatorNum], provider.connection, []);
        }
        catch(error){
            assert.ok(
                error
                  .toString()
                  .includes(
                    'WhitelistAlreadyClaimed'
                  )
              );
        }
    });
}, 1000000);

