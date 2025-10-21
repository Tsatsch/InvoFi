import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client'; // For read-only or anon-safe operations
import { supabaseAdmin } from '@/lib/supabase-admin'; // For server-side writes (service role)

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile, createSignerFromKeypair, signerIdentity, generateSigner } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { mplTokenMetadata, createNft } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON IDL import
import invoFiIdl from '@/lib/idl/invo_fi.json';
import { readFile } from "fs/promises"; // To read the wallet file
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'; // To generate a placeholder PDF
import { generateInvoicePdfBytes } from '../../generate/route'; // Adjusted import path
import { env } from 'process';

// Helper function to generate a very simple placeholder PDF
async function generatePlaceholderPdfBytes(invoiceId: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([200, 100]); // Small page
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(`Invoice NFT Placeholder`, { x: 10, y: 70, font, size: 10 });
  page.drawText(`ID: ${invoiceId}`, { x: 10, y: 50, font, size: 8 });
  page.drawText(`Tokenized: ${new Date().toISOString()}`, { x: 10, y: 30, font, size: 8 });
  return pdfDoc.save();
}

export async function POST(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const invoiceId = params.id;

  try {
    console.log(`[API /tokenize] Attempting to tokenize invoice ID: ${invoiceId}`);

    // Resolve RPC URL: prefer SOLANA_RPC_URL; otherwise, use Helius if provided; fallback to public devnet
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    const rpcUrl = process.env.SOLANA_RPC_URL
      || (HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}` : 'https://api.devnet.solana.com');

    // 1. Initialize Umi and Irys uploader
    const umi = createUmi(rpcUrl);
    
    // Load wallet: prefer WALLET_SECRET_KEY (JSON array), fallback to SOLANA_WALLET_KEY (JSON array), then file path via SOLANA_WALLET_PATH
    let walletSecretKey: Uint8Array | undefined;
    const envSecret = process.env.WALLET_SECRET_KEY || process.env.SOLANA_WALLET_KEY;
    if (envSecret) {
      try {
        const parsed = JSON.parse(envSecret);
        walletSecretKey = new Uint8Array(parsed);
      } catch (e) {
        throw new Error('WALLET_SECRET_KEY / SOLANA_WALLET_KEY should be JSON- of the private key');
      }
    } else if (process.env.SOLANA_WALLET_PATH) {
      const walletJsonFromFile = await readFile(process.env.SOLANA_WALLET_PATH, 'utf-8');
      walletSecretKey = new Uint8Array(JSON.parse(walletJsonFromFile));
    } else {
      throw new Error('Not found WALLET_SECRET_KEY (or SOLANA_WALLET_KEY) or SOLANA_WALLET_PATH');
    }

    const signerKeypair = umi.eddsa.createKeypairFromSecretKey(walletSecretKey);
    const signer = createSignerFromKeypair(umi, signerKeypair);

    umi.use(irysUploader()); // Uses default Irys config (devnet)
    umi.use(mplTokenMetadata());
    umi.use(signerIdentity(signer));

    console.log(`[API /tokenize] Umi initialized with signer: ${signer.publicKey}`);

    // 2. Validate Invoice (Optional but recommended - fetch from DB)
    // For now, we assume the invoice ID is valid and ready.
    // You might want to fetch it and check its status like 'APPROVED_FOR_TOKENIZATION'
    const { data: invoiceDb, error: fetchError } = await supabase
      .from('invoices')
      // Ensure all fields required by InvoicePdfData and metadata are selected
      .select('*, status, invoice_number, total_amount, currency, recipient_name, due_date, issue_date, sender_company, sender_address, sender_email, sender_phone, sender_vat_id, sender_reg_number, recipient_company, recipient_address, recipient_email, recipient_vat_id, items, bank_name, account_number, bic_swift, tax_rate, notes, subtotal_amount')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoiceDb) {
      console.error(`[API /tokenize] Invoice not found or error fetching it for ID ${invoiceId}:`, fetchError);
      return NextResponse.json({ error: 'Invoice not found or error fetching it', details: fetchError?.message }, { status: 404 });
    }

    const allowedStatuses = ['APPROVED_FOR_TOKENIZATION', 'METADATA_UPLOADED', 'minted_nft'];
    if (!allowedStatuses.includes(invoiceDb.status)) {
      console.warn(`[API /tokenize] Invoice ${invoiceId} status is ${invoiceDb.status}, not eligible.`);
      return NextResponse.json({ error: `Invoice is not eligible. Current status: ${invoiceDb.status}` }, { status: 400 });
    }
    console.log(`[API /tokenize] Invoice ${invoiceId} validated with status: ${invoiceDb.status}`);
    console.log(`[API /tokenize] Raw invoice data from database:`, JSON.stringify(invoiceDb, null, 2));

    // 3. Generate REAL Invoice PDF using the new function
    // Map invoiceDb to InvoicePdfData structure. Explicit mapping is safer.
    const invoicePdfDataForGeneration = {
        invoiceNumber: invoiceDb.invoice_number || invoiceId,
        issueDate: invoiceDb.issue_date || new Date().toISOString(),
        dueDate: invoiceDb.due_date || new Date().toISOString(),
        senderCompany: invoiceDb.sender_company,
        senderName: invoiceDb.sender_name, // Make sure this field exists in your select and table
        senderAddress: invoiceDb.sender_address,
        senderEmail: invoiceDb.sender_email,
        senderPhone: invoiceDb.sender_phone,
        senderVatId: invoiceDb.sender_vat_id,
        senderRegNumber: invoiceDb.sender_reg_number,
        recipientCompany: invoiceDb.recipient_company,
        recipientName: invoiceDb.recipient_name || 'N/A',
        recipientAddress: invoiceDb.recipient_address,
        recipientEmail: invoiceDb.recipient_email,
        recipientVatId: invoiceDb.recipient_vat_id,
        items: Array.isArray(invoiceDb.items) ? invoiceDb.items : [], // Ensure items is an array
        bankName: invoiceDb.bank_name,
        accountNumber: invoiceDb.account_number,
        bicSwift: invoiceDb.bic_swift,
        taxRate: invoiceDb.tax_rate !== null ? Number(invoiceDb.tax_rate) : 0,
        notes: invoiceDb.notes,
        currency: invoiceDb.currency,
        total_amount: invoiceDb.total_amount !== null ? Number(invoiceDb.total_amount) : 0,
        subtotal_amount: invoiceDb.subtotal_amount !== null ? Number(invoiceDb.subtotal_amount) : 0,
    };

    // Reuse existing URIs if present, otherwise generate & upload
    let pdfIrysGatewayUri = invoiceDb.pdf_uri as string | null;
    let metadataIrysGatewayUri = invoiceDb.metadata_uri as string | null;
    if (!pdfIrysGatewayUri || !metadataIrysGatewayUri) {
      console.log('[API /tokenize] Generating/uploading PDF & metadata...');
      const pdfBytes = await generateInvoicePdfBytes(invoicePdfDataForGeneration);
      const pdfFile = createGenericFile(pdfBytes, `invoice-${invoiceId}.pdf`, { contentType: "application/pdf" });
      const [pdfUri] = await umi.uploader.upload([pdfFile]);
      pdfIrysGatewayUri = "https://gateway.irys.xyz/" + pdfUri.split('/').pop();

    // 4. Construct NFT Metadata
    const metadata = {
        name: `Invoice ${invoiceDb.invoice_number || invoiceId}`,
        symbol: "INVOFI", // Or derive dynamically if needed
        description: `Tokenized invoice ${invoiceDb.invoice_number || invoiceId} for ${invoiceDb.recipient_name || 'N/A'}. Amount: ${invoiceDb.total_amount || 0} ${invoiceDb.currency || 'USD'}. Due: ${invoiceDb.due_date || 'N/A'}`,
        image: pdfIrysGatewayUri, // Using the PDF URI as the "image"
        // external_url: `YOUR_APP_URL/invoice/${invoiceId}`, // Optional: Link back to your app
        attributes: [
            {trait_type: 'Invoice ID', value: invoiceId},
            {trait_type: 'Invoice Number', value: invoiceDb.invoice_number || 'N/A'},
            {trait_type: 'Status', value: 'Tokenized_PreMint'}, // Or similar
            {trait_type: 'Amount', value: (invoiceDb.total_amount || 0).toString()},
            {trait_type: 'Currency', value: invoiceDb.currency || 'USD'},
            {trait_type: 'Due Date', value: invoiceDb.due_date || 'N/A'},
        ],
        properties: {
            files: [
                {
                    type: "application/pdf", // Correct MIME type for the PDF
                    uri: pdfIrysGatewayUri
                },
                // You could add the original invoice data as a JSON file here too
                // { type: "application/json", uri: json_data_uri_if_uploaded }
            ],
            category: "application", // As per Metaplex standards for non-image NFTs
            creators: [
                {
                    address: signer.publicKey.toString(),
                    share: 100
                }
            ]
        },
    };
    console.log(`[API /tokenize] Generated metadata for invoice ${invoiceId}`);

    // 5. Upload Metadata JSON to Irys
    console.log(`[API /tokenize] Uploading metadata JSON for invoice ${invoiceId}...`);
    if (!metadataIrysGatewayUri) {
      const metadataUri = await umi.uploader.uploadJson(metadata);
      metadataIrysGatewayUri = "https://gateway.irys.xyz/" + metadataUri.split('/').pop();
      console.log(`[API /tokenize] Metadata URI (Irys Gateway): ${metadataIrysGatewayUri}`);
    }

    // 6. Mint NFT for the invoice using Token Metadata
    // Mint only if not minted yet
    let mintedAddress = (invoiceDb.mint_address as string) || null;
    let mintSig: string | null = null;
    if (!mintedAddress) {
      console.log(`[API /tokenize] Minting NFT for invoice ${invoiceId}...`);
      const mintSigner = generateSigner(umi);
      const sig = await createNft(umi, {
        mint: mintSigner,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadataIrysGatewayUri!,
        sellerFeeBasisPoints: 0,
        creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }]
      }).sendAndConfirm(umi);
      mintSig = sig;
      mintedAddress = mintSigner.publicKey.toString();
      console.log(`[API /tokenize] NFT minted. Mint: ${mintedAddress}, tx: ${mintSig}`);
    } else {
      console.log(`[API /tokenize] NFT already minted: ${mintedAddress}`);
    }

    // Compute Invoice PDA (off-chain) for convenience
    let invoicePdaStr: string | null = null;
    const programIdStr = process.env.NEXT_PUBLIC_PROGRAM_ID;
    try {
      if (programIdStr) {
        const [pda] = PublicKey.findProgramAddressSync([
          Buffer.from('invoice'),
          new PublicKey(mintedAddress).toBuffer(),
        ], new PublicKey(programIdStr));
        invoicePdaStr = pda.toBase58();
      }
    } catch (e) {
      console.warn('[API /tokenize] PDA computation skipped:', e);
    }

    // 7. Update DB with URIs and on-chain fields
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        status: 'METADATA_UPLOADED',
        status_onchain: mintedAddress ? 'minted_nft' : 'tokenized_metadata',
        pdf_uri: pdfIrysGatewayUri, 
        metadata_uri: metadataIrysGatewayUri,
        tokenize_tx_sig: mintSig ?? invoiceDb.tokenize_tx_sig,
        mint_address: mintedAddress ?? invoiceDb.mint_address,
        invoice_pda: invoicePdaStr
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error(`[API /tokenize] Failed to persist on-chain fields for invoice ${invoiceId}:`, updateError.message);
    }


    // 8. Optionally call Anchor list_invoice to register on-chain
    try {
      const programIdStr = process.env.NEXT_PUBLIC_PROGRAM_ID;
      if (programIdStr && mintedAddress && !invoicePdaStr) {
        const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const conn = new anchor.web3.Connection(rpc, 'confirmed');
        const secretJson = process.env.WALLET_SECRET_KEY || process.env.SOLANA_WALLET_KEY;
        if (!secretJson) throw new Error('Missing WALLET_SECRET_KEY for Anchor call');
        const secret = Uint8Array.from(JSON.parse(secretJson));
        const kp = anchor.web3.Keypair.fromSecretKey(secret);
        const wallet = new anchor.Wallet(kp);
        const provider = new anchor.AnchorProvider(conn, wallet, { commitment: 'confirmed' });
        const programId = new anchor.web3.PublicKey(programIdStr);
        const program = new anchor.Program(invoFiIdl as anchor.Idl, programId, provider);

        const invoiceMintPk = new anchor.web3.PublicKey(mintedAddress);
        const [invoicePda] = anchor.web3.PublicKey.findProgramAddressSync([
          Buffer.from('invoice'), invoiceMintPk.toBuffer()
        ], programId);
        const [usdcVault] = anchor.web3.PublicKey.findProgramAddressSync([
          Buffer.from('vault'), invoicePda.toBuffer()
        ], programId);
        const usdcMint = new anchor.web3.PublicKey(process.env.NEXT_PUBLIC_USDC_DEV_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

        const totalAmount = new anchor.BN(Math.round(Number(invoiceDb.total_amount || 0)));
        const purchasePrice = new anchor.BN(Math.round(Number(invoiceDb.total_amount || 0) * 0.95));
        const dueTs = new anchor.BN(Math.floor(new Date(invoiceDb.due_date || new Date()).getTime() / 1000));
        const riskRating = 1; // medium by default

        const tx = await program.methods
          .listInvoice(totalAmount, purchasePrice, dueTs, riskRating)
          .accounts({
            issuer: kp.publicKey,
            invoiceAccount: invoicePda,
            usdcMint,
            usdcVault,
            invoiceMint: invoiceMintPk,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: new anchor.web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        await supabaseAdmin
          .from('invoices')
          .update({
            status_onchain: 'listed',
            invoice_pda: invoicePda.toBase58(),
            tokenize_tx_sig: tx,
          })
          .eq('id', invoiceId);

        console.log(`[API /tokenize] Anchor list_invoice sent: ${tx}`);
      }
    } catch (e) {
      console.warn('[API /tokenize] Anchor call skipped/failed:', e);
    }

    // 9. Return data to the frontend
    return NextResponse.json({ 
      message: `Metadata prepared for invoice ${invoiceId}. Ready for minting.`,
      invoiceId: invoiceId,
      pdfUri: pdfIrysGatewayUri,
      metadataUri: metadataIrysGatewayUri,
      mintAddress: mintedAddress,
      tokenizeTxSig: mintSig,
      invoicePda: invoicePdaStr,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API /tokenize] Error during tokenization process for invoice ${invoiceId}:`, error);
    // Check for Umi specific errors if possible, otherwise generic
    let errorMessage = 'Failed to tokenize invoice';
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    // Attempt to provide more specific UMI errors if available in logs
    if (error.cause) {
        console.error("[API /tokenize] UMI Error Cause:", error.cause);
    }
    
    return NextResponse.json({ 
      error: 'Failed to complete tokenization process.', 
      details: errorMessage
    }, { status: 500 });
  }
} 