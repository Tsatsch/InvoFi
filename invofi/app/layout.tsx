import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { WalletProvider } from "@/context/wallet-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InvoFi | Invoice Financing on Blockchain",
  description: "Access short-term liquidity by tokenizing your invoices",
  generator: 'v0.dev',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'InvoFi | Invoice Financing on Blockchain',
    description: 'Access short-term liquidity by tokenizing your invoices',
    images: ['/logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InvoFi | Invoice Financing on Blockchain',
    description: 'Access short-term liquidity by tokenizing your invoices',
    images: ['/logo.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <AuthProvider>
              <Header />
              <main className="min-h-screen bg-background">{children}</main>
              <Toaster />
            </AuthProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
