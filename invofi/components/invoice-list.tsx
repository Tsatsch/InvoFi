"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Download, Eye, Pencil, Trash2, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"
import { RiskBadge } from "@/components/risk-badge"
import Link from "next/link"
import type { Invoice } from "@/lib/types"
import { useWallet } from "@/context/wallet-context"

interface InvoiceListProps {
  invoices: Invoice[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const { address } = useWallet()
  
  // Filter invoices based on the connected wallet
  const filteredInvoices = address 
    ? invoices.filter(inv => inv.submitterWallet.toLowerCase() === address.toLowerCase())
    : []

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

  if (filteredInvoices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.client}</TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell>
                <RiskBadge score={invoice.riskScore} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/invoice/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {invoice.status === "draft" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/invoice/edit/${invoice.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {invoice.status === "draft" && (
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                    {invoice.status === "approved" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/invoice/tokenize/${invoice.id}`}>
                          <Wallet className="mr-2 h-4 w-4" />
                          Tokenize
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
