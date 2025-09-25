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
  let lpTokensReceived: BN;

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
    // Create the user's LP token account now that the mint exists
    userLpWallet = (await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, lpMint.publicKey, wallet.publicKey)).address;

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
    // Calculate the expected LP tokens using the formula from the contract
    const expectedLpAmount = new BN(Math.floor(Math.sqrt(DEPOSIT_X_AMOUNT.toNumber() * DEPOSIT_Y_AMOUNT.toNumber())));
    lpTokensReceived = expectedLpAmount;
    
    // The uiAmount is the raw amount divided by 10^decimals
    assert.strictEqual(finalUserLpBalance, expectedLpAmount.toNumber() / (10 ** 6));
  });

  it("Should withdraw liquidity", async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), SEED.toBuffer("le", 8)],
        program.programId
    );
    
    // Withdraw half of the LP tokens
    const lpAmountToWithdraw = new BN(lpTokensReceived.toNumber() / 2);

    // Get balances before
    const initialVaultX = (await provider.connection.getTokenAccountBalance(vaultX.publicKey)).value.uiAmount;
    const initialVaultY = (await provider.connection.getTokenAccountBalance(vaultY.publicKey)).value.uiAmount;
    const initialUserLp = (await provider.connection.getTokenAccountBalance(userLpWallet)).value.uiAmount;
    
    const tx = await program.methods
        .withdraw(lpAmountToWithdraw)
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
        
    console.log("Withdraw transaction signature", tx);
    await provider.connection.confirmTransaction(tx, "confirmed");

    // Get balances after
    const finalVaultX = (await provider.connection.getTokenAccountBalance(vaultX.publicKey)).value.uiAmount;
    const finalUserLp = (await provider.connection.getTokenAccountBalance(userLpWallet)).value.uiAmount;

    // Assertions
    // We withdrew half the LP, so half the liquidity should be left.
    assert.strictEqual(finalVaultX, initialVaultX / 2);
    // User LP balance should be halved.
    assert.strictEqual(finalUserLp, initialUserLp / 2);
  });

  it("Should swap X for Y", async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), SEED.toBuffer("le", 8)],
        program.programId
    );
    
    // Swap 10 X tokens
    const amountIn = new BN(10 * 10 ** 6);
    // Slippage tolerance: 5%
    // THIS IS A SIMPLIFIED CALCULATION FOR TEST. Real clients would calculate this more precisely.
    const minAmountOut = new BN(0); // For simplicity in test, we accept any amount out.

    const initialUserX = (await provider.connection.getTokenAccountBalance(userVaultX)).value.amount;
    const initialUserY = (await provider.connection.getTokenAccountBalance(userVaultY)).value.amount;
    
    const tx = await program.methods
        .swap(amountIn, minAmountOut)
        .accounts({
            user: wallet.publicKey,
            config: configPda,
            vaultX: vaultX.publicKey,
            vaultY: vaultY.publicKey,
            userVaultX: userVaultX,
            userVaultY: userVaultY,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

    console.log("Swap transaction signature", tx);
    await provider.connection.confirmTransaction(tx, "confirmed");

    const finalUserX = (await provider.connection.getTokenAccountBalance(userVaultX)).value.amount;
    const finalUserY = (await provider.connection.getTokenAccountBalance(userVaultY)).value.amount;

    // Assert that user's X balance decreased and Y balance increased.
    assert(new BN(finalUserX).lt(new BN(initialUserX)));
    assert(new BN(finalUserY).gt(new BN(initialUserY)));
  });

  it("Should fail swap due to slippage", async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), SEED.toBuffer("le", 8)],
        program.programId
    );
    
    const amountIn = new BN(10 * 10 ** 6);
    // Set an impossibly high minimum amount out to trigger slippage error
    const minAmountOut = new BN(100_000 * 10 ** 6);

    try {
        await program.methods
            .swap(amountIn, minAmountOut)
            .accounts({
                user: wallet.publicKey,
                config: configPda,
                vaultX: vaultX.publicKey,
                vaultY: vaultY.publicKey,
                userVaultX: userVaultX,
                userVaultY: userVaultY,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();
        // If the transaction succeeds, the test should fail.
        assert.fail("Transaction should have failed due to slippage.");
    } catch (err) {
        // Check that the error is the custom error we defined.
        assert.strictEqual(err.error.errorCode.code, "SlippageExceeded");
    }
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
