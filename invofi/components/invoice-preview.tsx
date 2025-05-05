import { format } from "date-fns"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

interface InvoiceData {
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  senderName: string
  senderCompany: string
  senderAddress: string
  senderEmail: string
  senderPhone: string
  senderVatId: string
  senderRegNumber: string
  recipientName: string
  recipientCompany: string
  recipientAddress: string
  recipientEmail: string
  recipientVatId: string
  items: InvoiceItem[]
  bankName: string
  accountNumber: string
  bicSwift: string
  taxRate: number
  notes: string
}

interface InvoicePreviewProps {
  invoiceData: InvoiceData
  subtotal: number
  tax: number
  total: number
}

export function InvoicePreview({ invoiceData, subtotal, tax, total }: InvoicePreviewProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto p-8">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-black">{invoiceData.senderCompany || "Your Company Name"}</h1>
            <p className="text-sm text-muted-foreground">{invoiceData.senderAddress || "Your Address"}</p>
            <p className="text-sm text-muted-foreground">VAT ID: {invoiceData.senderVatId || "VAT ID"}</p>
            <p className="text-sm text-muted-foreground">Registration Number: {invoiceData.senderRegNumber || "Reg. No."}</p>
            <p className="text-sm text-muted-foreground">Email: {invoiceData.senderEmail}</p>
            <p className="text-sm text-muted-foreground">Phone: {invoiceData.senderPhone}</p>
          </div>
          <div className="text-right space-y-2">
            <h2 className="text-xl font-bold text-black">TAX INVOICE</h2>
            <p className="text-sm text-muted-foreground">Invoice No: {invoiceData.invoiceNumber || "INV-001"}</p>
            <p className="text-sm text-muted-foreground">Date: {new Date(invoiceData.issueDate).toLocaleDateString('en-GB')}</p>
            <p className="text-sm text-muted-foreground">Due Date: {new Date(invoiceData.dueDate).toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-black">Bill To:</h3>
          <p className="text-sm">{invoiceData.recipientCompany || "Client Company"}</p>
          <p className="text-sm">{invoiceData.recipientName || "Client Name"}</p>
          <p className="text-sm text-muted-foreground">{invoiceData.recipientAddress || "Client Address"}</p>
          <p className="text-sm text-muted-foreground">VAT ID: {invoiceData.recipientVatId || "VAT ID"}</p>
          <p className="text-sm text-muted-foreground">Email: {invoiceData.recipientEmail}</p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-sm font-bold text-black">Description</th>
                <th className="text-right p-2 text-sm font-bold text-black">Quantity</th>
                <th className="text-right p-2 text-sm font-bold text-black">Unit Price</th>
                <th className="text-right p-2 text-sm font-bold text-black">VAT Rate</th>
                <th className="text-right p-2 text-sm font-bold text-black">VAT Amount</th>
                <th className="text-right p-2 text-sm font-bold text-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => {
                const total = item.quantity * item.unitPrice;
                const vatAmount = total * (invoiceData.taxRate / 100);
                return (
                  <tr key={index} className="border-b">
                    <td className="p-2 text-sm">{item.description || "Item description"}</td>
                    <td className="p-2 text-sm text-right">{item.quantity}</td>
                    <td className="p-2 text-sm text-right">€{item.unitPrice.toFixed(2)}</td>
                    <td className="p-2 text-sm text-right">{invoiceData.taxRate}%</td>
                    <td className="p-2 text-sm text-right">€{vatAmount.toFixed(2)}</td>
                    <td className="p-2 text-sm text-right">€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-4">
          <div className="text-right space-y-2">
            <p className="text-sm text-muted-foreground">Subtotal: €{subtotal.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">VAT ({invoiceData.taxRate}%): €{tax.toFixed(2)}</p>
            <p className="text-sm font-bold text-black">Total: €{total.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-black">Payment Details:</h3>
            <p className="text-sm">{invoiceData.bankName}</p>
            <p className="text-sm">{invoiceData.accountNumber}</p>
            <p className="text-sm">BIC/SWIFT: {invoiceData.bicSwift || "BIC/SWIFT"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-black">Terms and Conditions:</h3>
            <p className="text-sm text-muted-foreground">1. Payment is due within 30 days of invoice date.</p>
            <p className="text-sm text-muted-foreground">2. Late payments are subject to interest charges.</p>
            <p className="text-sm text-muted-foreground">3. All amounts are in EUR.</p>
          </div>

          {invoiceData.notes && (
            <div>
              <h3 className="text-sm font-bold text-black">Notes:</h3>
              <p className="text-sm text-muted-foreground">{invoiceData.notes}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <p>This is a legally binding invoice. Please retain for your records.</p>
        <p className="text-right">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
      </CardFooter>
    </Card>
  )
}
