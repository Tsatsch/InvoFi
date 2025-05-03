"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useWallet } from "@/context/wallet-context"
import { UserNav } from "@/components/user-nav"
import { WalletButton } from "@/components/wallet-button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isConnected } = useWallet()

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Create Invoice", href: "/invoice/create" },
    { name: "Tokenize Invoice", href: "/invoice/tokenize" },
    ...(user ? [{ name: "Dashboard", href: "/dashboard" }] : []),
  ]

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl flex items-center mr-6">
            <span className="text-primary">Invo</span>Fi
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <WalletButton />
              <UserNav />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden sm:block">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
          <ModeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                {!user && (
                  <>
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
