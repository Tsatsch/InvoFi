export interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  amount: number
  issueDate: string
  dueDate: string
  status: "draft" | "pending" | "approved" | "tokenized" | "paid"
  riskScore: number
  submitterWallet: string
  items: {
    description: string
    quantity: number
    unitPrice: number
  }[]
  paymentTerms: 30 | 60 | 90
  vatRate: number
  notes?: string
}
