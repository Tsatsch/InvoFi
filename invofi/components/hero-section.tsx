import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 mb-12 text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Unlock Your <span className="text-primary">Cash Flow</span> with InvoFi
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Transform your invoices into immediate liquidity through secure blockchain tokenization. No more waiting 30-90
          days for payment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/invoice/create">
            <Button size="lg" className="px-8">
              Create Invoice
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
