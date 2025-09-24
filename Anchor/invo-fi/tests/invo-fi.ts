import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { InvoFi } from "../target/types/invo_fi";
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("invo-fi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.invoFi as Program<InvoFi>;
  const wallet = anchor.Wallet.local();

  before(async () => {
    // Airdrop SOL to the wallet so it can pay for transactions
    const airdropSignature = await provider.connection.requestAirdrop(
      wallet.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL // 2 SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
        signature: airdropSignature,
        ...latestBlockhash,
    }, "confirmed");
     console.log("Airdropped 2 SOL to the wallet.");
  });

  // AMM Test Constants
  const SEED = new BN(1);
  const FEE = new BN(100); // 1% fee (100 basis points)

  let mintX: PublicKey;
  let mintY: PublicKey;
  const lpMint = Keypair.generate();
  const vaultX = Keypair.generate();
  const vaultY = Keypair.generate();

  // User-specific accounts
  let userVaultX: PublicKey;
  let userVaultY: PublicKey;
  let userLpWallet: PublicKey;

  // Amount of tokens for deposit
  const DEPOSIT_X_AMOUNT = new BN(100 * 10 ** 6); // 100 TOKEN_X
  const DEPOSIT_Y_AMOUNT = new BN(200 * 10 ** 6); // 200 TOKEN_Y


  it("Prepares the test environment", async () => {
    // Create two mints for our token pair
    mintX = await createMint(provider.connection, wallet.payer, wallet.publicKey, null, 6);
    mintY = await createMint(provider.connection, wallet.payer, wallet.publicKey, null, 6);
    console.log("Mint X created:", mintX.toBase58());
    console.log("Mint Y created:", mintY.toBase58());

    // Create user's token accounts (ATAs)
    userVaultX = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mintX, wallet.publicKey)).address;
    userVaultY = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mintY, wallet.publicKey)).address;
    userLpWallet = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, lpMint.publicKey, wallet.publicKey)).address;

    // Mint some tokens to the user's vaults so they have something to deposit
    await mintTo(provider.connection, wallet.payer, mintX, userVaultX, wallet.payer, DEPOSIT_X_AMOUNT.toNumber());
    await mintTo(provider.connection, wallet.payer, mintY, userVaultY, wallet.payer, DEPOSIT_Y_AMOUNT.toNumber());
    
    const initialUserX = await provider.connection.getTokenAccountBalance(userVaultX);
    const initialUserY = await provider.connection.getTokenAccountBalance(userVaultY);

    assert.strictEqual(initialUserX.value.uiAmount, DEPOSIT_X_AMOUNT.toNumber() / (10 ** 6));
    assert.strictEqual(initialUserY.value.uiAmount, DEPOSIT_Y_AMOUNT.toNumber() / (10 ** 6));
  });

  it("Should initialize the AMM", async () => {
    // Derive the PDA for our config account
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), SEED.toBuffer("le", 8)],
      program.programId
    );

    console.log("Initializing AMM with config PDA:", configPda.toBase58());

    const tx = await program.methods
      .initialize(SEED, FEE.toNumber())
      .accounts({
        payer: wallet.publicKey,
        config: configPda,
        mintX: mintX,
        mintY: mintY,
        vaultX: vaultX.publicKey,
        vaultY: vaultY.publicKey,
        lpMint: lpMint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([vaultX, vaultY, lpMint])
      .rpc();

    console.log("Initialize transaction signature", tx);
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Fetch the created account
    const configAccount = await program.account.ammConfig.fetch(configPda);

    // Assertions to verify the state
    assert.ok(configAccount.seed.eq(SEED));
    assert.strictEqual(configAccount.fee, FEE.toNumber());
    assert.ok(configAccount.authority.equals(wallet.publicKey));
    assert.ok(configAccount.mintX.equals(mintX));
    assert.ok(configAccount.mintY.equals(mintY));
    assert.ok(configAccount.vaultX.equals(vaultX.publicKey));
    assert.ok(configAccount.vaultY.equals(vaultY.publicKey));
    assert.ok(configAccount.lpMint.equals(lpMint.publicKey));
  });

  it("Should deposit liquidity", async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), SEED.toBuffer("le", 8)],
        program.programId
      );

    const initialVaultXBalance = (await provider.connection.getTokenAccountBalance(vaultX.publicKey)).value.uiAmount;
    const initialVaultYBalance = (await provider.connection.getTokenAccountBalance(vaultY.publicKey)).value.uiAmount;
    const initialUserLpBalance = (await provider.connection.getTokenAccountBalance(userLpWallet)).value.uiAmount;

    assert.strictEqual(initialVaultXBalance, 0);
    assert.strictEqual(initialVaultYBalance, 0);
    assert.strictEqual(initialUserLpBalance, 0);

    const tx = await program.methods
        .deposit(DEPOSIT_X_AMOUNT, DEPOSIT_Y_AMOUNT)
        .accounts({
            user: wallet.publicKey,
            config: configPda,
            vaultX: vaultX.publicKey,
            vaultY: vaultY.publicKey,
            userVaultX: userVaultX,
            userVaultY: userVaultY,
            lpMint: lpMint.publicKey,
            userLpWallet: userLpWallet,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    
    console.log("Deposit transaction signature", tx);
    await provider.connection.confirmTransaction(tx, "confirmed");

    const finalVaultXBalance = (await provider.connection.getTokenAccountBalance(vaultX.publicKey)).value.uiAmount;
    const finalVaultYBalance = (await provider.connection.getTokenAccountBalance(vaultY.publicKey)).value.uiAmount;
    const finalUserLpBalance = (await provider.connection.getTokenAccountBalance(userLpWallet)).value.uiAmount;
    const finalUserXBalance = (await provider.connection.getTokenAccountBalance(userVaultX)).value.uiAmount;

    assert.strictEqual(finalVaultXBalance, DEPOSIT_X_AMOUNT.toNumber() / (10 ** 6));
    assert.strictEqual(finalVaultYBalance, DEPOSIT_Y_AMOUNT.toNumber() / (10 ** 6));
    assert.strictEqual(finalUserXBalance, 0);
    // Note: We are checking for the hardcoded 100 tokens from the Rust code
    assert.strictEqual(finalUserLpBalance, 100 / (10 ** 6));
  });

  it("Mint invoice NFT Full test", async () => {
  const mintKeypair = anchor.web3.Keypair.generate();

  //:TODO UNhardcode this, put the arguments in the instruction
  const invoiceNumber = "Invoice Number Sample";
  const loanAmount = "1500";
  const currency = "USDT";
  const issuerName = "ООО Ромашка";
  const recipientName = "ИП Василек";
  const issueDate = "2025-05-08";
  const dueDate = "2025-06-08";

    // try{
    // // Add your test here.
    // const txSignature = await program.methods.mintInvoiceNft(invoiceNumber, loanAmount, currency, issuerName, recipientName, issueDate, dueDate)
    // .accountsPartial({
    //   user: wallet.publicKey,
    //   mint: mintKeypair.publicKey,
    //   systemProgram:  SystemProgram.programId,
    //   mplCoreProgram: MPL_CORE_PROGRAM_ID,
    // })
    // .signers([mintKeypair])
    // .rpc(); //simple call, not really a test
    // console.log("Mint Asset transaction signature", txSignature);
    //     await provider.connection.confirmTransaction(txSignature, "confirmed");
    //     console.log("Transaction confirmed!");
    //     console.log(
    //         `Asset created at: https://solscan.io/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`
    //     );
    // } catch (error) {
    //     console.error("Failed to mint asset:", error);
    //     if (error.logs) { // Anchor errors often have logs attached
    //         console.error("Logs:", error.logs);
    //     } else if (error.hasOwnProperty('simulationResponse')) { // For raw SendTransactionErrors
    //         // @ts-ignore
    //         console.error("Simulation Logs:", error.simulationResponse.logs);
    //     }
    // }
  });

  async function fetchAndDisplayAssetPlugins() {
    const assetPublicKey = new PublicKey("5nUu5X6pVBTCPkgWZBd8qWpyc9HP4Hso3z5ypp8oWGHT");

    // 1. Create Umi instance
    const umi = createUmi(provider.connection.rpcEndpoint) // Use your connection's RPC endpoint
        .use(mplCore());

    console.log(`Fetching asset: ${assetPublicKey.toBase58()}`);

    try {
        // 2. Fetch the asset
        const asset = await fetchAsset(umi, publicKey(assetPublicKey.toBase58()));
        console.log("Asset fetched successfully.");
        console.log("Name:", asset.name);
        console.log("URI:", asset.uri);
        console.log("Owner:", asset.owner.toString());
        console.log("Update Authority:", asset.updateAuthority.toString());

        // 3. Access plugins - specifically looking for Attributes
        if (asset.plugins) {
            console.log("\nPlugins found:");
            for (const plugin of asset.plugins) {
                // Check if the plugin is an Attributes plugin
                // The structure of 'plugin' might vary; you might need to check its 'type' or a specific field.
                // With mplCore, it should deserialize into the correct plugin types.

                if (plugin.__kind === 'Attributes') { // mplCore uses __kind for discriminated unions
                    const attributesPlugin = plugin as AttributesPlugin;
                    console.log("  Plugin Type: Attributes");
                    if (attributesPlugin.attributeList && attributesPlugin.attributeList.length > 0) {
                        console.log("  Attributes:");
                        attributesPlugin.attributeList.forEach(attr => {
                            console.log(`    - ${attr.key}: ${attr.value}`);
                        });
                    } else {
                        console.log("  No attributes in this plugin.");
                    }
                } else {
                    console.log(`  Plugin Type: ${plugin.__kind}`);
                    // You can add more checks for other plugin types if you use them
                }
            }
        } else {
            console.log("No plugins found on the asset.");
        }

    } catch (e) {
        console.error("Failed to fetch or parse asset:", e);
    }
}
  //it("Mint invoice NFT Basic test", async () => {
    // Add your test here.
    //const txSignature = await program.methods.mintInvoiceNft().rpc(); //simple call, not really a test
    //console.log("Your transaction signature", txSignature);
  //}); 
});
