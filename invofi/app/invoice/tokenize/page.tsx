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

export default function TokenizeInvoicePage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [isUploaded, setIsUploaded] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const { isConnected, address } = useWallet()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Here you would implement actual file validation
      setIsUploaded(true)
    }
  }

  const handleSendForApproval = () => {
    // This would send the invoice to the counterparty for approval
    alert(`Approval request would be sent to ${recipientEmail}`)
  }

  const truncateAddress = (addr: string | null) => {
    if (!addr) return ""
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tokenize Invoice</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          <TabsTrigger value="connect" disabled={!isUploaded}>
            Connect Wallet
          </TabsTrigger>
          <TabsTrigger value="approve" disabled={!isUploaded || !isConnected}>
            Get Approval
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
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => window.history.back()}>
                Cancel
              </Button>
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
              <CardDescription>Connect your blockchain wallet to proceed with tokenization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-8 text-center space-y-4">
                {isConnected ? (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <Wallet className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="font-medium">Wallet Connected</h3>
                    <p className="text-sm">{truncateAddress(address)}</p>
                    <WalletButton />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Wallet className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">Connect Your Wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      You need to connect a blockchain wallet to tokenize your invoice
                    </p>
                    <WalletButton />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">What happens next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Your invoice will be prepared for tokenization</li>
                  <li>The counterparty will need to approve the invoice</li>
                  <li>Once approved, the invoice will be tokenized on the blockchain</li>
                  <li>You can then use the tokenized invoice to access financing</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab("upload")}>
                Back
              </Button>
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
                The invoice needs to be approved by the counterparty before tokenization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Counterparty Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    An email will be sent to the counterparty with instructions to review and approve the invoice
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Optional Message</Label>
                  <Input id="message" placeholder="Please review and approve this invoice for tokenization" />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Both parties must approve the invoice before it can be tokenized. This ensures the validity of the
                  invoice and prevents fraud.
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Tokenization Process</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Send approval request to counterparty</li>
                  <li>Counterparty reviews and approves the invoice</li>
                  <li>Smart contract is created for the invoice</li>
                  <li>Invoice is tokenized on the blockchain</li>
                  <li>You receive notification when tokenization is complete</li>
                  <li>You can then use the tokenized invoice for financing</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab("connect")}>
                Back
              </Button>
              <Button onClick={handleSendForApproval} disabled={!recipientEmail}>
                Send for Approval
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
