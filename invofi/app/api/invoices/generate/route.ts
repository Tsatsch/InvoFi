import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

// Define a more specific type for the invoice data expected by the PDF generator
// This should align with the data structure you have for an invoice, e.g., from your DB or frontend type
interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  senderCompany?: string;
  senderName?: string; // Added based on typical invoice needs
  senderAddress?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderVatId?: string;
  senderRegNumber?: string;
  recipientCompany?: string;
  recipientName: string;
  recipientAddress?: string;
  recipientEmail?: string;
  recipientVatId?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  bankName?: string;
  accountNumber?: string;
  bicSwift?: string;
  taxRate?: number;
  notes?: string;
  currency?: string; // Added for currency symbol
  // Add any other fields that your PDF generator uses or might need
  // from the `invoiceDb` object in tokenize/route.ts
  total_amount?: number; 
  subtotal_amount?: number;
}

export async function generateInvoicePdfBytes(invoiceData: InvoicePdfData): Promise<Uint8Array> {
  console.log('[generateInvoicePdfBytes] Generating PDF for invoice:', invoiceData.invoiceNumber);
  
  const issueDate = new Date(invoiceData.issueDate);
  const dueDate = new Date(invoiceData.dueDate);

  if (isNaN(issueDate.getTime()) || isNaN(dueDate.getTime())) {
    throw new Error('Invalid date format for PDF generation');
  }

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  const smallFontSize = 8;
  const lineHeight = 14;
  let y = height - 40;

  const primaryColor = rgb(0.05, 0.05, 0.05);
  const mutedColor = rgb(0.3, 0.3, 0.3);
  const currencySymbol = invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'EUR' ? '€' : (invoiceData.currency || '') + ' ';

  // --- Header ---
  page.drawText(invoiceData.senderCompany || "Your Company", {
    x: 50, y, size: fontSize + 6, font: boldFont, color: primaryColor,
  });
  y -= lineHeight * 1.5;
  page.drawText(invoiceData.senderAddress || "Address", { x: 50, y, size: smallFontSize, font, color: mutedColor });
  y -= lineHeight;
  if(invoiceData.senderVatId) {
    page.drawText(`VAT ID: ${invoiceData.senderVatId}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
    y -= lineHeight;
  }
  if(invoiceData.senderRegNumber) {
    page.drawText(`Reg. No: ${invoiceData.senderRegNumber}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
    y -= lineHeight;
  }
  if (invoiceData.senderEmail) {
    page.drawText(`Email: ${invoiceData.senderEmail}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
    y -= lineHeight;
  }
   if (invoiceData.senderPhone) {
    page.drawText(`Phone: ${invoiceData.senderPhone}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
  }

  // Invoice Title and Number (Right Aligned)
  const titleX = width - 200;
  page.drawText('INVOICE', {
    x: titleX, y: height - 40, size: fontSize + 8, font: boldFont, color: primaryColor,
  });
  page.drawText(`No: ${invoiceData.invoiceNumber}`, {
    x: titleX, y: height - 40 - (lineHeight * 1.5), size: smallFontSize, font, color: mutedColor,
  });
  page.drawText(`Date: ${issueDate.toLocaleDateString('en-GB')}`,
   { x: titleX, y: height - 40 - (lineHeight * 2.5), size: smallFontSize, font, color: mutedColor });
  page.drawText(`Due Date: ${dueDate.toLocaleDateString('en-GB')}`,
   { x: titleX, y: height - 40 - (lineHeight * 3.5), size: smallFontSize, font, color: mutedColor });

  // --- Bill To Section ---
  y = height - 150; 
  page.drawText('BILL TO:', { x: 50, y, size: fontSize, font: boldFont, color: primaryColor });
  y -= lineHeight * 1.5;
  if(invoiceData.recipientCompany) {
    page.drawText(invoiceData.recipientCompany, { x: 50, y, size: smallFontSize, font: boldFont, color: primaryColor });
    y -= lineHeight;
  }
  page.drawText(invoiceData.recipientName, { x: 50, y, size: smallFontSize, font: boldFont, color: primaryColor });
  y -= lineHeight;
  if (invoiceData.recipientAddress) {
    page.drawText(invoiceData.recipientAddress, { x: 50, y, size: smallFontSize, font, color: mutedColor });
    y -= lineHeight;
  }
  if (invoiceData.recipientVatId) {
    page.drawText(`VAT ID: ${invoiceData.recipientVatId}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
    y -= lineHeight;
  }
  if (invoiceData.recipientEmail) {
    page.drawText(`Email: ${invoiceData.recipientEmail}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
  }
  
  // --- Items Table ---
  y = height - 280;
  const tableTopY = y;
  const tableStartX = 50;
  const tableEndX = width - 50;
  const colDescriptionX = tableStartX + 5;
  const colQuantityX = tableStartX + 250;
  const colUnitPriceX = tableStartX + 320;
  const colTotalX = tableStartX + 400;
  const colVatRateX = tableStartX + 200; // Example, adjust if needed for your layout
  const colVatAmountX = tableStartX + 280; // Example, adjust

  // Table Header
  page.drawText('Description', { x: colDescriptionX, y, size: smallFontSize, font: boldFont, color: primaryColor });
  page.drawText('Qty', { x: colQuantityX, y, size: smallFontSize, font: boldFont, color: primaryColor });
  page.drawText('Unit Price', { x: colUnitPriceX, y, size: smallFontSize, font: boldFont, color: primaryColor });
  page.drawText('Total', { x: colTotalX, y, size: smallFontSize, font: boldFont, color: primaryColor });
  y -= lineHeight * 0.5;
  page.drawLine({ start: { x: tableStartX, y }, end: { x: tableEndX, y }, thickness: 1, color: primaryColor });
  y -= lineHeight;

  let currentSubtotal = 0;
  (invoiceData.items || []).forEach(item => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    currentSubtotal += itemTotal;
    page.drawText(item.description || 'N/A', { x: colDescriptionX, y, size: smallFontSize, font, color: primaryColor, maxWidth: (colQuantityX - colDescriptionX - 10) });
    page.drawText((item.quantity || 0).toString(), { x: colQuantityX + 15, y, size: smallFontSize, font, color: primaryColor });
    page.drawText(`${currencySymbol}${(item.unitPrice || 0).toFixed(2)}`, { x: colUnitPriceX + 15, y, size: smallFontSize, font, color: primaryColor });
    page.drawText(`${currencySymbol}${itemTotal.toFixed(2)}`, { x: colTotalX + 20, y, size: smallFontSize, font, color: primaryColor });
    y -= lineHeight * (Math.ceil(font.widthOfTextAtSize(item.description || 'N/A', smallFontSize) / (colQuantityX - colDescriptionX - 10)) || 1) ; // Adjust for multi-line description
    if (y < 150) { // Add new page if content is too long
        page = pdfDoc.addPage(PageSizes.A4);
        y = height - 50;
    }
  });
  y -= lineHeight * 0.5;
  page.drawLine({ start: { x: tableStartX, y }, end: { x: tableEndX, y }, thickness: 0.5, color: mutedColor });
  y -= lineHeight;

  // --- Totals Section ---
  const totalsX = tableEndX - 150;
  page.drawText('Subtotal:', { x: totalsX, y, size: smallFontSize, font, color: primaryColor });
  page.drawText(`${currencySymbol}${currentSubtotal.toFixed(2)}`, { x: tableEndX - 70, y, size: smallFontSize, font, color: primaryColor });
  y -= lineHeight;

  const taxAmount = currentSubtotal * ((invoiceData.taxRate || 0) / 100);
  page.drawText(`VAT (${invoiceData.taxRate || 0}%):
`, { x: totalsX, y, size: smallFontSize, font, color: primaryColor });
  page.drawText(`${currencySymbol}${taxAmount.toFixed(2)}`, { x: tableEndX - 70, y, size: smallFontSize, font, color: primaryColor });
  y -= lineHeight * 0.5;
  page.drawLine({ start: { x: totalsX - 10, y }, end: { x: tableEndX, y }, thickness: 1, color: primaryColor });
  y -= lineHeight;

  const finalTotal = currentSubtotal + taxAmount;
  page.drawText('TOTAL:', { x: totalsX, y, size: fontSize, font: boldFont, color: primaryColor });
  page.drawText(`${currencySymbol}${finalTotal.toFixed(2)}`, { x: tableEndX - 70, y, size: fontSize, font: boldFont, color: primaryColor });
  
  // --- Payment Details & Notes ---
  y = 120;
  if (invoiceData.bankName || invoiceData.accountNumber) {
      page.drawText('Payment Details:', { x: 50, y, size: smallFontSize, font: boldFont, color: primaryColor });
      y -= lineHeight;
      if(invoiceData.bankName) page.drawText(`Bank: ${invoiceData.bankName}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
      y -= lineHeight;
      if(invoiceData.accountNumber) page.drawText(`Account: ${invoiceData.accountNumber}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
      y -= lineHeight;
      if(invoiceData.bicSwift) page.drawText(`BIC/SWIFT: ${invoiceData.bicSwift}`, { x: 50, y, size: smallFontSize, font, color: mutedColor });
      y -= lineHeight;
  }
  
  if (invoiceData.notes) {
    page.drawText('Notes:', { x: 50, y: 80, size: smallFontSize, font: boldFont, color: primaryColor });
    page.drawText(invoiceData.notes, { x: 50, y: 80 - lineHeight, size: smallFontSize, font, color: mutedColor, maxWidth: width - 100, lineHeight: smallFontSize * 1.2 });
  }

  // --- Footer ---
  page.drawText(`Thank you for your business!`, { x: 50, y: 30, size: smallFontSize, font, color: mutedColor });

  return pdfDoc.save();
}

export async function POST(request: Request) {
  try {
    const invoiceDataFromRequest = await request.json();
    
    // Validate required fields for PDF generation (basic validation)
    if (!invoiceDataFromRequest.items || !Array.isArray(invoiceDataFromRequest.items) || invoiceDataFromRequest.items.length === 0) {
      return NextResponse.json({
        error: 'Invalid invoice data',
        details: 'Invoice must have at least one item'
      }, { status: 400 });
    }

    // Map data if necessary to fit InvoicePdfData structure
    // This assumes invoiceDataFromRequest is already largely compatible
    // or you might need a more explicit mapping step here.
    const pdfBytes = await generateInvoicePdfBytes(invoiceDataFromRequest as InvoicePdfData);

    const invoiceNumber = invoiceDataFromRequest.invoiceNumber || `INV-${Date.now()}`;

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoiceNumber}.pdf`
      }
    });
  } catch (error) {
    console.error('[API /generate] Error generating PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 