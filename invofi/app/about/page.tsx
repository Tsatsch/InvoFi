"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">About InvoFi</h1>
          <p className="text-xl text-muted-foreground">
            Revolutionizing invoice financing through blockchain technology
          </p>
        </div>

        {/* What is InvoFi Section */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>🌐</span> What is InvoFi?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">InvoFi</strong> is a decentralized platform that revolutionizes invoice financing by turning unpaid invoices into blockchain-based digital assets. These tokenized invoices can be used as collateral in a <strong className="text-foreground">peer-to-peer lending marketplace</strong>, enabling businesses to access working capital faster, more securely, and without relying on traditional banks.
                </p>
                <p>
                  InvoFi addresses a key issue many businesses face: <strong className="text-foreground">delayed cash flow</strong>. Instead of waiting weeks or months for invoice payments, companies can tokenize verified receivables and instantly receive funding from competing lenders. This creates a <strong className="text-foreground">liquid, transparent, and fair lending environment</strong>, where the best rates are determined by market demand, not centralized institutions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why We Built Section */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>🚀</span> Why We Built InvoFi
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Traditional invoice financing is slow, opaque, and centralized, often favoring large corporations and financial institutions. Small and medium-sized businesses (SMBs) are especially underserved, facing rigid requirements and high fees.
                </p>
                <p>InvoFi is built to solve these problems:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="text-foreground">Faster Access to Liquidity</strong> – Businesses no longer need to wait for lengthy bank approvals or payment cycles. With InvoFi, verified invoices can unlock immediate capital.
                  </li>
                  <li>
                    <strong className="text-foreground">Decentralized Lending</strong> – By opening the market to a range of lenders, from crypto-native investors to DeFi liquidity pools—we ensure competitive interest rates and broader access to credit.
                  </li>
                  <li>
                    <strong className="text-foreground">Fraud-Resistant Verification</strong> – InvoFi includes a hybrid verification layer to confirm invoice authenticity and prevent fake submissions. Initially manual, this system will evolve into a scalable, automated process.
                  </li>
                  <li>
                    <strong className="text-foreground">Transparency & Trust</strong> – Every invoice token lives on-chain, providing tamper-proof history, real-time payment tracking, and dynamic risk scoring that lenders can trust.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vision Section */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>💡</span> The Vision
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our mission is to democratize invoice financing by making it <strong className="text-foreground">accessible, transparent, and secure</strong> for businesses of all sizes. InvoFi is not just a financial tool, it's an ecosystem that aligns incentives between borrowers and lenders while leveraging the power of blockchain to remove friction, cut costs, and eliminate fraud.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 