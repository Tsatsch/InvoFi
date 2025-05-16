"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, ArrowUpRight, ArrowDownLeft, Download, Wallet, BarChart3, Clock, Store, FileText, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Invoice } from "../../lib/types"
import { supabase } from "@/lib/supabase-client"

interface Transaction {
  signature: string
  timestamp: number
  type: 'sent' | 'received'
  amount: number
}

interface LiquidityContribution {
  invoiceId: string
  amount: number
  timestamp: number
  status: 'active' | 'completed'
  returns: number
}

export default function DashboardPage() {
  const { address, isConnected, connection } = useWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTokenizing, setIsTokenizing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Mock data for liquidity contributions
  const liquidityContributions: LiquidityContribution[] = [
    {
      invoiceId: "INV-001",
      amount: 5000,
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      status: 'active',
      returns: 250
    },
    {
      invoiceId: "INV-002",
      amount: 3000,
      timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
      status: 'completed',
      returns: 180
    }
  ]

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isConnected || !address || !connection) {
        setIsLoading(false)
        setInvoices([])
        setTransactions([])
        setBalance(0)
        return
      }

      setIsLoading(true)
      try {
        // Fetch balance
        const publicKey = new PublicKey(address)
        const balanceValue = await connection.getBalance(publicKey)
        setBalance(balanceValue / LAMPORTS_PER_SOL)

        // Fetch recent transactions
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 3 })
        const txDetailsPromises = signatures.map(async (sigInfo) => {
          const tx = await connection.getTransaction(sigInfo.signature)
          const isSent = tx?.transaction.message.accountKeys[0].toString() === address
          let amount = 0
          if (tx?.meta?.preBalances && tx?.meta?.postBalances && tx.transaction.message.accountKeys.length > 0) {
            const accountIndex = tx.transaction.message.accountKeys.findIndex(key => key.toString() === address)
            if (accountIndex !== -1 && tx.meta.preBalances[accountIndex] !== undefined && tx.meta.postBalances[accountIndex] !== undefined) {
              const preBalance = tx.meta.preBalances[accountIndex]
              const postBalance = tx.meta.postBalances[accountIndex]
              amount = (postBalance - preBalance) / LAMPORTS_PER_SOL
            }
          }
          return {
            signature: sigInfo.signature,
            timestamp: sigInfo.blockTime || Date.now() / 1000,
            type: (isSent ? 'sent' : 'received') as 'sent' | 'received',
            amount: Math.abs(amount),
          }
        })
        const txDetails = await Promise.all(txDetailsPromises)
        setTransactions(txDetails as Transaction[])

        // Fetch invoices from Supabase
        console.log("[DEBUG] Wallet address for Supabase query:", address);
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
            tax_rate
          `)
          .eq('sender_name', address)

        if (invoicesError) {
          console.error("[DEBUG] Supabase invoicesError object:", JSON.stringify(invoicesError, null, 2));
          toast({ title: "Error fetching invoices", description: invoicesError.message || 'Unknown Supabase error', variant: "destructive" })
          setInvoices([])
        } else if (supabaseInvoices) {
          const mappedInvoices: Invoice[] = supabaseInvoices.map((dbInvoice: any) => ({
            id: dbInvoice.id,
            invoiceNumber: dbInvoice.invoice_number,
            company: dbInvoice.sender_company || 'N/A',
            client: dbInvoice.recipient_name || 'Unknown Client',
            amount: dbInvoice.total_amount,
            issueDate: dbInvoice.created_at,
            dueDate: dbInvoice.due_date,
            status: dbInvoice.status as Invoice['status'],
            riskScore: 5,
            risk: 'Medium',
            discount: 5,
            submitterWallet: dbInvoice.sender_name && dbInvoice.sender_name.includes(address) ? address : dbInvoice.sender_name,
            items: dbInvoice.items || [],
            paymentTerms: 30,
            vatRate: dbInvoice.tax_rate || 0,
            notes: dbInvoice.notes,
          }))
          setInvoices(mappedInvoices)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data. Please try again.",
          variant: "destructive",
        })
        setInvoices([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [isConnected, address, connection, router, toast])

  if (!isConnected && !isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Please connect your wallet to view the dashboard.</div>
  }

  if (isLoading && !address) {
    return <div className="container mx-auto px-4 py-8 text-center"><Loader2 className="h-8 w-8 animate-spin inline-block"/></div>
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard.",
      })
    }
  }

  const viewOnExplorer = () => {
    if (address) {
      window.open(`https://solscan.io/account/${address}`, "_blank")
    }
  }

  const formatDate = (timestampOrDateString: number | string) => {
    if (!timestampOrDateString) return 'N/A'
    const date = typeof timestampOrDateString === 'string' ? new Date(timestampOrDateString) : new Date(timestampOrDateString * 1000)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString()
  }

  // Calculate total liquidity provided
  const totalLiquidityProvided = liquidityContributions.reduce((sum, contribution) => sum + contribution.amount, 0)
  
  // Calculate total returns
  const totalReturns = liquidityContributions.reduce((sum, contribution) => sum + contribution.returns, 0)

  // Calculate total active liquidity
  const activeLiquidity = liquidityContributions
    .filter(contribution => contribution.status === 'active')
    .reduce((sum, contribution) => sum + contribution.amount, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Wallet Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${address}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                  alt="Profile"
                />
                <AvatarFallback>{address ? address.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>User Dashboard</CardTitle>
                <CardDescription>Manage your invoices and liquidity contributions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground" /> 
                  <span className="font-mono text-sm truncate">{address || "Connect wallet"}</span>
                </div>
                {address && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={copyAddress} title="Copy address">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={viewOnExplorer} title="View on Solscan">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wallet Balance</CardTitle>
                    <CardDescription>Your current SOL balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !balance ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <p className="text-2xl font-bold">{balance.toFixed(4)} SOL</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Liquidity</CardTitle>
                    <CardDescription>Currently provided liquidity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(activeLiquidity)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {liquidityContributions.filter(c => c.status === 'active').length} active contributions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Returns</CardTitle>
                    <CardDescription>From liquidity provision</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-500">+{formatCurrency(totalReturns)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalLiquidityProvided > 0 ? ((totalReturns / totalLiquidityProvided) * 100).toFixed(1) : 0}% ROI
                    </p>
                  </CardContent>
                </Card>
              </div>

              {transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {transactions.map(tx => (
                      <div key={tx.signature} className="flex items-center justify-between text-sm p-2 rounded bg-background">
                        <div className="flex items-center gap-2">
                          {tx.type === 'sent' ? <ArrowUpRight className="h-4 w-4 text-red-500" /> : <ArrowDownLeft className="h-4 w-4 text-green-500" />}
                          <span className="truncate font-mono text-xs">{tx.signature.substring(0,10)}...</span>
                        </div>
                        <div className="text-right">
                           <span className={`font-medium ${tx.type === 'sent' ? 'text-red-500' : 'text-green-500'}`}>{tx.type === 'sent' ? '-' : '+'}{tx.amount.toFixed(4)} SOL</span>
                           <p className="text-xs text-muted-foreground">{formatDate(tx.timestamp * 1000)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">My Invoices</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading && invoices.length === 0 ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : invoices.length > 0 ? (
                    invoices.slice(0, 3).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium">#{invoice.invoiceNumber || invoice.id}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(invoice.amount || 0)}</p>
                        </div>
                        <Badge variant={invoice.status === 'tokenized' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No invoices found.</p>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("invoices")}>
                    View All Invoices
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Liquidity Contributions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {liquidityContributions.slice(0, 3).map((contribution) => (
                    <div key={contribution.invoiceId} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">#{contribution.invoiceId}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(contribution.amount)} • {formatDate(contribution.timestamp)}
                        </p>
                      </div>
                      <Badge variant={contribution.status === 'active' ? 'default' : 'secondary'}>
                        {contribution.status}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("liquidity")}>
                    View All Contributions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Invoices</CardTitle>
                <CardDescription>Manage your invoices and their financing status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && invoices.length === 0 ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : invoices.length > 0 ? (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">#{invoice.invoiceNumber || invoice.id}</h3>
                            <p className="text-sm text-muted-foreground">{invoice.company}</p>
                          </div>
                          <Badge variant={invoice.status === 'tokenized' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-medium">{formatCurrency(invoice.amount || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-medium">{formatDate(invoice.dueDate || '')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Level</p>
                            <p className="font-medium">{invoice.risk}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">AMM Discount</p>
                            <p className="font-medium text-green-500">-{invoice.discount}%</p>
                          </div>
                        </div>
                        {/* Display PDF and Metadata URIs if they exist */}
                        {invoice.pdfUri && (
                          <div className="mt-2 text-xs">
                            <p className="font-medium">PDF URI: <a href={invoice.pdfUri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{invoice.pdfUri}</a></p>
                          </div>
                        )}
                        {invoice.metadataUri && (
                          <div className="mt-1 text-xs">
                            <p className="font-medium">Metadata URI: <a href={invoice.metadataUri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{invoice.metadataUri}</a></p>
                          </div>
                        )}
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          {invoice.status === 'APPROVED_FOR_TOKENIZATION' && (
                            <Button 
                              size="sm" 
                              onClick={async () => {
                                if (isTokenizing === invoice.id) return
                                setIsTokenizing(invoice.id)
                                try {
                                  console.log(`Tokenizing invoice: ${invoice.id}`)
                                  const result = await api.tokenizeInvoice(invoice.id as string)
                                  console.log("Tokenization result:", result)
                                  toast({
                                    title: "Metadata Upload Successful",
                                    description: `Invoice ${invoice.id} metadata uploaded. PDF: ${result.pdfUri}, Metadata: ${result.metadataUri}`,
                                  })
                                  setInvoices(prevInvoices => 
                                    prevInvoices.map(inv => 
                                      inv.id === invoice.id 
                                        ? { 
                                            ...inv, 
                                            status: 'tokenized' as Invoice['status'],
                                            pdfUri: result.pdfUri,
                                            metadataUri: result.metadataUri 
                                          }
                                        : inv
                                    )
                                  )
                                } catch (error: any) {
                                  console.error("Tokenization failed:", error)
                                  toast({
                                    title: "Tokenization Failed",
                                    description: error.message || "An unexpected error occurred.",
                                    variant: "destructive",
                                  })
                                } finally {
                                  setIsTokenizing(null)
                                }
                              }}
                              disabled={isTokenizing === invoice.id}
                            >
                              {isTokenizing === invoice.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              {isTokenizing === invoice.id ? "Tokenizing..." : "Tokenize Invoice"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No invoices match your wallet address.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liquidity Contributions</CardTitle>
                <CardDescription>Track your liquidity provision and returns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liquidityContributions.map((contribution) => (
                    <div key={contribution.invoiceId} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">Invoice #{contribution.invoiceId}</h3>
                          <p className="text-sm text-muted-foreground">
                            Contributed on {formatDate(contribution.timestamp)}
                          </p>
                        </div>
                        <Badge variant={contribution.status === 'active' ? 'default' : 'secondary'}>
                          {contribution.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(contribution.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Returns</p>
                          <p className="font-medium text-green-500">+{formatCurrency(contribution.returns)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className="font-medium">
                            {contribution.amount > 0 ? ((contribution.returns / contribution.amount) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium capitalize">{contribution.status}</p>
                        </div>
                      </div>
                      {contribution.status === 'active' && (
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Performance
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
