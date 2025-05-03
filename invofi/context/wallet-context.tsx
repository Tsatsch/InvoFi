"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "./auth-context"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
  createWallet: () => Promise<void>
  importWallet: (privateKey: string) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

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

  // Reset wallet when user changes
  useEffect(() => {
    if (!user) {
      disconnect()
    }
  }, [user])

  const connect = async () => {
    try {
      // Mock wallet connection
      // In a real app, this would use MetaMask or WalletConnect
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate a mock Ethereum address
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

      setIsConnected(true)
      setAddress(mockAddress)
      localStorage.setItem("invofi_wallet", JSON.stringify({ address: mockAddress }))

      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Wallet connection failed:", error)
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
    localStorage.removeItem("invofi_wallet")
  }

  const createWallet = async () => {
    try {
      // Mock wallet creation
      // In a real app, this would use ethers.js or Web3Auth
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate a mock Ethereum address
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

      setIsConnected(true)
      setAddress(mockAddress)
      localStorage.setItem("invofi_wallet", JSON.stringify({ address: mockAddress }))

      toast({
        title: "Wallet Created",
        description: "Your new wallet has been created and connected.",
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Wallet creation failed:", error)
      toast({
        title: "Creation Failed",
        description: "Could not create a new wallet. Please try again.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  const importWallet = async (privateKey: string) => {
    try {
      // Mock wallet import
      // In a real app, this would use ethers.js
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (!privateKey || privateKey.length < 10) {
        throw new Error("Invalid private key")
      }

      // Generate a mock Ethereum address
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

      setIsConnected(true)
      setAddress(mockAddress)
      localStorage.setItem("invofi_wallet", JSON.stringify({ address: mockAddress }))

      toast({
        title: "Wallet Imported",
        description: "Your wallet has been imported and connected.",
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Wallet import failed:", error)
      toast({
        title: "Import Failed",
        description: "Could not import wallet. Please check your private key and try again.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  return (
    <WalletContext.Provider value={{ isConnected, address, connect, disconnect, createWallet, importWallet }}>
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
