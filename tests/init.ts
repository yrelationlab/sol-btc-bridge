import * as anchor from "@coral-xyz/anchor";
import { NATIVE_MINT, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createSyncNativeInstruction, getAccount, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram, PublicKey, SYSVAR_RENT_PUBKEY, AddressLookupTableProgram, TransactionInstruction, TransactionMessage, VersionedTransaction, TransactionSignature, TransactionConfirmationStatus, SignatureStatus, AddressLookupTableAccount, Signer } from "@solana/web3.js";
import { BN } from "bn.js";
import {
  Liquidity,
  Market as raydiumSerum,
  Spl,
  SPL_MINT_LAYOUT,
} from "@raydium-io/raydium-sdk";
import fs from "fs";
import path from "path";
import secret from '../cli/.config/secret.json';
import ido_buy from '../cli/.config/ido-buy.json';
import creator_0 from '../cli/.config/creator.json';
import creator_1 from '../cli/.config/creator-1.json';
import creator_2 from '../cli/.config/creator-2.json';
import creator_3 from '../cli/.config/creator-3.json';
import creator_4 from '../cli/.config/creator-4.json';

import platform_fee_recipient_key from '../cli/.config/platform_fee_recipient.json';
import platform_key from '../cli/.config/platform.json';

import { assert, expect } from "chai";
import { Memoo } from "../target/types/memoo";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

/*
下面是对每个属性的解释:
id: PublicKey: 一个 Solana 公钥(即账户地址)。
fee: number: 一个数字类型的费用。
preLaunchSecond: anchor.BN: 一个使用 Anchor 库的 BN 类型表示的时间值,可能表示某个活动的预启动时间。
maxPerWallet: anchor.BN: 一个使用 BN 类型表示的最大数量,可能是每个钱包的最大限额。
admin: Keypair: 一个 Solana 密钥对,可能用于管理员权限。
mintAKeypair: Keypair: 另一个 Solana 密钥对,可能用于铸币。
defaultSupply: anchor.BN: 一个使用 BN 类型表示的默认供应量。
ammKey: PublicKey: 一个 Solana 公钥,可能表示自动做市商(AMM)的地址。
minimumLiquidity: anchor.BN: 一个使用 BN 类型表示的最小流动性。
poolKey: PublicKey: 一个 Solana 公钥,可能表示流动性池的地址。
poolAuthority: PublicKey: 一个 Solana 公钥,可能表示流动性池的管理者。
mintLiquidity: PublicKey: 一个 Solana 公钥,可能表示流动性代币的铸币地址。
depositAmountA: anchor.BN: 一个使用 BN 类型表示的存款金额。
liquidityAccount: PublicKey: 一个 Solana 公钥,可能表示流动性账户的地址。
poolAccountA: PublicKey: 一个 Solana 公钥,可能表示池中一种资产的账户地址。
holderAccountA: PublicKey: 一个 Solana 公钥,可能表示持有资产 A 的账户地址。
treasury: Keypair: 一个 Solana 密钥对,可能表示财政部门的密钥。
treasuryAccountA: PublicKey: 一个 Solana 公钥,可能表示财政部门的资产 A 账户地址。
*/
export interface TestValues {

