"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getSolanaConnection } from "@/lib/solana-config"

interface Transaction {
  signature: string
  timestamp: number
  type: 'sent' | 'received'
  amount: number
}

export default function DashboardPage() {
  const { address, isConnected, connection } = useWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
              amount: 0 // You might want to parse the actual amount from the transaction
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
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
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
                <CardTitle>Wallet Dashboard</CardTitle>
                <CardDescription>Manage your wallet and transactions</CardDescription>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading transactions...</p>
                    ) : transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div key={tx.signature} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {tx.type === 'sent' ? (
                                <ArrowUpRight className="h-4 w-4 text-destructive" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {tx.type === 'sent' ? 'Sent' : 'Received'} SOL
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(tx.timestamp)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Wallet Balance</CardTitle>
                    <CardDescription>Your current SOL balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading balance...</p>
                    ) : (
                      <p className="text-2xl font-bold">{balance.toFixed(4)} SOL</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
