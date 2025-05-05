import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Invoice } from "@/lib/types"
import { BarChart3, Clock, CreditCard, TrendingUp, AlertCircle, FileText, DollarSign, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
  invoices: Invoice[]
  isLoading?: boolean
}

export function DashboardStats({ invoices, isLoading = false }: DashboardStatsProps) {
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

  // Calculate overdue invoices
  const overdueInvoices = invoices.filter((invoice) => {
    const dueDate = new Date(invoice.dueDate)
    return dueDate < today && invoice.status !== "paid"
  }).length

  // Calculate average invoice amount
  const averageInvoiceAmount = invoices.length > 0 
    ? invoices.reduce((sum, invoice) => sum + invoice.amount, 0) / invoices.length 
    : 0

  // Calculate total paid amount
  const totalPaid = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Calculate average payment terms
  const averagePaymentTerms = invoices.length > 0
    ? invoices.reduce((sum, invoice) => sum + invoice.paymentTerms, 0) / invoices.length
    : 0

  const stats = [
    {
      title: "Outstanding Invoices",
      value: formatCurrency(totalOutstanding),
      description: `${invoices.filter((invoice) => invoice.status !== "paid").length} unpaid invoices`,
      icon: CreditCard,
      className: "border-l-4 border-primary"
    },
    {
      title: "Tokenized Value",
      value: formatCurrency(totalTokenized),
      description: `${invoices.filter((invoice) => invoice.status === "tokenized").length} tokenized invoices`,
      icon: BarChart3,
      className: "border-l-4 border-green-500"
    },
    {
      title: "Due Soon",
      value: dueInvoices,
      description: "Invoices due in the next 30 days",
      icon: Clock,
      className: "border-l-4 border-yellow-500"
    },
    {
      title: "Overdue",
      value: overdueInvoices,
      description: "Invoices past due date",
      icon: AlertCircle,
      className: "border-l-4 border-red-500"
    },
    {
      title: "Total Paid",
      value: formatCurrency(totalPaid),
      description: `${invoices.filter((invoice) => invoice.status === "paid").length} paid invoices`,
      icon: DollarSign,
      className: "border-l-4 border-blue-500"
    },
    {
      title: "Average Invoice",
      value: formatCurrency(averageInvoiceAmount),
      description: `Based on ${invoices.length} total invoices`,
      icon: FileText,
      className: "border-l-4 border-purple-500"
    },
    {
      title: "Avg Payment Terms",
      value: `${Math.round(averagePaymentTerms)} days`,
      description: "Average payment period",
      icon: Calendar,
      className: "border-l-4 border-orange-500"
    },
    {
      title: "Total Invoices",
      value: invoices.length,
      description: "All invoices in the system",
      icon: FileText,
      className: "border-l-4 border-gray-500"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className={cn(
            "transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
            stat.className
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded mt-2" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
