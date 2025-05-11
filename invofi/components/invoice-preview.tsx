import { format } from "date-fns"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceData {
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
    <Card className="w-full max-w-4xl mx-auto p-8 bg-white">
      <CardHeader className="space-y-4 border-b pb-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-black">{invoiceData.senderCompany || "Your Company Name"}</h1>
            <p className="text-sm text-gray-600">{invoiceData.senderAddress || "Your Address"}</p>
            <p className="text-sm text-gray-600">VAT ID: {invoiceData.senderVatId || "VAT ID"}</p>
            <p className="text-sm text-gray-600">Registration Number: {invoiceData.senderRegNumber || "Reg. No."}</p>
            <p className="text-sm text-gray-600">Email: {invoiceData.senderEmail}</p>
            <p className="text-sm text-gray-600">Phone: {invoiceData.senderPhone}</p>
          </div>
          <div className="text-right space-y-2">
            <h2 className="text-xl font-bold text-black">TAX INVOICE</h2>
            <p className="text-sm text-gray-600">Invoice No: {invoiceData.invoiceNumber || "INV-001"}</p>
            <p className="text-sm text-gray-600">Date: {format(new Date(invoiceData.issueDate), 'dd/MM/yyyy')}</p>
            <p className="text-sm text-gray-600">Due Date: {format(new Date(invoiceData.dueDate), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 py-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-black">Bill To:</h3>
            <p className="text-sm font-medium">{invoiceData.recipientCompany || "Client Company"}</p>
            <p className="text-sm font-medium">{invoiceData.recipientName || "Client Name"}</p>
            <p className="text-sm text-gray-600">{invoiceData.recipientAddress || "Client Address"}</p>
            <p className="text-sm text-gray-600">VAT ID: {invoiceData.recipientVatId || "VAT ID"}</p>
            <p className="text-sm text-gray-600">Email: {invoiceData.recipientEmail}</p>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm font-bold text-black">Description</th>
                <th className="text-right p-3 text-sm font-bold text-black">Quantity</th>
                <th className="text-right p-3 text-sm font-bold text-black">Unit Price</th>
                <th className="text-right p-3 text-sm font-bold text-black">VAT Rate</th>
                <th className="text-right p-3 text-sm font-bold text-black">VAT Amount</th>
                <th className="text-right p-3 text-sm font-bold text-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => {
                const total = item.quantity * item.unitPrice;
                const vatAmount = total * (invoiceData.taxRate / 100);
                return (
                  <tr key={index}>
                    <td className="p-3 text-sm">{item.description || "Item description"}</td>
                    <td className="p-3 text-sm text-right">{item.quantity}</td>
                    <td className="p-3 text-sm text-right">€{item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-sm text-right">{invoiceData.taxRate}%</td>
                    <td className="p-3 text-sm text-right">€{vatAmount.toFixed(2)}</td>
                    <td className="p-3 text-sm text-right">€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT ({invoiceData.taxRate}%):</span>
              <span>€{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Total:</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-black mb-2">Payment Details:</h3>
              <p className="text-sm">{invoiceData.bankName}</p>
              <p className="text-sm">{invoiceData.accountNumber}</p>
              <p className="text-sm">BIC/SWIFT: {invoiceData.bicSwift || "BIC/SWIFT"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-black mb-2">Terms and Conditions:</h3>
            <p className="text-sm text-gray-600">1. Payment is due within 30 days of invoice date.</p>
            <p className="text-sm text-gray-600">2. Late payments are subject to interest charges.</p>
            <p className="text-sm text-gray-600">3. All amounts are in EUR.</p>
          </div>

          {invoiceData.notes && (
            <div>
              <h3 className="text-sm font-bold text-black mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{invoiceData.notes}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 text-xs text-gray-600">
        <div className="w-full flex justify-between">
          <p>This is a legally binding invoice. Please retain for your records.</p>
          <p>Generated on: {format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
      </CardFooter>
    </Card>
  )
}