  global_memoo_config_id: PublicKey;
  memee_config_id: PublicKey;
  platform_fee_rate_ido: number;
  platform_fee_rate_denominator_ido: number;
  ido_creator_buy_limit: number;
  token_allocation_creator: number;
  token_allocation_ido: number;
  token_allocation_lp: number;
  token_allocation_airdrop: number;
  token_allocation_platform: number;
  platform_fee_create_meme: anchor.BN;
  share_create_fee_number: anchor.BN;
  ido_price: anchor.BN;
  airdrop_price: anchor.BN;
  total_supply: anchor.BN;
  ido_user_buy_limit: number;
  mintAKeypair: Keypair;
  payerAdmin: Keypair;
  platform: Keypair;
  platformAccountAPda: PublicKey;
  platformFeeRecipientAPda: PublicKey;
  platformFeeRecipentWsolPda: PublicKey;
  platformAccountWsolPda: PublicKey;
  payerAdminWsolAccount: PublicKey;
  payerAdminAccountA: PublicKey;
  idoBuyer: Keypair;
  creators: Keypair[];
  creatorsUserDataPdas: PublicKey[];
  creatorsTokenAtas: PublicKey[];
  creatorsWSolAtas: PublicKey[];
  idoBuyerAccountA: PublicKey;
  poolAuthorityA: PublicKey;
  poolAccountA: PublicKey;
  idoBuyWsolAccount: PublicKey;
  memooConfigPda: PublicKey;
  memeConfigPda: PublicKey;
  poolAccountSol: PublicKey;
  poolSolAuthority: PublicKey;
  mintSolKeypair: Keypair;
  metadataPDA: PublicKey;
  tokenMetadataProgram: PublicKey;
  idoBuyWSolAtas: PublicKey;
  idoBuyMemeUserDataPda: PublicKey;
  platform_fee_recipient: Keypair;
  PERCENT_DENOMINATOR: anchor.BN;
  DECIMAL_SOL: anchor.BN;
  DECIMAL_IDO_PRICE: anchor.BN;
}


export async function sleep(seconds: number) {
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export const generateSeededKeypair = (seed: string) => {
  return Keypair.fromSeed(
    anchor.utils.bytes.utf8.encode(anchor.utils.sha256.hash(seed)).slice(0, 32)
  );
};

export const expectRevert = async (promise: Promise<any>) => {
  try {
    await promise;
    assert.fail(
      'Should not go to here, no exception throw.'
    );
  } catch (e) {
    console.log(`error : ${JSON.stringify(e)}`)
    return;
  }
};

export const mintingTokens = async ({
  program,
  creator,
  mintAKeypair,
  mintedAmount = new anchor.BN(LAMPORTS_PER_SOL),
  decimals = 9,
}: {
  program: any;
  creator: Signer;
  holder?: Signer;
  mintAKeypair: Keypair;
  mintedAmount?: anchor.BN;
  decimals?: number;
}) => {
  console.log("   ----- Create token mint -----");
  const metadata = {
    name: "Meme DAN",
    symbol: "DAN",
    uri: "https://lime-acceptable-gibbon-564.mypinata.cloud/ipfs/QmSADa6pHyKfDUkacMVMorM7KDZb1n2AGQrvcCVSaPkXTi",
  };

  const associatedTokenAccount = await getAssociatedTokenAddressSync(
    mintAKeypair.publicKey,
    creator.publicKey
  );

  // Derive PDA for metadata account
  const [metadataPDA, _] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      mintAKeypair.publicKey.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s") // The public key of the token metadata program
  );


  const total_supply = new BN(mintedAmount).mul(new BN(10 ** decimals));

  const tx = await program.methods
    .createTokenMint(
      9,
      metadata.name,
      metadata.symbol,
      metadata.uri,
      total_supply
    )
    .accounts({
      payer: creator.publicKey,
      mintAccount: mintAKeypair.publicKey,
      associatedTokenAccount,
      metadataAccount: metadataPDA,
      tokenMetadataProgram: new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      ),
    })
    .signers([mintAKeypair, creator])
    .rpc();

  console.log("     Token Name: Booster DAN");
  console.log("     Token Symbol: DAN");
  console.log(
    `     Transaction Signature: https://solscan.io/tx/${tx}?cluster=devnet`
  );
  return tx;
};

type TestValuesDefaults = {
  [K in keyof TestValues]+?: TestValues[K];
};

