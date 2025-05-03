"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

export interface User {
  id: string
  name: string | null
  email: string
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
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
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

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("invofi_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to parse stored user:", e)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, this would be a response from your auth API
      const mockUser: User = {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name: email.split("@")[0],
        email,
        image: null,
        companyProfile: null,
      }

      setUser(mockUser)
      localStorage.setItem("invofi_user", JSON.stringify(mockUser))

      toast({
        title: "Login Successful",
        description: "Welcome back to InvoFi!",
      })
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, this would be a response from your auth API
      const mockUser: User = {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name,
        email,
        image: null,
        companyProfile: null,
      }

      setUser(mockUser)
      localStorage.setItem("invofi_user", JSON.stringify(mockUser))

      toast({
        title: "Registration Successful",
        description: "Your account has been created. Welcome to InvoFi!",
      })
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Registration Failed",
        description: "Could not create your account. Please try again.",
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
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateProfile, updateCompanyProfile }}>
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
