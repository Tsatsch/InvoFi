import { Metadata } from "next"
import { InvoiceMarketplace } from "@/components/invoice-marketplace"

export const metadata: Metadata = {
  title: "Invoice Marketplace | InvoFi",
  description: "Trade and invest in tokenized invoices on the InvoFi marketplace",
}

export default function MarketplacePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Invoice Marketplace</h1>
        <p className="mt-2 text-muted-foreground">
          Discover and invest in tokenized invoices from verified businesses
        </p>
      </div>
      <InvoiceMarketplace />
    </div>
  )
} 