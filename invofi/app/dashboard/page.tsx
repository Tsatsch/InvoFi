"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useWallet } from "@/context/wallet-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { InvoiceList } from "@/components/invoice-list"
import { DashboardStats } from "@/components/dashboard-stats"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { mockInvoices } from "@/lib/mock-data"

export default function DashboardPage() {
  const { user } = useAuth()
  const { isConnected } = useWallet()
  const router = useRouter()
  const [invoices, setInvoices] = useState(mockInvoices)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!user || !isConnected) {
      router.push("/")
    }
  }, [user, isConnected, router])

  if (!user || !isConnected) {
    return null // Will redirect in useEffect
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeTab === "all") return true
    return invoice.status === activeTab
  })

  const needsCompanyProfile = !user.companyProfile?.isComplete

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your invoices and financing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoice/create">
            <Button>Create Invoice</Button>
          </Link>
          <Link href="/invoice/tokenize">
            <Button variant="outline">Upload Invoice</Button>
          </Link>
        </div>
      </div>

      {needsCompanyProfile && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Complete Your Profile</AlertTitle>
          <AlertDescription>
            Please complete your company profile to enable invoice tokenization.
            <Link href="/profile/company">
              <Button variant="link" className="p-0 h-auto font-normal">
                Complete Profile
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="tokenized">Tokenized</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <InvoiceList invoices={filteredInvoices} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
