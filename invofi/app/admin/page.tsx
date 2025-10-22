"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import type { Invoice } from "@/lib/types"
import { Download, FileText, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { isAdminAddress } from "@/lib/config"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase-client"

export default function AdminPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [riskScores, setRiskScores] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchPendingInvoices = async () => {
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

      setIsLoading(true)
      try {
        // Fetch pending invoices from Supabase
        const { data: supabaseInvoices, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            sender_company,
            recipient_name,
            total_amount,
            due_date,
            status,
            sender_name,
            currency,
            items,
            notes,
            created_at,
            tax_rate,
            issue_date
          `)
          .eq('status', 'PENDING_ADMIN_APPROVAL')

        if (invoicesError) {
          console.error("Supabase error:", invoicesError)
          toast({ 
            title: "Error fetching invoices", 
            description: invoicesError.message || 'Unknown Supabase error', 
            variant: "destructive" 
          })
          setPendingInvoices([])
        } else if (supabaseInvoices) {
          // Map Supabase data to Invoice interface
          const mappedInvoices: Invoice[] = supabaseInvoices.map((dbInvoice: any) => ({
            id: dbInvoice.id,
            invoiceNumber: dbInvoice.invoice_number,
            company: dbInvoice.sender_company || 'N/A',
            client: dbInvoice.recipient_name || 'Unknown Client',
            amount: dbInvoice.total_amount,
            issueDate: dbInvoice.issue_date || dbInvoice.created_at,
            dueDate: dbInvoice.due_date,
            status: 'pending' as const, // Map to frontend status
            riskScore: 5, // Default risk score
            risk: 'Medium',
            discount: 5,
            submitterWallet: dbInvoice.sender_name,
            items: dbInvoice.items || [],
            paymentTerms: 30, // Default payment terms
            vatRate: dbInvoice.tax_rate || 0,
            notes: dbInvoice.notes,
          }))
          setPendingInvoices(mappedInvoices)
        }
      } catch (error) {
        console.error("Failed to fetch pending invoices:", error)
        toast({
          title: "Error",
          description: "Failed to fetch pending invoices. Please try again.",
          variant: "destructive",
        })
        setPendingInvoices([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingInvoices()
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

  const handleApprove = async (invoiceId: string) => {
    try {
      // Get the invoice being approved
      const invoiceToApprove = pendingInvoices.find(inv => inv.id === invoiceId)
      if (!invoiceToApprove) {
        throw new Error("Invoice not found")
      }

      // Update the invoice status in Supabase
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'APPROVED_FOR_TOKENIZATION',
          // You might want to add a risk_score field to your database schema
          // risk_score: riskScores[invoiceId] || invoiceToApprove.riskScore
        })
        .eq('id', invoiceId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Remove from pending list in UI
      setPendingInvoices(prev => 
        prev.filter(inv => inv.id !== invoiceId)
      )

      toast({
        title: "Invoice Approved",
        description: "The invoice has been successfully approved and is now ready for tokenization.",
      })
    } catch (error) {
      const err = error as any
      console.error("Failed to approve invoice:", err)
      toast({
        title: "Approval Failed",
        description: err?.message || "Could not approve the invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRiskScoreChange = (invoiceId: string, score: string) => {
    setRiskScores(prev => ({
      ...prev,
      [invoiceId]: parseInt(score) || 0
    }))
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
            <CardDescription>Review and approve pending invoices</CardDescription>
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
                      <p className="text-sm text-muted-foreground">Set Risk Score</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={riskScores[invoice.id] || invoice.riskScore}
                          onChange={(e) => handleRiskScoreChange(invoice.id, e.target.value)}
                          className="w-full"
                        />
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
                      onClick={() => handleApprove(invoice.id)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Approve
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