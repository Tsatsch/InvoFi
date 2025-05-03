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
import { WalletConnect } from "@/components/wallet-connect"
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
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/auth/login")
    }
  }, [user, router])

  if (!user) {
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

      {!isConnected && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>Connect your wallet to tokenize invoices and access financing</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardStats invoices={invoices} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Invoices</CardTitle>
          <CardDescription>Manage and track all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="tokenized">Tokenized</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <InvoiceList invoices={filteredInvoices} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            Export
          </Button>
          <div className="text-sm text-muted-foreground">Showing {filteredInvoices.length} invoices</div>
        </CardFooter>
      </Card>
    </div>
  )
}
