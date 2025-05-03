import { format } from "date-fns"
import { Card } from "@/components/ui/card"

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
  recipientName: string
  recipientCompany: string
  recipientAddress: string
  recipientEmail: string
  items: InvoiceItem[]
  bankName: string
  accountNumber: string
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
    <Card className="p-8 border shadow-sm">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
          <p className="text-muted-foreground"># {invoiceData.invoiceNumber || "INV-001"}</p>
        </div>
        <div className="text-right">
          <h2 className="font-bold">{invoiceData.senderCompany || "Your Company Name"}</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {invoiceData.senderAddress || "Your Address\nCity, Country"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-medium mb-1">Bill To:</h3>
          <p className="font-medium">{invoiceData.recipientCompany || "Client Company"}</p>
          <p className="text-sm">{invoiceData.recipientName || "Client Name"}</p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {invoiceData.recipientAddress || "Client Address\nCity, Country"}
          </p>
          <p className="text-sm text-muted-foreground">{invoiceData.recipientEmail || "client@example.com"}</p>
        </div>

        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Invoice Date:</span>
              <span className="text-sm">
                {invoiceData.issueDate ? format(invoiceData.issueDate, "PPP") : "May 3, 2025"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Due Date:</span>
              <span className="text-sm">
                {invoiceData.dueDate ? format(invoiceData.dueDate, "PPP") : "June 2, 2025"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items.map((item, index) => (
            <tr key={index} className="border-b border-muted">
              <td className="py-3">{item.description || "Item description"}</td>
              <td className="py-3 text-right">{item.quantity}</td>
              <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
              <td className="py-3 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-1/3">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Tax ({invoiceData.taxRate}%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 font-bold border-t">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-medium mb-1">Payment Details:</h3>
          <p className="text-sm">Bank: {invoiceData.bankName || "Bank Name"}</p>
          <p className="text-sm">Account: {invoiceData.accountNumber || "XXXX-XXXX-XXXX-XXXX"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Notes:</h3>
          <p className="text-sm text-muted-foreground">{invoiceData.notes || "Thank you for your business."}</p>
        </div>
      </div>
    </Card>
  )
}
