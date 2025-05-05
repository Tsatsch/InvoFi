import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', // Local development
    'https://your-vercel-app.vercel.app', // Your Vercel frontend
    'https://*.vercel.app' // All Vercel preview deployments
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Generate PDF from invoice data
app.post('/api/invoices/generate', (req: Request, res: Response) => {
  const invoiceData = req.body;

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceData.invoiceNumber}.pdf`);

  // Pipe the PDF to the response
  doc.pipe(res);

  // Colors
  const primaryColor = '#000000';
  const mutedColor = '#666666';
  const borderColor = '#E5E7EB';

  // Header with company details
  doc.fontSize(16)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text(invoiceData.senderCompany || "Your Company Name", 50, 50)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(mutedColor)
    .text(invoiceData.senderAddress || "Your Address", 50, 70)
    .text(`VAT ID: ${invoiceData.senderVatId || "VAT ID"}`, 50, 85)
    .text(`Registration Number: ${invoiceData.senderRegNumber || "Reg. No."}`, 50, 100)
    .text(`Email: ${invoiceData.senderEmail}`, 50, 115)
    .text(`Phone: ${invoiceData.senderPhone}`, 50, 130);

  // Invoice title and number
  doc.fontSize(20)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('TAX INVOICE', { align: 'right' })
    .font('Helvetica')
    .fontSize(10)
    .fillColor(mutedColor)
    .text(`Invoice No: ${invoiceData.invoiceNumber || "INV-001"}`, { align: 'right' })
    .text(`Date: ${new Date(invoiceData.issueDate).toLocaleDateString('en-GB')}`, { align: 'right' })
    .text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString('en-GB')}`, { align: 'right' });

  // Customer details
  let y = 200;
  doc.fontSize(12)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('Bill To:', 50, y)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(primaryColor)
    .text(invoiceData.recipientCompany || "Client Company", 50, y + 20)
    .text(invoiceData.recipientName || "Client Name", 50, y + 35)
    .fillColor(mutedColor)
    .text(invoiceData.recipientAddress || "Client Address", 50, y + 50)
    .text(`VAT ID: ${invoiceData.recipientVatId || "VAT ID"}`, 50, y + 65)
    .text(`Email: ${invoiceData.recipientEmail}`, 50, y + 80);

  y = doc.y + 30;

  // Items table header
  const tableStartX = 50;
  const tableEndX = 500;
  const columnWidths = {
    description: 125,
    quantity: 50,
    unitPrice: 80,
    vatRate: 50,
    vatAmount: 80,
    total: 80
  };

  // Draw table header line
  doc.moveTo(tableStartX, y + 5)
    .lineTo(tableEndX, y + 5)
    .strokeColor(borderColor)
    .stroke();

  y += 20;

  // Table header text
  doc.fontSize(10)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('Description', tableStartX, y)
    .text('Quantity', tableStartX + columnWidths.description, y, { width: columnWidths.quantity, align: 'right' })
    .text('Unit Price', tableStartX + columnWidths.description + columnWidths.quantity, y, { width: columnWidths.unitPrice, align: 'right' })
    .text('VAT Rate', tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice, y, { width: columnWidths.vatRate, align: 'right' })
    .text('VAT Amount', tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate, y, { width: columnWidths.vatAmount, align: 'right' })
    .text('Total', tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate + columnWidths.vatAmount, y, { width: columnWidths.total, align: 'right' });

  y += 20;

  // Items rows
  invoiceData.items.forEach((item: { description: string; quantity: number; unitPrice: number }) => {
    const total = item.quantity * item.unitPrice;
    const vatAmount = total * (invoiceData.taxRate / 100);
    
    doc.fontSize(10)
      .fillColor(primaryColor)
      .font('Helvetica')
      .text(item.description || "Item description", tableStartX, y, { width: columnWidths.description })
      .text(item.quantity.toString(), tableStartX + columnWidths.description, y, { width: columnWidths.quantity, align: 'right' })
      .text(`€${item.unitPrice.toFixed(2)}`, tableStartX + columnWidths.description + columnWidths.quantity, y, { width: columnWidths.unitPrice, align: 'right' })
      .text(`${invoiceData.taxRate}%`, tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice, y, { width: columnWidths.vatRate, align: 'right' })
      .text(`€${vatAmount.toFixed(2)}`, tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate, y, { width: columnWidths.vatAmount, align: 'right' })
      .text(`€${total.toFixed(2)}`, tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate + columnWidths.vatAmount, y, { width: columnWidths.total, align: 'right' });
    y += 20;
  });

  // Draw table footer line
  doc.moveTo(tableStartX, y)
    .lineTo(tableEndX, y)
    .strokeColor(borderColor)
    .stroke();

  y += 20;

  // Calculate totals
  const subtotal = invoiceData.items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => 
    sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + tax;

  const totalColumnX = tableStartX + columnWidths.description + columnWidths.quantity + columnWidths.unitPrice + columnWidths.vatRate + columnWidths.vatAmount;

  // Totals section
  doc.fontSize(10)
    .fillColor(mutedColor)
    .font('Helvetica')
    .text('Subtotal:', totalColumnX - 80, y, { width: 80, align: 'right' })
    .text(`€${subtotal.toFixed(2)}`, totalColumnX, y, { width: 80, align: 'right' })
    .text(`VAT (${invoiceData.taxRate}%):`, totalColumnX - 80, y + 20, { width: 80, align: 'right' })
    .text(`€${tax.toFixed(2)}`, totalColumnX, y + 20, { width: 80, align: 'right' })
    .fontSize(12)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('Total:', totalColumnX - 80, y + 40, { width: 80, align: 'right' })
    .text(`€${total.toFixed(2)}`, totalColumnX, y + 40, { width: 80, align: 'right' });

  y = doc.y + 30;

  // Payment details
  doc.fontSize(12)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('Payment Details:', 50, y)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(primaryColor)
    .text(`Bank: ${invoiceData.bankName}`, 50, y + 20)
    .text(`IBAN: ${invoiceData.accountNumber}`, 50, y + 35)
    .text(`BIC/SWIFT: ${invoiceData.bicSwift || "BIC/SWIFT"}`, 50, y + 50);

  // Terms and conditions
  y = doc.y + 30;
  doc.fontSize(12)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text('Terms and Conditions:', 50, y)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(mutedColor)
    .text('1. Payment is due within 30 days of invoice date.', 50, y + 20)
    .text('2. Late payments are subject to interest charges.', 50, y + 35)
    .text('3. All amounts are in EUR.', 50, y + 50);

  // Notes
  if (invoiceData.notes) {
    y = doc.y + 20;
    doc.fontSize(12)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text('Notes:', 50, y)
      .font('Helvetica')
      .fontSize(10)
      .fillColor(mutedColor)
      .text(invoiceData.notes, 50, y + 20);
  }

  // Footer
  y = 750;
  doc.fontSize(8)
    .fillColor(mutedColor)
    .font('Helvetica')
    .text('This is a legally binding invoice. Please retain for your records. ', 50, y)
    .text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });

  // Finalize the PDF
  doc.end();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// For Vercel deployment
export default app; 