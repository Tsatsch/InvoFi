import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Coins, LineChart, Users, Shield, Zap, Globe, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "About InvoFi | Decentralized Invoice Financing",
  description: "Learn about InvoFi's mission to revolutionize invoice financing through blockchain technology and automated market making.",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About InvoFi</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transforming unpaid invoices into blockchain-based digital assets through decentralized liquidity pools
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6" />
          <h2 className="text-2xl font-bold">What is InvoFi?</h2>
        </div>
        <p className="text-lg">
          InvoFi is a decentralized platform that transforms unpaid invoices into blockchain-based digital assets. Verified invoices are tokenized as NFTs and instantly financed through a decentralized liquidity pool powered by an Automated Market Maker (AMM) — enabling businesses to unlock working capital in minutes, not months.
        </p>
        <p className="text-lg">
          InvoFi is not just an app — it's the foundation for decentralized trade finance.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Why We Built InvoFi</h2>
        </div>
        <div className="space-y-4">
          <p className="text-lg">
            Traditional invoice financing is slow, opaque, and designed for large corporations. Small and mid-sized businesses face high fees, long delays, and limited access to liquidity — despite having strong receivables on their books.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Instant Liquidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Verified invoices are tokenized and sold instantly to a decentralized liquidity pool. No more waiting 30-90 days — businesses get upfront cash based on the invoice's risk profile and payment terms.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Decentralized Capital Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Funding doesn't depend on centralized lenders or banks. Instead, it's powered by a global network of liquidity providers (LPs), enabling inclusive, borderless access to capital.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Fraud-Resistant Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>InvoFi tokenizes invoices with automatic verification built into the tokenization process, ensuring only authentic, verifiable invoices are minted as tokens.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Transparent & Trustless
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Every invoice exists as a token on-chain, with auditable history, programmable settlement logic, and clear repayment tracking. No hidden fees, no black-box underwriting.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <LineChart className="w-6 h-6" />
          <h2 className="text-2xl font-bold">How the AMM Works</h2>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Pricing Factors</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Invoice term (30, 60, 90 days)</li>
                <li>Creditworthiness of the debtor</li>
                <li>Time decay (closer to due date = higher price)</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Key Points</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Single LP Ownership with fractional financing</li>
                <li>Dynamic AMM pricing based on market conditions</li>
                <li>Instant funding for businesses</li>
                <li>Automated repayment distribution</li>
              </ul>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>How it Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>LPs deposit stablecoins (USDC) into decentralized liquidity pools</li>
                <li>Verified invoices are automatically tokenized as NFTs</li>
                <li>Tokenized invoices are listed in the AMM marketplace</li>
                <li>One LP per invoice buys the invoice, with capital pooled from multiple LPs</li>
                <li>LPs receive fractional shares of the invoice purchase</li>
                <li>When paid, the protocol distributes repayment to fractional contributors</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <h2 className="text-2xl font-bold">For Financial Institutions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                As a Liquidity Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Banks can deposit capital into invoice pools to earn real-world yield, accessing a new asset class of short-term, real-economy lending with on-chain transparency and risk-adjusted returns.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                As a Verification Oracle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Banks can validate invoice authenticity and debtor credibility, earning fees per verified invoice while maintaining high-quality standards in the protocol.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                As a Protocol Operator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Banks can run and manage permissioned pools for corporate clients, earning management or performance fees while ensuring regulatory compliance.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                As a Risk Underwriter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Banks can offer insurance on invoice repayment or default guarantees, creating a new premium-based business model built on top of the protocol.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">The Vision</h2>
        </div>
        <div className="space-y-4">
          <p className="text-lg">
            InvoFi's mission is to democratize invoice financing by building a protocol that is transparent, programmable, efficient, scalable, and inclusive of businesses traditionally overlooked.
          </p>
          <p className="text-lg">
            By converting receivables into digital assets and enabling real-time financing through DeFi liquidity pools, we're unlocking trillions in trapped working capital across the global B2B economy.
          </p>
        </div>
      </section>
    </div>
  )
} 