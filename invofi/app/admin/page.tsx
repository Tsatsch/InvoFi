"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { mockInvoices } from "@/lib/mock-data"
import type { Invoice } from "@/lib/types"
import { Download, FileText, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { isAdminAddress } from "@/lib/config"

export default function AdminPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isConnected || !address) {
      router.push("/")
      return
    }

    // Check if the connected wallet is whitelisted
    if (!isAdminAddress(address)) {
      toast({
        title: "Access Denied",
        description: "You are not authorized to access the admin panel.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    // Load pending invoices
    const pending = mockInvoices.filter(inv => inv.status === "pending")
    setPendingInvoices(pending)
    setIsLoading(false)
  }, [isConnected, address, router, toast])

  const handleDownload = async (invoice: Invoice) => {
    try {
      // In a real app, this would generate and download a PDF
      // For now, we'll just show a success message
      toast({
        title: "Invoice Downloaded",
        description: `Invoice #${invoice.invoiceNumber} has been downloaded.`,
      })
    } catch (error) {
      console.error("Failed to download invoice:", error)
      toast({
        title: "Download Failed",
        description: "Could not download the invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTokenize = async (invoiceId: string) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update the invoice status
      setPendingInvoices(prev => 
        prev.filter(inv => inv.id !== invoiceId)
      )

      toast({
        title: "Invoice Tokenized",
        description: "The invoice has been successfully tokenized.",
      })
    } catch (error) {
      console.error("Failed to tokenize invoice:", error)
      toast({
        title: "Tokenization Failed",
        description: "Could not tokenize the invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isConnected || !address) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Dashboard
            </CardTitle>
            <CardDescription>Review and tokenize pending invoices</CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <p>Loading pending invoices...</p>
          ) : pendingInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No pending invoices to review</p>
              </CardContent>
            </Card>
          ) : (
            pendingInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Invoice #{invoice.invoiceNumber}
                      </CardTitle>
                      <CardDescription>{invoice.client}</CardDescription>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{invoice.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">{invoice.paymentTerms} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Risk Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={invoice.riskScore} className="w-full" />
                        <span className="text-sm font-medium">{invoice.riskScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(invoice)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button
                      onClick={() => handleTokenize(invoice.id)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Tokenize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 