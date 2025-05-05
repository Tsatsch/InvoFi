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
import { Wallet, ExternalLink, Copy, LogOut, ChevronDown, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

export function WalletButton() {
  const { isConnected, address, connect, disconnect } = useWallet()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (walletType: 'phantom' | 'solflare') => {
    setIsConnecting(true)
    try {
      await connect(walletType)
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 rounded-full"
            disabled={isConnecting}
          >
            <Wallet className="h-4 w-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect"}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          <DropdownMenuLabel className="text-sm font-normal text-muted-foreground px-2">
            Select Wallet
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-2" />
          <div className="space-y-1">
            <DropdownMenuItem 
              onClick={() => handleConnect('phantom')}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent"
            >
              <div className="w-8 h-8 rounded-full bg-[#AB9FF2] flex items-center justify-center">
                <Image
                  src="/phantom.svg"
                  alt="Phantom"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Phantom</span>
                <span className="text-xs text-muted-foreground">Solana Wallet</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleConnect('solflare')}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent"
            >
              <div className="w-8 h-8 rounded-full bg-[#4C4C4C] flex items-center justify-center">
                <Image
                  src="/solflare.svg"
                  alt="Solflare"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Solflare</span>
                <span className="text-xs text-muted-foreground">Solana Wallet</span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 rounded-full"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {truncateAddress(address)}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="text-sm font-normal text-muted-foreground px-2">
          Connected Wallet
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <div className="space-y-1">
          {user && (
            <DropdownMenuItem asChild>
              <Link 
                href="/dashboard"
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={copyAddress}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={viewOnExplorer}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View on Solscan</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem 
            onClick={handleDisconnect}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
