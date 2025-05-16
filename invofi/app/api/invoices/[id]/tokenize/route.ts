import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client'; // For database interactions
import { HELIUS_API_KEY, SOLANA_WALLET_PATH } from '@/lib/config'; // Project config

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile, createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises"; // To read the wallet file
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'; // To generate a placeholder PDF
import { generateInvoicePdfBytes } from '../../generate/route'; // Adjusted import path

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

    // 1. Initialize Umi and Irys uploader
    const umi = createUmi(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`);
    
    // Load wallet
    const walletJson = await readFile(SOLANA_WALLET_PATH, 'utf-8');
    const walletSecretKey = new Uint8Array(JSON.parse(walletJson));
    const signerKeypair = umi.eddsa.createKeypairFromSecretKey(walletSecretKey);
    const signer = createSignerFromKeypair(umi, signerKeypair);

    umi.use(irysUploader()); // Uses default Irys config (devnet)
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

    if (invoiceDb.status !== 'APPROVED_FOR_TOKENIZATION') {
      console.warn(`[API /tokenize] Invoice ${invoiceId} status is ${invoiceDb.status}, not APPROVED_FOR_TOKENIZATION.`);
      return NextResponse.json({ error: `Invoice is not approved for tokenization. Current status: ${invoiceDb.status}` }, { status: 400 });
    }
    console.log(`[API /tokenize] Invoice ${invoiceId} validated with status: ${invoiceDb.status}`);

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

    console.log('[API /tokenize] Generating actual PDF for invoice:', invoicePdfDataForGeneration.invoiceNumber);
    const pdfBytes = await generateInvoicePdfBytes(invoicePdfDataForGeneration);
    const pdfFile = createGenericFile(pdfBytes, `invoice-${invoiceId}.pdf`, { // Using a more generic name
        contentType: "application/pdf",
    });
    
    console.log(`[API /tokenize] Uploading actual PDF for invoice ${invoiceId}...`);
    const [pdfUri] = await umi.uploader.upload([pdfFile]);
    const pdfIrysGatewayUri = "https://gateway.irys.xyz/" + pdfUri.split('/').pop();
    console.log(`[API /tokenize] Actual PDF URI (Irys Gateway): ${pdfIrysGatewayUri}`);

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
    const metadataUri = await umi.uploader.uploadJson(metadata);
    const metadataIrysGatewayUri = "https://gateway.irys.xyz/" + metadataUri.split('/').pop();
    console.log(`[API /tokenize] Metadata URI (Irys Gateway): ${metadataIrysGatewayUri}`);

    // 6. TODO: Update Invoice Status in DB (e.g., to 'METADATA_UPLOADED', and store URIs)
    // This is a crucial step before actual minting.
    // For now, we'll just log. In a real app, update the DB.
     const { error: updateError } = await supabase
       .from('invoices')
       .update({ 
         // status: 'METADATA_UPLOADED', // Example new status
         // pdf_uri: pdfIrysGatewayUri, 
         // metadata_uri: metadataIrysGatewayUri 
         // You might need to add these columns to your 'invoices' table
       })
       .eq('id', invoiceId);

     if (updateError) {
       console.error(`[API /tokenize] Failed to update invoice ${invoiceId} with metadata URIs:`, updateError.message);
       // Not returning error for now to allow frontend to proceed with URIs, but log it
     } else {
       console.log(`[API /tokenize] Successfully logged (simulated update) for invoice ${invoiceId} with URIs.`);
     }


    // 7. Return URIs to the frontend
    return NextResponse.json({ 
      message: `Metadata prepared for invoice ${invoiceId}. Ready for minting.`,
      invoiceId: invoiceId,
      pdfUri: pdfIrysGatewayUri,
      metadataUri: metadataIrysGatewayUri,
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