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
  createMint,
} from "@solana/spl-token";


describe("invo_fi", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.InvoFi as Program<InvoFi>;

  // Test state
  let invoiceMint: Keypair;

  it("Prepares the test environment", async () => {
    // Create a new mint for the invoice NFT
    invoiceMint = Keypair.generate();

    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);

    const tx = new anchor.web3.Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: invoiceMint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        invoiceMint.publicKey,
        6, // decimals
        wallet.publicKey, // mint authority
        wallet.publicKey  // freeze authority
      )
    );
    
    await provider.sendAndConfirm(tx, [invoiceMint]);
    console.log("Invoice NFT Mint created:", invoiceMint.publicKey.toBase58());
  });


  it("Should list a new invoice", async () => {
    // Define invoice parameters
    const totalAmount = new anchor.BN(10000 * 10**6); // $10,000
    const purchasePrice = new anchor.BN(9500 * 10**6); // $9,500
    const dueDate = new anchor.BN(new Date().getTime() / 1000 + 30 * 24 * 60 * 60); // 30 days from now
    const riskRating = 1; // Medium Risk

    // Derive the PDA for the invoice account
    const [invoicePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("invoice"), invoiceMint.publicKey.toBuffer()],
      program.programId
    );

    // Call the list_invoice instruction
    const tx = await program.methods
      .listInvoice(totalAmount, purchasePrice, dueDate, riskRating)
      .accounts({
        issuer: wallet.publicKey,
        invoiceAccount: invoicePda,
        invoiceMint: invoiceMint.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("List invoice transaction signature", tx);
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Fetch the created invoice account
    const invoiceAccountData = await program.account.invoice.fetch(invoicePda);
    
    // Assertions
    assert.ok(invoiceAccountData.issuer.equals(wallet.publicKey));
    assert.equal(invoiceAccountData.totalAmount.toString(), totalAmount.toString());
    assert.equal(invoiceAccountData.purchasePrice.toString(), purchasePrice.toString());
    assert.equal(invoiceAccountData.dueDate.toString(), dueDate.toString());
    assert.equal(invoiceAccountData.riskRating, riskRating);
    assert.ok(invoiceAccountData.invoiceMint.equals(invoiceMint.publicKey));
    assert.equal(invoiceAccountData.contributorCount, 0);
    assert.deepStrictEqual(invoiceAccountData.status, { funding: {} }); // Check if status is Funding
  });

});
