"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, ArrowUpRight, ArrowDownLeft, Download, Wallet, BarChart3, Clock, Store, FileText, DollarSign, TrendingUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getSolanaConnection } from "@/lib/solana-config"
import { mockInvoices } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

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
  const [activeTab, setActiveTab] = useState("overview")

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
    if (!isConnected || !address) {
      router.push("/")
    }
  }, [isConnected, address, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!address || !connection) return

      try {
        setIsLoading(true)
        
        // Fetch balance
        const publicKey = new PublicKey(address)
        const balance = await connection.getBalance(publicKey)
        setBalance(balance / LAMPORTS_PER_SOL)

        // Fetch recent transactions
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 3 })
        const txDetails = await Promise.all(
          signatures.map(async (sig) => {
            const tx = await connection.getTransaction(sig.signature)
            const isSent = tx?.transaction.message.accountKeys[0].toString() === address
            return {
              signature: sig.signature,
              timestamp: sig.blockTime || 0,
              type: isSent ? 'sent' : 'received',
              amount: 0
            }
          })
        )
        setTransactions(txDetails)
      } catch (error) {
        console.error("Failed to fetch wallet data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch wallet data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address, connection, toast])

  if (!isConnected) return null

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
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
                <AvatarFallback>User</AvatarFallback>
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
                  <span className="font-mono">{address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={viewOnExplorer}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wallet Balance</CardTitle>
                    <CardDescription>Your current SOL balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading balance...</p>
                    ) : (
                      <p className="text-2xl font-bold">{balance.toFixed(2)} SOL</p>
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
                      {((totalReturns / totalLiquidityProvided) * 100).toFixed(1)}% ROI
                    </p>
                  </CardContent>
                </Card>
              </div>
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
                  {mockInvoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">#{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(invoice.amount)}</p>
                      </div>
                      <Badge variant={invoice.status === 'tokenized' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                  ))}
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
                <div className="space-y-4">
                  {mockInvoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">#{invoice.id}</h3>
                          <p className="text-sm text-muted-foreground">{invoice.company}</p>
                        </div>
                        <Badge variant={invoice.status === 'tokenized' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Due Date</p>
                          <p className="font-medium">{formatDate(new Date(invoice.dueDate).getTime())}</p>
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
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        {invoice.status === 'tokenized' && (
                          <Button size="sm">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Withdraw Funds
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                            {((contribution.returns / contribution.amount) * 100).toFixed(1)}%
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
