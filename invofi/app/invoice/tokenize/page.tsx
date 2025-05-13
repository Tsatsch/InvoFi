"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wallet, Loader2, CheckCircle2, FileText, Download } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { WalletButton } from "@/components/wallet-button"
import { InvoiceVerification } from "@/components/invoice-verification"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { InvoicePreview } from "@/components/invoice-preview"
import type { InvoiceData, InvoiceItem } from '@/components/invoice-preview'
import { DatePicker } from "@/components/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"

// Mock counterparty wallet address
const MOCK_COUNTERPARTY_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

export default function TokenizeInvoicePage() {
  const [activeTab, setActiveTab] = useState("create")
  const [createTab, setCreateTab] = useState("form")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [isVerificationComplete, setIsVerificationComplete] = useState(false)
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const { isConnected, address } = useWallet()
  const router = useRouter()

  // Add state variables to track step completion
  const [isInvoiceCreated, setIsInvoiceCreated] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isApprovalRequested, setIsApprovalRequested] = useState(false)

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    issueDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    senderName: "",
    senderCompany: "",
    senderAddress: "",
    senderEmail: "",
    senderPhone: "",
    senderVatId: "",
    senderRegNumber: "",
    recipientName: "",
    recipientCompany: "",
    recipientAddress: "",
    recipientEmail: "",
    recipientVatId: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
    bankName: "",
    accountNumber: "",
    bicSwift: "",
    taxRate: 20,
    notes: "",
  })

  const handleInputChange = (field: string, value: any) => {
    setInvoiceData((prev: InvoiceData) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setInvoiceData((prev: InvoiceData) => ({ ...prev, items: updatedItems }))
  }

  const addItem = () => {
    setInvoiceData((prev: InvoiceData) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    if (invoiceData.items.length > 1) {
      const updatedItems = [...invoiceData.items]
      updatedItems.splice(index, 1)
      setInvoiceData((prev: InvoiceData) => ({ ...prev, items: updatedItems }))
    }
  }

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum: number, item: InvoiceItem) => {
      return sum + item.quantity * item.unitPrice
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (invoiceData.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const handleDownload = async () => {
    try {
      await api.generateInvoice(invoiceData)
    } catch (error) {
      console.error('Failed to generate invoice:', error)
    }
  }

  // Update handlers to set step completion
  const handleCreateComplete = () => {
    setIsInvoiceCreated(true)
    setActiveTab("connect")
  }

  const handleWalletConnected = () => {
    setIsWalletConnected(true)
    setActiveTab("approve")
  }

  const handleSendForApproval = () => {
    alert(`Approval request would be sent to ${recipientEmail}`)
    setIsWaitingForApproval(true)
    setIsApprovalRequested(true)
    
    // Mock the approval process - wait 5 seconds then show approval
    setTimeout(() => {
      setIsApproved(true)
      setIsWaitingForApproval(false)
      setActiveTab("verify")
    }, 5000)
  }

  const handleVerificationComplete = () => {
    setIsVerificationComplete(true)
  }

  const truncateAddress = (addr: string | null) => {
    if (!addr) return ""
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Tokenize Invoice</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
          <TabsTrigger 
            value="connect" 
            disabled={!isInvoiceCreated}
            className={cn(
              !isInvoiceCreated && "opacity-50 cursor-not-allowed"
            )}
          >
            Connect Wallet
          </TabsTrigger>
          <TabsTrigger 
            value="approve" 
            disabled={!isWalletConnected}
            className={cn(
              !isWalletConnected && "opacity-50 cursor-not-allowed"
            )}
          >
            Get Approval
          </TabsTrigger>
          <TabsTrigger 
            value="verify" 
            disabled={!isApprovalRequested}
            className={cn(
              !isApprovalRequested && "opacity-50 cursor-not-allowed"
            )}
          >
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Create Your Invoice</CardTitle>
              <CardDescription>Fill in the invoice details to start the tokenization process</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={createTab} onValueChange={setCreateTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Fill Details</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="form">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="invoiceNumber" className="text-sm">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          value={invoiceData.invoiceNumber}
                          onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                          placeholder="INV-001"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Issue Date</Label>
                        <DatePicker date={invoiceData.issueDate} setDate={(date) => handleInputChange("issueDate", date)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Due Date</Label>
                        <DatePicker date={invoiceData.dueDate} setDate={(date) => handleInputChange("dueDate", date)} />
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sender Information */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Your Information</h3>

                        <div className="space-y-1">
                          <Label htmlFor="senderCompany" className="text-sm">Company Name</Label>
                          <Input
                            id="senderCompany"
                            value={invoiceData.senderCompany}
                            onChange={(e) => handleInputChange("senderCompany", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="senderName" className="text-sm">Contact Name</Label>
                          <Input
                            id="senderName"
                            value={invoiceData.senderName}
                            onChange={(e) => handleInputChange("senderName", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="senderAddress" className="text-sm">Address</Label>
                          <Textarea
                            id="senderAddress"
                            value={invoiceData.senderAddress}
                            onChange={(e) => handleInputChange("senderAddress", e.target.value)}
                            rows={2}
                            className="min-h-[60px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="senderEmail" className="text-sm">Email</Label>
                            <Input
                              id="senderEmail"
                              type="email"
                              value={invoiceData.senderEmail}
                              onChange={(e) => handleInputChange("senderEmail", e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="senderPhone" className="text-sm">Phone</Label>
                            <Input
                              id="senderPhone"
                              value={invoiceData.senderPhone}
                              onChange={(e) => handleInputChange("senderPhone", e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recipient Information */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Client Information</h3>

                        <div className="space-y-1">
                          <Label htmlFor="recipientCompany" className="text-sm">Company Name</Label>
                          <Input
                            id="recipientCompany"
                            value={invoiceData.recipientCompany}
                            onChange={(e) => handleInputChange("recipientCompany", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="recipientName" className="text-sm">Contact Name</Label>
                          <Input
                            id="recipientName"
                            value={invoiceData.recipientName}
                            onChange={(e) => handleInputChange("recipientName", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="recipientAddress" className="text-sm">Address</Label>
                          <Textarea
                            id="recipientAddress"
                            value={invoiceData.recipientAddress}
                            onChange={(e) => handleInputChange("recipientAddress", e.target.value)}
                            rows={2}
                            className="min-h-[60px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="recipientEmail" className="text-sm">Email</Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            value={invoiceData.recipientEmail}
                            onChange={(e) => handleInputChange("recipientEmail", e.target.value)}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    {/* Invoice Items */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Invoice Items</h3>

                      {invoiceData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-6 space-y-1">
                            <Label htmlFor={`item-${index}-desc`} className="text-sm">Description</Label>
                            <Input
                              id={`item-${index}-desc`}
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label htmlFor={`item-${index}-qty`} className="text-sm">Quantity</Label>
                            <Input
                              id={`item-${index}-qty`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3 space-y-1">
                            <Label htmlFor={`item-${index}-price`} className="text-sm">Unit Price</Label>
                            <Input
                              id={`item-${index}-price`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-8 w-8 p-0"
                              onClick={() => removeItem(index)}
                              disabled={invoiceData.items.length <= 1}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button variant="outline" size="sm" onClick={addItem} className="h-8">
                        + Add Item
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Payment Details</h3>

                        <div className="space-y-1">
                          <Label htmlFor="bankName" className="text-sm">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={invoiceData.bankName}
                            onChange={(e) => handleInputChange("bankName", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="accountNumber" className="text-sm">Account Number</Label>
                          <Input
                            id="accountNumber"
                            value={invoiceData.accountNumber}
                            onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="taxRate" className="text-sm">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            min="0"
                            max="100"
                            value={invoiceData.taxRate}
                            onChange={(e) => handleInputChange("taxRate", Number.parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Additional Information</h3>

                        <div className="space-y-1">
                          <Label htmlFor="notes" className="text-sm">Notes</Label>
                          <Textarea
                            id="notes"
                            value={invoiceData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            rows={3}
                            className="min-h-[80px]"
                            placeholder="Payment terms, delivery information, or any other notes..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <div className="space-y-4">
                    <InvoicePreview
                      invoiceData={invoiceData}
                      subtotal={calculateSubtotal()}
                      tax={calculateTax()}
                      total={calculateTotal()}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              {createTab === "form" ? (
                <>
                  <div className="text-xs text-muted-foreground">All fields marked with * are required</div>
                  <Button onClick={() => setCreateTab("preview")}>Preview Invoice</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={handleCreateComplete}>
                    Proceed to Tokenization
                  </Button>
                </>
              )}
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
              <Button onClick={handleWalletConnected} disabled={!isConnected}>
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
              {isWaitingForApproval ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    <div className="flex-1">
                      <h3 className="font-medium">Waiting for Counterparty Approval</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        We've sent an approval request to {recipientEmail}
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>What's happening?</AlertTitle>
                    <AlertDescription>
                      The counterparty will receive an email with a link to review and approve the invoice. 
                      This is a mock simulation - in production, this would wait for actual approval.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
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
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              {!isWaitingForApproval && (
                <Button onClick={handleSendForApproval} disabled={!recipientEmail}>
                  Send for Approval
                </Button>
              )}
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
              {isApproved && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-700">Invoice Approved</h3>
                      <p className="text-sm text-green-600">
                        Approved by wallet: {truncateAddress(MOCK_COUNTERPARTY_WALLET)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <InvoiceVerification onComplete={handleVerificationComplete} />
            </CardContent>
            <CardFooter className="flex justify-end">
              {isVerificationComplete && (
                <Button onClick={handleContinue}>
                  Continue to Dashboard
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
