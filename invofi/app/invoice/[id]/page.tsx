"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RiskBadge } from "@/components/risk-badge"
import { formatCurrency } from "@/lib/utils"
import { mockInvoices } from "@/lib/mock-data"
import type { Invoice } from "@/lib/types"
import { ArrowLeft, Download, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PaymentTimeline } from "@/components/payment-timeline"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchInvoice = async () => {
      setIsLoading(true)
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const foundInvoice = mockInvoices.find((inv) => inv.id === params.id)
        if (foundInvoice) {
          setInvoice(foundInvoice)
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Failed to fetch invoice:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <p>Loading invoice details...</p>
      </div>
    )
  }

  if (!invoice) {
    return null // Will redirect in useEffect
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "approved":
        return <Badge variant="success">Approved</Badge>
      case "tokenized":
        return <Badge variant="default">Tokenized</Badge>
      case "paid":
        return <Badge variant="success">Paid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "tokenized":
        return <CheckCircle className="h-5 w-5 text-primary" />
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Invoice Details</CardTitle>
                  <CardDescription>Complete information about this invoice</CardDescription>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(invoice.status)}
                  <span className="ml-2">{getStatusBadge(invoice.status)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                  <p>{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                  <p>{invoice.client}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Issue Date</h3>
                  <p>{invoice.issueDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                  <p>{invoice.dueDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Terms</h3>
                  <p>{invoice.paymentTerms} days</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Risk Assessment</h3>
                  <RiskBadge score={invoice.riskScore} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.description}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-2">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">
                        Subtotal
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-medium">
                        VAT ({invoice.vatRate}%)
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(
                          (invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) *
                            invoice.vatRate) /
                            100,
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-bold">
                        Total
                      </td>
                      <td className="text-right py-2 font-bold">{formatCurrency(invoice.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {invoice.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
            </CardFooter>
          </Card>

          {(invoice.status === "tokenized" || invoice.status === "paid") && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Timeline</CardTitle>
                <CardDescription>Track the payment status of this invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentTimeline invoiceId={invoice.id} status={invoice.status} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span>{getStatusBadge(invoice.status)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Due Date</span>
                <span>{invoice.dueDate}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Risk Score</span>
                <RiskBadge score={invoice.riskScore} />
              </div>
            </CardContent>
          </Card>

          {invoice.status === "tokenized" && (
            <Card>
              <CardHeader>
                <CardTitle>Financing Options</CardTitle>
                <CardDescription>Based on your invoice risk score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h3 className="font-medium mb-1">Immediate Financing</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Get {formatCurrency(invoice.amount * 0.85)} now (85% of invoice value)
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>Interest Rate:</span>
                    <span className="font-medium">{4 + invoice.riskScore / 10}%</span>
                  </div>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h3 className="font-medium mb-1">Standard Financing</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Get {formatCurrency(invoice.amount * 0.9)} in 2 business days (90% of invoice value)
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>Interest Rate:</span>
                    <span className="font-medium">{3 + invoice.riskScore / 10}%</span>
                  </div>
                </div>

                <Button className="w-full">Apply for Financing</Button>
              </CardContent>
            </Card>
          )}

          {invoice.status === "draft" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/invoice/tokenize/${invoice.id}`}>Submit for Approval</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/invoice/edit/${invoice.id}`}>Edit Invoice</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {invoice.status === "approved" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/invoice/tokenize/${invoice.id}`}>Tokenize Invoice</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
