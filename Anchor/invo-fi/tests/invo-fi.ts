import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InvoFi } from "../target/types/invo_fi";
import { Keypair } from "@solana/web3.js";
import {MPL_CORE_PROGRAM_ID} from "@metaplex-foundation/mpl-core";
import { SystemProgram } from "@solana/web3.js";
import { program, SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

describe("invo-fi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  let provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.invoFi as Program<InvoFi>;
  let wallet = anchor.Wallet.local();

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

    try{
    // Add your test here.
    const txSignature = await program.methods.mintInvoiceNft(invoiceNumber, loanAmount, currency, issuerName, recipientName, issueDate, dueDate)
    .accountsPartial({
      user: wallet.publicKey,
      mint: mintKeypair.publicKey,
      systemProgram:  SystemProgram.programId,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
    })
    .signers([mintKeypair])
    .rpc(); //simple call, not really a test
    console.log("Mint Asset transaction signature", txSignature);
        await provider.connection.confirmTransaction(txSignature, "confirmed");
        console.log("Transaction confirmed!");
        console.log(
            `Asset created at: https://solscan.io/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`
        );
    } catch (error) {
        console.error("Failed to mint asset:", error);
        if (error.logs) { // Anchor errors often have logs attached
            console.error("Logs:", error.logs);
        } else if (error.hasOwnProperty('simulationResponse')) { // For raw SendTransactionErrors
            // @ts-ignore
            console.error("Simulation Logs:", error.simulationResponse.logs);
        }
    }
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
