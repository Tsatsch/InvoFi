'use client';

import { useEffect, useState } from 'react';
import { api, Invoice } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, FileText, Upload, Wallet, BarChart3, Clock, Store } from "lucide-react"
import { HeroSection } from "@/components/hero-section"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6">
      <HeroSection />

      <section className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Invoice
            </CardTitle>
            <CardDescription>Create a standardized EU invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Fill out our invoice template with your business details and invoice information. Generate a professional
              document ready for download or tokenization.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/invoice/create" className="w-full">
              <Button className="w-full group">
                Create Invoice
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Tokenize Invoice
            </CardTitle>
            <CardDescription>Upload an existing invoice for tokenization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Already have an invoice? Upload it here to start the tokenization process and access immediate financing
              against your receivables.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/invoice/tokenize" className="w-full">
              <Button className="w-full group">
                Upload Invoice
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Invoice Marketplace
            </CardTitle>
            <CardDescription>Invest in tokenized invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Browse available tokenized invoices and invest in them at discounted rates. Higher risk means higher potential returns.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/marketplace" className="w-full">
              <Button className="w-full group">
                View Marketplace
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </section>

      <section className="mt-16 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">How InvoFi Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">1. Create & Verify</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Generate or upload your invoice and get it verified through our fraud-resistant system.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">2. Tokenize</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Your verified invoice is tokenized as an NFT with built-in verification.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">3. AMM Pricing</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              The AMM automatically prices your invoice based on risk, term, and market conditions.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">4. Instant Funding</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Receive immediate financing from the decentralized liquidity pool.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
