import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Invoice } from "@/lib/types"
import { BarChart3, Clock, CreditCard } from "lucide-react"

interface DashboardStatsProps {
  invoices: Invoice[]
}

export function DashboardStats({ invoices }: DashboardStatsProps) {
  // Calculate total outstanding amount
  const totalOutstanding = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Calculate total tokenized amount
  const totalTokenized = invoices
    .filter((invoice) => invoice.status === "tokenized")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Count invoices due in the next 30 days
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  const dueInvoices = invoices.filter((invoice) => {
    const dueDate = new Date(invoice.dueDate)
    return dueDate <= thirtyDaysFromNow && invoice.status !== "paid"
  }).length

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
          <p className="text-xs text-muted-foreground">
            {invoices.filter((invoice) => invoice.status !== "paid").length} unpaid invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokenized Value</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalTokenized)}</div>
          <p className="text-xs text-muted-foreground">
            {invoices.filter((invoice) => invoice.status === "tokenized").length} tokenized invoices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dueInvoices}</div>
          <p className="text-xs text-muted-foreground">Invoices due in the next 30 days</p>
        </CardContent>
      </Card>
    </>
  )
}
