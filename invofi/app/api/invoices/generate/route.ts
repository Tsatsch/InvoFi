import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const invoiceData = await request.json();
    console.log('Received invoice data:', JSON.stringify(invoiceData, null, 2));

    // Validate required fields
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid invoice data',
        details: 'Invoice must have at least one item'
      }, { status: 400 });
    }

    // Ensure dates are valid
    const issueDate = new Date(invoiceData.issueDate);
    const dueDate = new Date(invoiceData.dueDate);
    
    if (isNaN(issueDate.getTime()) || isNaN(dueDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid invoice data',
        details: 'Invalid date format'
      }, { status: 400 });
    }

    // Generate a unique invoice number if not provided
    const invoiceNumber = invoiceData.invoiceNumber || `INV-${Date.now()}`;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Embed the standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set up text properties
    const fontSize = 12;
    const smallFontSize = 10;
    const lineHeight = 15;
    let y = height - 50; // Start from top with margin

    // Colors
    const primaryColor = rgb(0, 0, 0);
    const mutedColor = rgb(0.4, 0.4, 0.4);

    // Header with company details
    page.drawText(invoiceData.senderCompany || "Your Company Name", {
      x: 50,
      y,
      size: fontSize + 4,
      font: boldFont,
      color: primaryColor,
    });
    y -= lineHeight;

    page.drawText(invoiceData.senderAddress || "Your Address", {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });
    y -= lineHeight;

    page.drawText(`VAT ID: ${invoiceData.senderVatId || "VAT ID"}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });
    y -= lineHeight;

    page.drawText(`Registration Number: ${invoiceData.senderRegNumber || "Reg. No."}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });
    y -= lineHeight;

    page.drawText(`Email: ${invoiceData.senderEmail}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });
    y -= lineHeight;

    page.drawText(`Phone: ${invoiceData.senderPhone}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    // Invoice title and number
    page.drawText('TAX INVOICE', {
      x: width - 250,
      y: height - 50,
      size: fontSize + 8,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText(`Invoice No: ${invoiceNumber}`, {
      x: width - 250,
      y: height - 80,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    page.drawText(`Date: ${issueDate.toLocaleDateString('en-GB')}`, {
      x: width - 250,
      y: height - 95,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    page.drawText(`Due Date: ${dueDate.toLocaleDateString('en-GB')}`, {
      x: width - 250,
      y: height - 110,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    // Draw a line to separate header
    page.drawLine({
      start: { x: 50, y: height - 150 },
      end: { x: width - 50, y: height - 150 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Customer details
    y = height - 200;
    page.drawText('Bill To:', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: primaryColor,
    });
    y -= lineHeight;

    page.drawText(invoiceData.recipientCompany || "Client Company", {
      x: 50,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });
    y -= lineHeight;

    page.drawText(invoiceData.recipientName || "Client Name", {
      x: 50,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });
    y -= lineHeight;

    page.drawText(invoiceData.recipientAddress || "Client Address", {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });
    y -= lineHeight;

    page.drawText(`VAT ID: ${invoiceData.recipientVatId || "VAT ID"}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });
    y -= lineHeight;

    page.drawText(`Email: ${invoiceData.recipientEmail}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    // Items table
    y -= lineHeight * 2;
    const tableStartX = 50;
    const tableEndX = width - 50;
    const columnWidths = {
      description: 200,
      quantity: 60,
      unitPrice: 80,
      vatRate: 60,
      vatAmount: 80,
      total: 80
    };

    // Table header text
    page.drawText('Description', {
      x: tableStartX + 10,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('Quantity', {
      x: tableStartX + columnWidths.description,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('Unit Price', {
      x: tableStartX + columnWidths.description + columnWidths.quantity,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('VAT Rate', {
      x: tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('VAT Amount', {
      x: tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('Total', {
      x: tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate + columnWidths.vatAmount,
      y,
      size: smallFontSize,
      font: boldFont,
      color: primaryColor,
    });

    // Table rows
    y -= lineHeight;
    let subtotal = 0;

    invoiceData.items.forEach((item: { description: string; quantity: number; unitPrice: number }) => {
      const total = item.quantity * item.unitPrice;
      const vatAmount = total * (invoiceData.taxRate / 100);
      subtotal += total;

      page.drawText(item.description || "Item description", {
        x: tableStartX + 10,
        y,
        size: smallFontSize,
        font,
        color: primaryColor,
      });

      page.drawText(item.quantity.toString(), {
        x: tableStartX + columnWidths.description,
        y,
        size: smallFontSize,
        font,
        color: primaryColor,
      });

      page.drawText(`€${item.unitPrice.toFixed(2)}`, {
        x: tableStartX + columnWidths.description + columnWidths.quantity,
        y,
        size: smallFontSize,
        font,
        color: primaryColor,
      });

      page.drawText(`${invoiceData.taxRate}%`, {
        x: tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice,
        y,
        size: smallFontSize,
        font,
        color: primaryColor,
      });

      page.drawText(`€${vatAmount.toFixed(2)}`, {
        x: tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate,
        y,
        size: smallFontSize,
        font,
        color: primaryColor,
      });

      page.drawText(`€${total.toFixed(2)}`, {
        x: tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate + columnWidths.vatAmount,
        y,
        size: smallFontSize,
        font,
        color: primaryColor,
      });

      y -= lineHeight;
    });

    // Draw final table border
    page.drawLine({
      start: { x: tableStartX, y: y + 5 },
      end: { x: tableEndX, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Totals
    const tax = subtotal * (invoiceData.taxRate / 100);
    const total = subtotal + tax;

    y -= lineHeight;
    const totalX = tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate;

    page.drawText('Subtotal:', {
      x: totalX,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    page.drawText(`€${subtotal.toFixed(2)}`, {
      x: totalX + columnWidths.vatAmount,
      y,
      size: smallFontSize,
      font,
      color: primaryColor,
    });

    y -= lineHeight;
    page.drawText(`VAT (${invoiceData.taxRate}%):`, {
      x: totalX,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    page.drawText(`€${tax.toFixed(2)}`, {
      x: totalX + columnWidths.vatAmount,
      y,
      size: smallFontSize,
      font,
      color: primaryColor,
    });

    y -= lineHeight;
    // Draw total separator line
    page.drawLine({
      start: { x: totalX, y: y + 5 },
      end: { x: tableEndX, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    y -= lineHeight;
    page.drawText('Total:', {
      x: totalX,
      y,
      size: fontSize,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText(`€${total.toFixed(2)}`, {
      x: totalX + columnWidths.vatAmount,
      y,
      size: fontSize,
      font: boldFont,
      color: primaryColor,
    });

    // Payment details
    y -= lineHeight * 2;
    page.drawText('Payment Details:', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: primaryColor,
    });

    y -= lineHeight;
    page.drawText(`Bank: ${invoiceData.bankName}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: primaryColor,
    });

    y -= lineHeight;
    page.drawText(`IBAN: ${invoiceData.accountNumber}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: primaryColor,
    });

    y -= lineHeight;
    page.drawText(`BIC/SWIFT: ${invoiceData.bicSwift || "BIC/SWIFT"}`, {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: primaryColor,
    });

    // Terms and conditions
    y -= lineHeight * 2;
    page.drawText('Terms and Conditions:', {
      x: 50,
      y,
      size: fontSize,
      font: boldFont,
      color: primaryColor,
    });

    y -= lineHeight;
    page.drawText('1. Payment is due within 30 days of invoice date.', {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    y -= lineHeight;
    page.drawText('2. Late payments are subject to interest charges.', {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    y -= lineHeight;
    page.drawText('3. All amounts are in EUR.', {
      x: 50,
      y,
      size: smallFontSize,
      font,
      color: mutedColor,
    });

    // Notes
    if (invoiceData.notes) {
      y -= lineHeight * 2;
      page.drawText('Notes:', {
        x: 50,
        y,
        size: fontSize,
        font: boldFont,
        color: primaryColor,
      });

      y -= lineHeight;
      page.drawText(invoiceData.notes, {
        x: 50,
        y,
        size: smallFontSize,
        font,
        color: mutedColor,
      });
    }

    // Footer
    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: width - 50, y: 50 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText('This is a legally binding invoice. Please retain for your records.', {
      x: 50,
      y: 40,
      size: 8,
      font,
      color: mutedColor,
    });

    page.drawText(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, {
      x: width - 200,
      y: 40,
      size: 8,
      font,
      color: mutedColor,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Return the PDF
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoiceNumber}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 