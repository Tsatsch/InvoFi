export interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  amount: number
  issueDate: string
  dueDate: string
  status: "draft" | "pending" | "tokenized" | "paid"
  riskScore: number
  items: {
    description: string
    quantity: number
    unitPrice: number
  }[]
  paymentTerms: 30 | 60 | 90
  vatRate: number
  notes?: string
}