export async function createAssociatedTokenAccountIfNotExist(
  owner: PublicKey,
  mint: PublicKey,
  transaction: Transaction,
  conn: any
) {
  const associatedAccount = await Spl.getAssociatedTokenAccount({
    mint,
    owner,
  });
  const payer = owner;
  const associatedAccountInfo = await conn.getAccountInfo(associatedAccount);
  if (!associatedAccountInfo) {
    transaction.add(
      Spl.makeCreateAssociatedTokenAccountInstruction({
        mint,
        associatedAccount,
        owner,
        payer,
      })
    );
  }
  return associatedAccount;
}

export function createValues(defaults?: TestValuesDefaults): TestValues {

  const platform_fee_recipient = Keypair.fromSecretKey(new Uint8Array(platform_fee_recipient_key));
  const payerAdmin = Keypair.fromSecretKey(new Uint8Array(secret));
  const platform = Keypair.fromSecretKey(new Uint8Array(platform_key));


  const id = Keypair.generate().publicKey;
  // Making sure tokens are in the right order
  const mintAKeypair = Keypair.generate();
  const mintSolKeypair = Keypair.generate();
  const memee_config_id = Keypair.generate().publicKey;
  console.log(`memee_config_id : ${memee_config_id}`);

  const idoBuyer = Keypair.fromSecretKey(new Uint8Array(ido_buy));
  const creator0 = Keypair.fromSecretKey(new Uint8Array(creator_0));
  //  payerAdmin; // Compatible with previous test code
  // Keypair.fromSecretKey(new Uint8Array(creator_0)); //=>, creators should not use contract private keys.
  const creator1 = Keypair.fromSecretKey(new Uint8Array(creator_1));
  const creator2 = Keypair.fromSecretKey(new Uint8Array(creator_2));
  const creator3 = Keypair.fromSecretKey(new Uint8Array(creator_3));
  const creator4 = Keypair.fromSecretKey(new Uint8Array(creator_4));

  const idoBuyerAccountA = getAssociatedTokenAddressSync(
    mintAKeypair.publicKey,
    idoBuyer.publicKey,
    true
  );
  const idoBuyWsolAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    idoBuyer.publicKey,
    true
  );


  console.log(`payerAdmin : ${payerAdmin.publicKey}`);
  console.log(`platform : ${platform.publicKey}`);
  console.log(`platform_fee_recipient : ${platform_fee_recipient.publicKey}`);

  const payerAdminWsolAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    payerAdmin.publicKey,
    true
  );
  const platformFeeRecipentWsolPda = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    platform_fee_recipient.publicKey,
    true
  );
  const platformAccountWsolPda = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    platform.publicKey,
    true
  );
  const payerAdminAccountA = getAssociatedTokenAddressSync(
    mintAKeypair.publicKey,
    payerAdmin.publicKey,
    true
  );
  console.log(`payerAdminAccountA : ${payerAdminAccountA}`);

  // Derive PDA for metadata account
  const [metadataPDA, _] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      mintAKeypair.publicKey.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s") // The public key of the token metadata program
  );

  console.log(`metadataPDA : ${metadataPDA}`);

  const tokenMetadataProgram = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  console.log(`tokenMetadataProgram : ${tokenMetadataProgram}`);


  const platformAccountAPda = getAssociatedTokenAddressSync(
    mintAKeypair.publicKey,
    platform.publicKey,
    true
  );
  console.log(`platformAccountAPda : ${platformAccountAPda}`);

  const platformFeeRecipientAPda = getAssociatedTokenAddressSync(
    mintAKeypair.publicKey,
    platform_fee_recipient.publicKey,
    true
  );

  const memooConfigPda = PublicKey.findProgramAddressSync(
    [Buffer.from("global_memoo_config"), id.toBuffer()],
    anchor.workspace.Memoo.programId
  )[0];
  console.log(`programId : ${anchor.workspace.Memoo.programId}`);
  console.log(`memooConfigPda : ${memooConfigPda}`);

  const memeConfigPda = PublicKey.findProgramAddressSync(
    [
      Buffer.from("meme_config"),
      memee_config_id.toBuffer(),
    ],
    anchor.workspace.Memoo.programId
  )[0];
  console.log(`memee_config_id : ${memee_config_id}`);
  console.log(`memeConfigPda : ${memeConfigPda}`);

  var creators = [creator0, creator1, creator2, creator3, creator4];
  var creatorsUserDataPdas = creators.map((c) => {
    var pda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("meme_user_data"),
        memee_config_id.toBuffer(),
        c.publicKey.toBuffer()
      ],
      anchor.workspace.Memoo.programId
    )[0];
    console.log(`creator address : ${c.publicKey}, pda: ${pda}`)

    return pda;
  });
  const memeUserDataPda = creatorsUserDataPdas[0];

  const creatorsTokenAtas = creators.map((c) => {
    var pda = getAssociatedTokenAddressSync(
      mintAKeypair.publicKey,
      c.publicKey,
      true
    );
    console.log(`creator address TokenAtas: ${c.publicKey}, pda: ${pda}`)
    return pda;
  });

  const creatorsWSolAtas = creators.map((c) => {
    var pda = getAssociatedTokenAddressSync(
      NATIVE_MINT,
      c.publicKey,
      true
    );
    console.log(`creator address WSolAtas : ${c.publicKey}, pda: ${pda}`)
    return pda;
  });

  const idoBuyWSolAtas = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    idoBuyer.publicKey,
    true
  );
  const idoBuyMemeUserDataPda = PublicKey.findProgramAddressSync(
    [
      Buffer.from("meme_user_data"),
      memee_config_id.toBuffer(),
      idoBuyer.publicKey.toBuffer()
    ],
    anchor.workspace.Memoo.programId
  )[0];
  console.log(`idoBuyMemeUserDataPda : ${idoBuyMemeUserDataPda}`)


  const poolSolAuthority = PublicKey.findProgramAddressSync(
    [
      Buffer.from("authority"),
      memee_config_id.toBuffer(),
      NATIVE_MINT.toBuffer(),
    ],
    anchor.workspace.Memoo.programId
  )[0];
  console.log(`poolSolAuthority : ${poolSolAuthority}`)

  const poolAccountSol = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    poolSolAuthority,
    true
  );
  console.log(`poolAccountSol : ${poolAccountSol}`)

  const poolAuthorityA = PublicKey.findProgramAddressSync(
    [
      Buffer.from("authority"),
      memee_config_id.toBuffer(),
      mintAKeypair.publicKey.toBuffer(),
    ],
    anchor.workspace.Memoo.programId
  )[0];
  console.log(`poolAuthorityA : ${poolAuthorityA}`)

  const poolAccountA = getAssociatedTokenAddressSync(
    mintAKeypair.publicKey,
    poolAuthorityA,
    true
  );
  console.log(`poolAccountA : ${poolAccountA}`)

  return {
    global_memoo_config_id: id,
    memee_config_id,
    platform_fee_rate_ido: 1,
    platform_fee_rate_denominator_ido: 7,
    ido_creator_buy_limit: 3000, // 创建者+idobuy 1个可以买完，好测试
    token_allocation_creator: 500,
    token_allocation_ido: 3500,
    token_allocation_lp: 5500,
    token_allocation_airdrop: 200,
    token_allocation_platform: 300,
    ido_user_buy_limit: 500,
    platform_fee_create_meme: new anchor.BN(10_000_000), // 0.01sol
    share_create_fee_number: new anchor.BN(1),
    ido_price: new BN(13), // 0.000 000 0013
    airdrop_price: new BN(0),
    total_supply: new BN(1_000_000_000).mul(new BN(10 ** 9)),
    payerAdmin,
    platform,
    platformAccountAPda,
    platformAccountWsolPda,
    platformFeeRecipentWsolPda,
    payerAdminWsolAccount,
    payerAdminAccountA,
    platformFeeRecipientAPda,
    poolAuthorityA: poolAuthorityA,
    poolAccountA,
    idoBuyer,
    creators,
    creatorsUserDataPdas,
    creatorsTokenAtas,
    creatorsWSolAtas,
    idoBuyerAccountA,
    idoBuyWsolAccount,
    memooConfigPda,
    memeConfigPda,
    idoBuyWSolAtas,
    idoBuyMemeUserDataPda: idoBuyMemeUserDataPda,
    mintAKeypair,
    platform_fee_recipient,
    poolSolAuthority,
    mintSolKeypair,
    poolAccountSol,
    metadataPDA,
    tokenMetadataProgram,
    PERCENT_DENOMINATOR: new anchor.BN(10000),
    DECIMAL_SOL: new anchor.BN(1_000_000_000),
    DECIMAL_IDO_PRICE: new anchor.BN(10_000_000_000)
  };
}

