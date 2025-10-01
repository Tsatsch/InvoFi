import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InvoFi } from "../target/types/invo_fi";
import { assert } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";

describe("invo_fi", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.InvoFi as Program<InvoFi>;

  // Test accounts
  let usdcMint: Keypair;
  let invoiceMint: Keypair;
  let invoicePda: PublicKey;
  let usdcVaultPda: PublicKey;
  
  const contributorOne = Keypair.generate();
  const contributorTwo = Keypair.generate();
  const debtor = Keypair.generate();

  let issuerUsdcAccount: PublicKey;
  let contributorOneUsdcAccount: PublicKey;
  let contributorTwoUsdcAccount: PublicKey;
  let debtorUsdcAccount: PublicKey;

  it("Prepares the test environment", async () => {
    // Airdrop SOL for gas fees
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(contributorOne.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(contributorTwo.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(debtor.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Create USDC mint
    usdcMint = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    const createUsdcMintTx = new anchor.web3.Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: usdcMint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(usdcMint.publicKey, 6, wallet.publicKey, wallet.publicKey)
    );
    await provider.sendAndConfirm(createUsdcMintTx, [usdcMint]);

    // Create Associated Token Accounts
    issuerUsdcAccount = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, usdcMint.publicKey, wallet.publicKey)).address;
    contributorOneUsdcAccount = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, usdcMint.publicKey, contributorOne.publicKey)).address;
    contributorTwoUsdcAccount = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, usdcMint.publicKey, contributorTwo.publicKey)).address;
    debtorUsdcAccount = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, usdcMint.publicKey, debtor.publicKey)).address;

    // Mint USDC to contributors and debtor
    const mintAmount = new anchor.BN(10000 * 10**6); // 10,000 USDC
    await mintTo(provider.connection, wallet.payer, usdcMint.publicKey, contributorOneUsdcAccount, wallet.publicKey, mintAmount.toNumber());
    await mintTo(provider.connection, wallet.payer, usdcMint.publicKey, contributorTwoUsdcAccount, wallet.publicKey, mintAmount.toNumber());
    await mintTo(provider.connection, wallet.payer, usdcMint.publicKey, debtorUsdcAccount, wallet.publicKey, mintAmount.toNumber());
    
    // Create Invoice NFT mint
    invoiceMint = Keypair.generate();
    const createInvoiceMintTx = new anchor.web3.Transaction().add(
      SystemProgram.createAccount({ fromPubkey: wallet.publicKey, newAccountPubkey: invoiceMint.publicKey, space: MINT_SIZE, lamports, programId: TOKEN_PROGRAM_ID }),
      createInitializeMintInstruction(invoiceMint.publicKey, 6, wallet.publicKey, wallet.publicKey)
    );
    await provider.sendAndConfirm(createInvoiceMintTx, [invoiceMint]);

    // Derive PDAs
    [invoicePda] = PublicKey.findProgramAddressSync([Buffer.from("invoice"), invoiceMint.publicKey.toBuffer()], program.programId);
    [usdcVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), invoicePda.toBuffer()], program.programId);
  });

  it("Should list a new invoice for USDC funding", async () => {
    const totalAmount = new anchor.BN(10000 * 10**6);
    const purchasePrice = new anchor.BN(9500 * 10**6);
    const dueDate = new anchor.BN(new Date().getTime() / 1000 + 30 * 24 * 60 * 60);
    const riskRating = 1;

    await program.methods
      .listInvoice(totalAmount, purchasePrice, dueDate, riskRating)
      .accounts({
        issuer: wallet.publicKey,
        invoiceAccount: invoicePda,
        usdcMint: usdcMint.publicKey,
        usdcVault: usdcVaultPda,
        invoiceMint: invoiceMint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const invoiceAccountData = await program.account.invoice.fetch(invoicePda);
    assert.ok(invoiceAccountData.issuer.equals(wallet.publicKey));
    assert.equal(invoiceAccountData.purchasePrice.toString(), purchasePrice.toString());
    assert.equal(invoiceAccountData.status, 0); // Funding

    const vaultAccount = await getAccount(provider.connection, usdcVaultPda);
    assert.equal(vaultAccount.amount.toString(), "0");
  });

  it("Should allow a contributor to partially fund with USDC", async () => {
    const contributionAmount = new anchor.BN(5000 * 10 ** 6);

    await program.methods
      .contribute(contributionAmount)
      .accounts({
        contributor: contributorOne.publicKey,
        contributorUsdcAccount: contributorOneUsdcAccount,
        invoiceAccount: invoicePda,
        usdcVault: usdcVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([contributorOne])
      .rpc();

    const vaultAccount = await getAccount(provider.connection, usdcVaultPda);
    assert.equal(vaultAccount.amount.toString(), contributionAmount.toString());

    const invoiceAccountData = await program.account.invoice.fetch(invoicePda);
    assert.equal(invoiceAccountData.totalFundedAmount.toString(), contributionAmount.toString());
    assert.equal(invoiceAccountData.contributorCount, 1);
    assert.equal(invoiceAccountData.status, 0); // Still Funding
  });

  it("Should allow a second contributor to fully fund with USDC", async () => {
    const remainingAmount = new anchor.BN(4500 * 10 ** 6); 
    const finalFundedAmount = new anchor.BN(9500 * 10 ** 6);

    await program.methods
      .contribute(remainingAmount)
      .accounts({
        contributor: contributorTwo.publicKey,
        contributorUsdcAccount: contributorTwoUsdcAccount,
        invoiceAccount: invoicePda,
        usdcVault: usdcVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([contributorTwo])
      .rpc();

    const vaultAccount = await getAccount(provider.connection, usdcVaultPda);
    assert.equal(vaultAccount.amount.toString(), finalFundedAmount.toString());

    const invoiceAccountData = await program.account.invoice.fetch(invoicePda);
    assert.equal(invoiceAccountData.status, 1); // Now Financed
  });

  it("Should allow the issuer to claim the USDC funds", async () => {
    const expectedTransferAmount = new anchor.BN(9500 * 10 ** 6);

    await program.methods
        .claimFunding()
        .accounts({
            issuer: wallet.publicKey,
            issuerUsdcAccount: issuerUsdcAccount,
            invoiceAccount: invoicePda,
            usdcVault: usdcVaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    
    const vaultAccount = await getAccount(provider.connection, usdcVaultPda);
    assert.equal(vaultAccount.amount.toString(), "0");

    const issuerAccount = await getAccount(provider.connection, issuerUsdcAccount);
    assert.equal(issuerAccount.amount.toString(), expectedTransferAmount.toString());
  });

  it("Should allow the debtor to repay and distribute USDC profits", async () => {
    // Fetch latest data
    const invoiceAccountData = await program.account.invoice.fetch(invoicePda);
    const totalAmount = invoiceAccountData.totalAmount;

    // Build remaining accounts from on-chain data
    const remainingAccounts = [];
    // Prepend token program, vault (from) and invoice PDA (authority) to unify lifetimes in CPI
    remainingAccounts.push({
      pubkey: TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: usdcVaultPda,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: invoicePda,
      isWritable: false,
      isSigner: false,
    });
    for (let i = 0; i < invoiceAccountData.contributorCount; i++) {
        const contributorPubkey = invoiceAccountData.contributors[i].contributor;
        // We need the associated token account for each contributor
        const contributorAta = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, usdcMint.publicKey, contributorPubkey)).address;
        remainingAccounts.push({
            pubkey: contributorAta,
            isWritable: true,
            isSigner: false,
        });
    }

    // Get initial balances
    const contributorOneInitialBalance = (await getAccount(provider.connection, contributorOneUsdcAccount)).amount;
    const contributorTwoInitialBalance = (await getAccount(provider.connection, contributorTwoUsdcAccount)).amount;

    await program.methods
        .repayAndDistribute()
        .accounts({
            payer: debtor.publicKey,
            payerUsdcAccount: debtorUsdcAccount,
            invoiceAccount: invoicePda,
            usdcVault: usdcVaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .signers([debtor])
        .rpc();

    // --- Assertions ---
    const finalInvoiceData = await program.account.invoice.fetch(invoicePda);
    assert.equal(finalInvoiceData.status, 2); // Repaid

    // Check balances
    const contributorOneFinalBalance = (await getAccount(provider.connection, contributorOneUsdcAccount)).amount;
    const contributorTwoFinalBalance = (await getAccount(provider.connection, contributorTwoUsdcAccount)).amount;

    const purchasePrice = invoiceAccountData.purchasePrice;
    const totalProfit = totalAmount.sub(purchasePrice);

    const contributorOneProfit = totalProfit.mul(invoiceAccountData.contributors[0].amount).div(purchasePrice);
    const expectedPayoutOne = invoiceAccountData.contributors[0].amount.add(contributorOneProfit);

    const remainingProfit = totalProfit.sub(contributorOneProfit);
    const expectedPayoutTwo = invoiceAccountData.contributors[1].amount.add(remainingProfit);

    assert.equal(
        (contributorOneFinalBalance - contributorOneInitialBalance).toString(), 
        expectedPayoutOne.toString()
    );
    assert.equal(
        (contributorTwoFinalBalance - contributorTwoInitialBalance).toString(), 
        expectedPayoutTwo.toString()
    );

    const finalVaultBalance = (await getAccount(provider.connection, usdcVaultPda)).amount;
    assert.equal(finalVaultBalance.toString(), "0");
  });
});
