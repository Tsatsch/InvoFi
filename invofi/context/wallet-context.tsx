"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Connection, PublicKey } from "@solana/web3.js"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { getSolanaConnection } from "@/lib/solana-config"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
  connection: Connection | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [wallet, setWallet] = useState<PhantomWalletAdapter | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const { toast } = useToast()

  // Initialize wallet adapter and connection
  useEffect(() => {
    const phantomWallet = new PhantomWalletAdapter()
    setWallet(phantomWallet)
    setConnection(getSolanaConnection())
  }, [])

  // Check for existing wallet connection on mount
  useEffect(() => {
    const storedWallet = localStorage.getItem("invofi_wallet")
    if (storedWallet) {
      try {
        const wallet = JSON.parse(storedWallet)
        setIsConnected(true)
        setAddress(wallet.address)
      } catch (e) {
        console.error("Failed to parse stored wallet:", e)
      }
    }
  }, [])

  const connect = async () => {
    try {
      if (!wallet) {
        throw new Error("Wallet adapter not initialized")
      }

      await wallet.connect()
      const publicKey = wallet.publicKey
      if (!publicKey) {
        throw new Error("Failed to get public key")
      }

      // Verify wallet ownership by signing a message
      const message = "Sign this message to verify your wallet ownership"
      const encodedMessage = new TextEncoder().encode(message)
      
      try {
        const signature = await wallet.signMessage(encodedMessage)
        
        if (!signature) {
          throw new Error("Failed to sign message")
        }

        setIsConnected(true)
        setAddress(publicKey.toString())
        localStorage.setItem("invofi_wallet", JSON.stringify({ 
          address: publicKey.toString(),
          signature: Array.from(signature)
        }))

        toast({
          title: "Wallet Connected",
          description: "Your wallet has been successfully connected.",
        })

        return Promise.resolve()
      } catch (signError) {
        // If user cancels the signature, silently disconnect
        await wallet.disconnect()
        return Promise.resolve()
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
      setIsConnected(false)
      setAddress(null)
      localStorage.removeItem("invofi_wallet")
      
      // Only show error for actual connection failures, not for cancelled signatures
      if (!(error instanceof Error && error.message === "Signature request was cancelled")) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to wallet. Please try again.",
          variant: "destructive",
        })
      }
      return Promise.reject(error)
    }
  }

  const disconnect = () => {
    if (wallet) {
      wallet.disconnect()
    }
    setIsConnected(false)
    setAddress(null)
    localStorage.removeItem("invofi_wallet")
  }

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      address, 
      connect, 
      disconnect,
      connection
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