export async function createMemooConfig(program: anchor.Program<Memoo>, values: TestValues) {
  return await program.methods
    .createMemooConfig(
      values.global_memoo_config_id,
      values.platform.publicKey,
      values.platform_fee_recipient.publicKey,
      values.platform_fee_rate_ido,
      values.platform_fee_rate_denominator_ido,
      values.ido_creator_buy_limit,
      values.token_allocation_creator,
      values.token_allocation_ido,
      values.token_allocation_lp,
      values.token_allocation_airdrop,
      values.token_allocation_platform,
      values.ido_user_buy_limit,
      values.ido_price,
      values.airdrop_price,
      values.total_supply,
      values.platform_fee_create_meme,
      values.share_create_fee_number
    )
    .accounts({ memooConfig: values.memooConfigPda })
    .rpc();
}

export async function createToken(program: anchor.Program<Memoo>, values: TestValues, buyCount: BuyCount = BuyCount.Unit10) {
  await CreateMemooRegisterIdoBuyEnd(program, values, buyCount);
  const txn = await program.methods
    .createTokenMint(
      values.memee_config_id,
      metadata.name,
      metadata.symbol,
      metadata.uri,
    )
    .accounts({
      payer: values.platform.publicKey,
      mintAccountA: values.mintAKeypair.publicKey,
      metadataAccount: values.metadataPDA,
      tokenMetadataProgram: values.tokenMetadataProgram,
      poolAuthorityA: values.poolAuthorityA,
      poolAccountA: values.poolAccountA,
      memeConfig: values.memeConfigPda,
    })
    .signers([values.mintAKeypair, values.platform])
    .rpc();

  console.log(`createTokenMint is ${txn}`)

}

