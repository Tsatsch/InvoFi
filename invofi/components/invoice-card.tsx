"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

const SOL_TO_USD_RATE = 170 // 1 SOL = $170

// Helper function to format dates consistently
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

interface InvoiceCardProps {
  invoice: {
    id: string
    company: string
    amount: number
    dueDate: string
    risk: string
    discount: number
    status: string
    liquidityDepth: number
    poolSize: number
    term: number
    timeDecay: number
    debtor: string
    invoiceDate: string
    description: string
    remainingCapacity: number
    totalContributors: number
    minContribution: number
  }
  onContribute: () => void
}

export function InvoiceCard({ invoice, onContribute }: InvoiceCardProps) {
  const handlePurchase = () => {
    toast.info("Invoice purchase feature coming soon!", {
      description: "This feature is currently under development. Stay tuned for updates!",
    })
  }

  const discountedAmount = invoice.amount * (1 - invoice.discount / 100)
  const discountedAmountInSol = discountedAmount / SOL_TO_USD_RATE
  const originalAmountInSol = invoice.amount / SOL_TO_USD_RATE
  const filledPercentage = ((invoice.amount - invoice.remainingCapacity) / invoice.amount) * 100

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{invoice.company}</CardTitle>
            <CardDescription>#{invoice.id}</CardDescription>
          </div>
          <Badge variant="outline" className={
            invoice.risk === "Low" 
              ? "border-green-500 text-green-500" 
              : invoice.risk === "Medium" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-red-500 text-red-500"
          }>
            {invoice.risk} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Amount</span>
            <div className="text-right">
              <div className="font-medium">${invoice.amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{originalAmountInSol.toFixed(2)} SOL</div>
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">AMM Discount</span>
            <span className="font-medium text-green-600">-{invoice.discount}%</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Purchase Price</span>
            <div className="text-right">
              <div className="font-medium text-primary">${discountedAmount.toLocaleString()}</div>
              <div className="text-xs text-primary">{discountedAmountInSol.toFixed(2)} SOL</div>
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Due Date</span>
            <span className="font-medium">{formatDate(invoice.dueDate)}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Filled</span>
              <span className="font-medium">{filledPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={filledPercentage} className="h-2" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Contributors</span>
            <span className="font-medium">{invoice.totalContributors}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Min Contribution</span>
            <span className="font-medium">${invoice.minContribution.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button 
          className="flex-1" 
          onClick={onContribute}
          disabled={invoice.remainingCapacity === 0}
        >
          {invoice.remainingCapacity === 0 ? "Fully Funded" : "Contribute"}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Complete information about invoice #{invoice.id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Basic Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice ID</span>
                    <span className="font-medium">#{invoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company</span>
                    <span className="font-medium">{invoice.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debtor</span>
                    <span className="font-medium">{invoice.debtor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium">{invoice.description}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Financial Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Amount</span>
                    <span className="font-medium">${invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AMM Discount</span>
                    <span className="font-medium text-green-600">-{invoice.discount}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span className="font-medium">${discountedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term</span>
                    <span className="font-medium">{invoice.term} days</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Dates</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date</span>
                    <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">AMM Parameters</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className="font-medium">{invoice.risk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Decay</span>
                    <span className="font-medium">{invoice.timeDecay}% per day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity Depth</span>
                    <span className="font-medium">{invoice.liquidityDepth}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pool Size</span>
                    <span className="font-medium">${(invoice.poolSize / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <h4 className="font-medium">Fractional Ownership</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Contributors</span>
                    <span className="font-medium">{invoice.totalContributors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Capacity</span>
                    <span className="font-medium">${invoice.remainingCapacity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Contribution</span>
                    <span className="font-medium">${invoice.minContribution.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">Filled</span>
                      <span className="font-medium">{filledPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={filledPercentage} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
} 