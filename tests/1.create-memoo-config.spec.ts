
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Bridge } from "../target/types/bridge";
import { TestValues, createMemooConfig, createValues, expectRevert, mintingTokens } from "./init";
import { describe, beforeEach, it } from 'vitest'
import { expect } from "chai";
describe("Create and mint token with metadata", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Bridge as Program<Bridge>;
  let values: TestValues;
  beforeEach(async () => {
    values = createValues();
  });
  it("Creation", async () => {
    console.log(`values.global_memoo_config_id is ${values.global_memoo_config_id}`)
    console.log(`values.platform_fee_recipient is ${values.platform_fee_recipient.publicKey}`)
    const tx = await createMemooConfig(program, values);
    console.log(`tx is ${tx}`)
    const configAccount = await program.account.globalMemooConfig.fetch(values.memooConfigPda);
    console.log(`configAccount is ${JSON.stringify(configAccount)}`)
    expect(configAccount.id.toString()).to.equal(values.global_memoo_config_id.toString());
    expect(configAccount.admin.toString()).to.equal(
      values.payerAdmin.publicKey.toString()
    );
    expect(configAccount.airdropPrice.toString()).to.equal(values.airdrop_price.toString());
  });
  it("Creation fail with other key", async () => {
    expectRevert(
      program.methods
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
        .signers([values.idoBuyer])
        .rpc()
    );
  });
  it("Creation & Update", async () => {
    console.log(`values.global_memoo_config_id is ${values.global_memoo_config_id}`)
    console.log(`values.platform_fee_recipient is ${values.platform_fee_recipient.publicKey}`)
    const tx = await program.methods
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
    console.log(tx)
    const configAccount = await program.account.globalMemooConfig.fetch(values.memooConfigPda);
    console.log(`${JSON.stringify(configAccount)}`)
    expect(configAccount.id.toString()).to.equal(values.global_memoo_config_id.toString());
    expect(configAccount.admin.toString()).to.equal(
      values.payerAdmin.publicKey.toString()
    );
    expect(configAccount.airdropPrice.toString()).to.equal(values.airdrop_price.toString());

    const txUpdate = await program.methods
      .updateMemooConfig(
        values.global_memoo_config_id,
        values.platform.publicKey,
        values.idoBuyer.publicKey,
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
        new BN(123),
        values.total_supply,
        values.platform_fee_create_meme,
        new BN(9)
      )
      .accounts({ memooConfig: values.memooConfigPda, admin: values.payerAdmin.publicKey })
      .rpc();
    console.log(txUpdate)
    const configAccountUpdate = await program.account.globalMemooConfig.fetch(values.memooConfigPda);
    expect(configAccountUpdate.id.toString()).to.equal(values.global_memoo_config_id.toString());
    expect(configAccountUpdate.admin.toString()).to.equal(
      values.platform.publicKey.toString()
    );
    expect(configAccountUpdate.platform.toString()).to.equal(
      values.idoBuyer.publicKey.toString()
    );
    expect(configAccountUpdate.airdropPrice.toString()).to.equal(new BN(123).toString());
    expect(configAccountUpdate.shareCreateFeeNumber.toString()).to.equal(new BN(9).toString());
    const txUpdate1 = await program.methods
      .updateMemooConfig(
        values.global_memoo_config_id,
        values.idoBuyer.publicKey,
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
        new BN(0),
        values.total_supply,
        values.platform_fee_create_meme,
        values.share_create_fee_number
      )
      .accounts({ memooConfig: values.memooConfigPda, admin: values.platform.publicKey })
      .signers([values.platform])
      .rpc();
    console.log(txUpdate1)
    const configAccountUpdate1 = await program.account.globalMemooConfig.fetch(values.memooConfigPda);
    expect(configAccountUpdate1.id.toString()).to.equal(values.global_memoo_config_id.toString());
    expect(configAccountUpdate1.admin.toString()).to.equal(
      values.idoBuyer.publicKey.toString()
    );
    expect(configAccountUpdate1.airdropPrice.toString()).to.equal(new BN(0).toString());
    expect(configAccountUpdate1.shareCreateFeeNumber.toString()).to.equal(values.share_create_fee_number.toString());
  });

  it("Update fail with otherkey", async () => {
    console.log(`values.global_memoo_config_id is ${values.global_memoo_config_id}`)
    console.log(`values.platform_fee_recipient is ${values.platform_fee_recipient.publicKey}`)
    const tx = await program.methods
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
    console.log(tx)
    const configAccount = await program.account.globalMemooConfig.fetch(values.memooConfigPda);
    console.log(`${JSON.stringify(configAccount)}`)
    expect(configAccount.id.toString()).to.equal(values.global_memoo_config_id.toString());
    expect(configAccount.admin.toString()).to.equal(
      values.payerAdmin.publicKey.toString()
    );
    expect(configAccount.airdropPrice.toString()).to.equal(values.airdrop_price.toString());
    try {
      const txUpdate = await program.methods
        .updateMemooConfig(
          values.global_memoo_config_id,
          values.platform.publicKey,
          values.idoBuyer.publicKey,
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
          new BN(123),
          values.total_supply,
          values.platform_fee_create_meme,
          values.share_create_fee_number
        )
        .accounts({ memooConfig: values.memooConfigPda, admin: values.idoBuyer.publicKey })
        .signers([values.idoBuyer])
        .rpc();
      console.log(txUpdate)
      expect("Update fail with otherkey").to.be.empty;
    }
    catch (e) {
      expect(JSON.stringify(e, null, 4)).contain("AdminMismatch")
    }
  });
});