export async function createLookupTable(authority: PublicKey, payer: Keypair, connection: Connection) {
  // Step 1 - Get a lookup table address and create lookup table instruction
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: authority,
      payer: payer.publicKey,
      recentSlot: await connection.getSlot(),
    });

  // Step 2 - Log Lookup Table Address
  console.log("Lookup Table Address:", lookupTableAddress.toBase58());

  // Step 3 - Generate a transaction and send it to the network
  createAndSendV0Tx([lookupTableInst], payer, connection);
  return lookupTableAddress;
}
export async function createAndSendV0Tx(txInstructions: TransactionInstruction[], payer: Keypair, connection: Connection, lookupTable?: AddressLookupTableAccount[], skipPreflight: boolean = false) {
  // Step 1 - Fetch Latest Blockhash
  let latestBlockhash = await connection.getLatestBlockhash('finalized');
  console.log("   ✅ - Fetched latest blockhash. Last valid height:", latestBlockhash.lastValidBlockHeight);

  // Step 2 - Generate Transaction Message
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions
  }).compileToV0Message(lookupTable);
  console.log("   ✅ - Compiled transaction message");
  const transaction = new VersionedTransaction(messageV0);

  // Step 3 - Sign your transaction with the required `Signers`
  transaction.sign([payer]);
  console.log("   ✅ - Transaction Signed");

  // Step 4 - Send our v0 transaction to the cluster
  const txid = await connection.sendTransaction(transaction, { skipPreflight: skipPreflight, maxRetries: 5 });
  console.log(`   ✅ - Transaction ${txid} sent to network`);

  // Step 5 - Confirm Transaction 
  const confirmation = await confirmTransaction(connection, txid);
  if (confirmation.err) {
    console.log("   ❌ - Transaction not confirmed.")
    throw confirmation.err
  }
  console.log('🎉 Transaction succesfully confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=devnet`);
}

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = 'confirmed',
  timeout: number = 300000,
  pollInterval: number = 1000,
  searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory });

    if (!statuses || statuses.length === 0) {
      throw new Error('Failed to get signature status');
    }

    const status = statuses[0];

    if (status === null) {
      // If status is null, the transaction is not yet known
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      continue;
    }

    if (status.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
      return status;
    }

    if (status.confirmationStatus === 'finalized') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}
