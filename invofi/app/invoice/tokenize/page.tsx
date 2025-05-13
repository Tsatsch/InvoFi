"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileText, Upload, Wallet } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { WalletButton } from "@/components/wallet-button"
import { InvoiceVerification } from "@/components/invoice-verification"
import { useRouter } from "next/navigation"

export default function TokenizeInvoicePage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [isUploaded, setIsUploaded] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [isVerificationComplete, setIsVerificationComplete] = useState(false)
  const { isConnected, address } = useWallet()
  const router = useRouter()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Here you would implement actual file validation
      setIsUploaded(true)
    }
  }

  const handleSendForApproval = () => {
    // This would send the invoice to the counterparty for approval
    alert(`Approval request would be sent to ${recipientEmail}`)
    setActiveTab("verify")
  }

  const handleVerificationComplete = () => {
    setIsVerificationComplete(true)
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const truncateAddress = (addr: string | null) => {
    if (!addr) return ""
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tokenize Invoice</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          <TabsTrigger value="connect" disabled={!isUploaded}>
            Connect Wallet
          </TabsTrigger>
          <TabsTrigger value="approve" disabled={!isUploaded || !isConnected}>
            Get Approval
          </TabsTrigger>
          <TabsTrigger value="verify" disabled={!isUploaded || !isConnected}>
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Invoice</CardTitle>
              <CardDescription>
                Upload an invoice generated with InvoFi to start the tokenization process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                {isUploaded ? (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <FileText className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="font-medium">invoice-001.pdf</h3>
                    <p className="text-sm text-muted-foreground">File uploaded successfully</p>
                    <Button variant="outline" size="sm" onClick={() => setIsUploaded(false)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">Drag and drop your invoice file</h3>
                    <p className="text-sm text-muted-foreground">or click to browse files (PDF, JSON)</p>
                    <div>
                      <Label htmlFor="invoice-upload" className="sr-only">
                        Choose file
                      </Label>
                      <Input id="invoice-upload" type="file" className="hidden" onChange={handleFileUpload} />
                      <Button variant="outline" onClick={() => document.getElementById("invoice-upload")?.click()}>
                        Select File
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Only invoices generated with InvoFi can be tokenized. If you need to create a new invoice, please use
                  our{" "}
                  <a href="/invoice/create" className="text-primary underline">
                    invoice generator
                  </a>
                  .
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setActiveTab("connect")} disabled={!isUploaded}>
                Continue
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="connect">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to proceed with the tokenization process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center space-y-4 p-8">
                  <Wallet className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    Connect your wallet to continue with the tokenization process
                  </p>
                  <WalletButton />
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Wallet Connected</AlertTitle>
                    <AlertDescription>
                      Your wallet is connected: {truncateAddress(address)}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setActiveTab("approve")} disabled={!isConnected}>
                Continue
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="approve">
          <Card>
            <CardHeader>
              <CardTitle>Get Counterparty Approval</CardTitle>
              <CardDescription>
                Send the invoice to the counterparty for approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="counterparty@company.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Note</AlertTitle>
                  <AlertDescription>
                    The counterparty will receive an email with a link to approve the invoice. Once approved, the verification process will begin.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSendForApproval} disabled={!recipientEmail}>
                Send for Approval
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Verification</CardTitle>
              <CardDescription>
                Your invoice is being verified and risk-assessed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceVerification onComplete={handleVerificationComplete} />
            </CardContent>
            <CardFooter className="flex justify-end">
              {isVerificationComplete && (
                <Button onClick={handleContinue}>
                  Return to Homepage
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
