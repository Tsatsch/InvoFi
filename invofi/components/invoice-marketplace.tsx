"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoiceCard } from "./invoice-card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { toast } from "sonner"

// Mock data for invoices
const mockInvoices = [
  {
    id: "INV-001",
    company: "TechCorp Solutions",
    amount: 25000,
    dueDate: "2024-06-15",
    risk: "Low",
    discount: 5,
    status: "Available",
    liquidityDepth: 85,
    poolSize: 1000000,
    term: 30,
    timeDecay: 0.1,
    debtor: "Microsoft Corp",
    invoiceDate: "2024-05-15",
    description: "Cloud Services - Q2 2024",
    remainingCapacity: 15000,
    totalContributors: 8,
    minContribution: 1000,
  },
  {
    id: "INV-002",
    company: "Global Manufacturing Inc",
    amount: 45000,
    dueDate: "2024-07-01",
    risk: "Medium",
    discount: 12,
    status: "Available",
    liquidityDepth: 65,
    poolSize: 1000000,
    term: 60,
    timeDecay: 0.15,
    debtor: "Tesla Motors",
    invoiceDate: "2024-05-01",
    description: "Automotive Parts Supply",
    remainingCapacity: 30000,
    totalContributors: 12,
    minContribution: 2000,
  },
  {
    id: "INV-003",
    company: "Digital Services Ltd",
    amount: 15000,
    dueDate: "2024-06-30",
    risk: "Low",
    discount: 4,
    status: "Available",
    liquidityDepth: 92,
    poolSize: 1000000,
    term: 30,
    timeDecay: 0.1,
    debtor: "Google LLC",
    invoiceDate: "2024-05-30",
    description: "Digital Marketing Services",
    remainingCapacity: 8000,
    totalContributors: 5,
    minContribution: 1000,
  },
  {
    id: "INV-004",
    company: "Green Energy Solutions",
    amount: 75000,
    dueDate: "2024-08-15",
    risk: "High",
    discount: 20,
    status: "Available",
    liquidityDepth: 45,
    poolSize: 1000000,
    term: 90,
    timeDecay: 0.2,
    debtor: "General Electric",
    invoiceDate: "2024-05-15",
    description: "Solar Panel Installation",
    remainingCapacity: 50000,
    totalContributors: 15,
    minContribution: 3000,
  },
]

export function InvoiceMarketplace() {
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")

  const handleContribute = () => {
    if (!selectedInvoice) return

    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount < selectedInvoice.minContribution) {
      toast.error("Invalid contribution amount", {
        description: `Minimum contribution is $${selectedInvoice.minContribution.toLocaleString()}`,
      })
      return
    }

    if (amount > selectedInvoice.remainingCapacity) {
      toast.error("Contribution too large", {
        description: `Maximum contribution is $${selectedInvoice.remainingCapacity.toLocaleString()}`,
      })
      return
    }

    toast.success("Contribution successful!", {
      description: `You have contributed $${amount.toLocaleString()} to invoice #${selectedInvoice.id}`,
    })
    setSelectedInvoice(null)
    setContributionAmount("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search invoices..."
          className="max-w-sm"
        />
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="newest">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="amount-high">Highest Amount</SelectItem>
            <SelectItem value="amount-low">Lowest Amount</SelectItem>
            <SelectItem value="discount-high">Highest Discount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockInvoices.map((invoice) => (
          <InvoiceCard 
            key={invoice.id} 
            invoice={invoice}
            onContribute={() => setSelectedInvoice(invoice)}
          />
        ))}
      </div>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contribute to Invoice</DialogTitle>
            <DialogDescription>
              Provide liquidity for invoice #{selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Company</span>
                  <span className="font-medium">{selectedInvoice.company}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Original Amount</span>
                  <span className="font-medium">${selectedInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">AMM Discount</span>
                  <span className="font-medium text-green-600">-{selectedInvoice.discount}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Remaining Capacity</span>
                  <span className="font-medium">${selectedInvoice.remainingCapacity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Min Contribution</span>
                  <span className="font-medium">${selectedInvoice.minContribution.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contribution Amount (USDC)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  min={selectedInvoice.minContribution}
                  max={selectedInvoice.remainingCapacity}
                />
                <p className="text-sm text-muted-foreground">
                  Available: ${selectedInvoice.remainingCapacity.toLocaleString()}
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleContribute}
                disabled={!contributionAmount || parseFloat(contributionAmount) < selectedInvoice.minContribution}
              >
                Contribute
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 