export function compareAddresses(address1: string, address2: string): number {
  // 将Base58地址转换为Uint8Array
  const bytes1: Uint8Array = bs58.decode(address1);
  const bytes2: Uint8Array = bs58.decode(address2);

  // 比较两个Uint8Array
  if (bytes1.length !== bytes2.length) {
    return bytes1.length - bytes2.length;
  }

  for (let i = 0; i < bytes1.length; i++) {
    if (bytes1[i] !== bytes2[i]) {
      return bytes1[i] - bytes2[i];
    }
  }

  return 0; // 如果完全相等，返回0
}

export async function checkAssociatedTokenAccount(connection, mintAddress, ownerAddress) {
  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(mintAddress, ownerAddress, true);
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    console.log(`checkAssociatedTokenAccount : ownerAddress:${ownerAddress}, mintAddress:${mintAddress}, associatedTokenAddress:${associatedTokenAddress}, accountInfo:${accountInfo}`)
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking associated token account:', error);
    return false;
  }
}

export async function register(program: anchor.Program<Memoo>, values: TestValues, totalPay: anchor.BN) {
  const txn = await program.methods
    .registerTokenWithoutFee(
      values.memee_config_id,
      totalPay,
      new BN(0)
    )
    .accounts({
      memooConfig: values.memooConfigPda,
      memeConfig: values.memeConfigPda,
      memeUserData: values.creatorsUserDataPdas[0],

      poolAuthorityWsol: values.poolSolAuthority,
      poolAccountWsol: values.poolAccountSol,

      wsolMint: NATIVE_MINT,
      payer: values.creators[0].publicKey
    }).remainingAccounts([
      {
        pubkey: values.creatorsWSolAtas[0],
        isSigner: false,
        isWritable: true,
      },
    ])
    .transaction();
  await createAndSendV0Tx(txn.instructions, values.creators[0], program.provider.connection);
  console.log(`registerTokenMint success !`);
}


export async function idoBuyWithFee(program: anchor.Program<Memoo>, values: TestValues, idoBuyCost: anchor.BN, share_create_fee: anchor.BN) {
  const txn = await program.methods
    .idoBuyWithFee(
      values.memee_config_id,
      idoBuyCost.add(share_create_fee)
    )
    .accounts({
      memooConfig: values.memooConfigPda,
      memeConfig: values.memeConfigPda,
      memeUserData: values.idoBuyMemeUserDataPda,
      payer: values.idoBuyer.publicKey,

      poolAccountWsol: values.poolAccountSol,

      userWsolAccount: values.idoBuyWsolAccount,
      wsolMint: NATIVE_MINT,
    })
    .transaction();
  await createAndSendV0Tx(txn.instructions, values.idoBuyer, program.provider.connection);
  console.log(`idoBuyWithFee success !`);
}


