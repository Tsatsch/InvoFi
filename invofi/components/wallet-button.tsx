"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWallet } from "@/context/wallet-context"
import { Wallet, ExternalLink, Copy, LogOut } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function WalletButton() {
  const { isConnected, address, connect, disconnect } = useWallet()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
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

  const truncateAddress = (addr: string | null) => {
    if (!addr) return ""
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <Button 
        size="sm" 
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleConnect} 
        disabled={isConnecting}
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Wallet className="h-4 w-4 mr-1" />
          {truncateAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewOnExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Solscan</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
