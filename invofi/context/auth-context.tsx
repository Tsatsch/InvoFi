"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/context/wallet-context"
import { PublicKey } from "@solana/web3.js"
import { verify } from "@noble/ed25519"
import { sha512 } from "@noble/hashes/sha512"

// Configure @noble/ed25519 to use @noble/hashes
import { etc } from "@noble/ed25519"
etc.sha512Sync = (...m) => sha512(etc.concatBytes(...m))

export interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  companyProfile?: {
    companyName: string
    vatId: string
    country: string
    address: string
    isComplete: boolean
  } | null
}

interface AuthContextType {
  user: User | null
  login: (address: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateProfile: (profile: Partial<User>) => Promise<void>
  updateCompanyProfile: (profile: User["companyProfile"]) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { address, isConnected } = useWallet()

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("invofi_user")
    const storedWallet = localStorage.getItem("invofi_wallet")
    
    if (storedUser && storedWallet) {
      try {
        const user = JSON.parse(storedUser)
        const wallet = JSON.parse(storedWallet)
        
        // Verify the stored signature
        verifySignature(wallet.address, wallet.signature).then((isValid) => {
          if (isValid) {
            setUser(user)
          } else {
            // Clear invalid session
            localStorage.removeItem("invofi_user")
            localStorage.removeItem("invofi_wallet")
          }
        })
      } catch (e) {
        console.error("Failed to parse stored user:", e)
      }
    }
    setIsLoading(false)
  }, [])

  // Auto-login when wallet is connected
  useEffect(() => {
    if (isConnected && address && !user) {
      login(address)
    }
  }, [isConnected, address])

  const verifySignature = async (address: string, signature: number[]) => {
    try {
      const publicKey = new PublicKey(address)
      const message = "Sign this message to verify your wallet ownership"
      const encodedMessage = new TextEncoder().encode(message)
      
      // Convert the signature to Uint8Array
      const signatureBytes = new Uint8Array(signature)
      
      // Verify the signature using @noble/ed25519
      const isValid = await verify(
        signatureBytes,
        encodedMessage,
        publicKey.toBytes()
      )

      return isValid
    } catch (error) {
      console.error("Signature verification failed:", error)
      return false
    }
  }

  const login = async (address: string) => {
    setIsLoading(true)
    try {
      const storedWallet = localStorage.getItem("invofi_wallet")
      if (!storedWallet) {
        throw new Error("No wallet signature found")
      }

      const wallet = JSON.parse(storedWallet)
      const isValid = await verifySignature(address, wallet.signature)

      if (!isValid) {
        throw new Error("Invalid wallet signature")
      }

      // In a real app, this would be a response from your auth API
      const mockUser: User = {
        id: address,
        name: null,
        email: null,
        image: null,
        companyProfile: null,
      }

      setUser(mockUser)
      localStorage.setItem("invofi_user", JSON.stringify(mockUser))

      toast({
        title: "Login Successful",
        description: "Welcome to InvoFi!",
      })
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login Failed",
        description: "Could not authenticate your wallet. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("invofi_user")
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const updateProfile = async (profile: Partial<User>) => {
    if (!user) return Promise.reject("No user logged in")

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedUser = { ...user, ...profile }
      setUser(updatedUser)
      localStorage.setItem("invofi_user", JSON.stringify(updatedUser))

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Profile update failed:", error)
      toast({
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  const updateCompanyProfile = async (profile: User["companyProfile"]) => {
    if (!user) return Promise.reject("No user logged in")

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedUser = { ...user, companyProfile: { ...profile, isComplete: true } }
      setUser(updatedUser)
      localStorage.setItem("invofi_user", JSON.stringify(updatedUser))

      toast({
        title: "Company Profile Updated",
        description: "Your company profile has been successfully updated.",
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Company profile update failed:", error)
      toast({
        title: "Update Failed",
        description: "Could not update your company profile. Please try again.",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateProfile, updateCompanyProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