export async function idoEnd(program: anchor.Program<Memoo>, values: TestValues) {
  const txn = await program.methods
    .idoEnd(
      values.memee_config_id
    )
    .accounts({
      memooConfig: values.memooConfigPda,
      memeConfig: values.memeConfigPda,
      admin: values.platform.publicKey,
    })
    .transaction();
  await createAndSendV0Tx(txn.instructions, values.platform, program.provider.connection);
  console.log(`idoEnd success !`);
}
export enum BuyCount {
  Unit10,
  IdoBuyLimit,
}
export async function CreateMemooRegisterIdoBuyEnd(program: anchor.Program<Memoo>, values: TestValues, buyCount: BuyCount = BuyCount.Unit10) {
  const memoo_config = await program.account.globalMemooConfig.fetch(values.memooConfigPda);
  const fullSize = (memoo_config.totalSupply.mul(new BN(memoo_config.idoCreatorBuyLimit)).div(values.PERCENT_DENOMINATOR))
  console.log(`fullSize is ${fullSize}, idoPrice is ${memoo_config.idoPrice}`)
  const fullSizeCost = fullSize.mul(memoo_config.idoPrice).div(values.DECIMAL_IDO_PRICE);
  console.log(`fullSize is ${fullSize}, fullSizeCost is ${fullSizeCost}, idoPrice is ${memoo_config.idoPrice}`)
  const totalPay = fullSizeCost
  console.log(`totalPay is ${totalPay}, platform_fee_create_meme is ${values.platform_fee_create_meme}`)

  console.log(`userWsolAccount is ${values.payerAdminWsolAccount}`)

  await register(program, values, totalPay);
  const meme_config = await program.account.memeConfig.fetch(values.memeConfigPda);

  // Add create share fee
  const quotient = memoo_config.platformFeeCreateMemeSol.div(memoo_config.shareCreateFeeNumber);
  const remainder = memoo_config.platformFeeCreateMemeSol.mod(memoo_config.shareCreateFeeNumber);
  const share_create_fee = quotient.add(remainder.isZero() ? new BN(0) : new BN(1));
  console.log(`share_create_fee is ${share_create_fee}`);

  let buy = new BN(0);
  var idoBuyCount = meme_config.totalSupply.mul(new BN(memoo_config.idoUserBuyLimit)).div(values.PERCENT_DENOMINATOR)

  switch (buyCount) {
    case BuyCount.IdoBuyLimit:
      buy = idoBuyCount.mul(memoo_config.idoPrice).div(values.DECIMAL_IDO_PRICE);
      break;
    case BuyCount.Unit10:
      idoBuyCount = values.ido_price.mul(values.DECIMAL_IDO_PRICE).div(values.ido_price);
      buy = values.ido_price;
      break
    default:
      // Handle the default case or Unit10 case
      values.ido_price
      break;
  }

  await idoBuyWithFee(program, values, buy, share_create_fee);

  // platform call ido end
  await idoEnd(program, values);

  const meme_config_after = await program.account.memeConfig.fetch(values.memeConfigPda);
  expect(meme_config_after.idoEnd).to.be.true;

  // Verify that some tokens has been destroyed.
  const diffMemeConfigTotal = meme_config.totalSupply.sub(meme_config_after.totalSupply)
  const idoTotal = (memoo_config.totalSupply.mul(new BN(memoo_config.tokenAllocationIdo)).div(values.PERCENT_DENOMINATOR))
  const diffTotalSubIdoBuyCount = idoTotal.sub(meme_config_after.memeIdoCount)
  console.log(`
  idoTotal               : ${idoTotal}
  memeIdoCount           : ${meme_config_after.memeIdoCount}
  diffTotalSubIdoBuyCount: ${diffTotalSubIdoBuyCount}
  diffMemeConfigTotal    : ${diffMemeConfigTotal}
  idoBuyCount            : ${idoBuyCount}
  `);
  expect(diffMemeConfigTotal.toString()).eq(diffTotalSubIdoBuyCount.toString())
  expect(fullSize.add(idoBuyCount).toString()).eq(meme_config_after.memeIdoCount.toString())
}

export const metadata = {
  name: "Memoo",
  symbol: "Memoo",
  uri: "https://app.memoo.ai/logo.svg",
};