"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { InvoicePreview } from "@/components/invoice-preview"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download } from "lucide-react"

export default function CreateInvoicePage() {
  const [activeTab, setActiveTab] = useState("details")
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    issueDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),

    // Sender details
    senderName: "",
    senderCompany: "",
    senderAddress: "",
    senderEmail: "",
    senderPhone: "",

    // Recipient details
    recipientName: "",
    recipientCompany: "",
    recipientAddress: "",
    recipientEmail: "",

    // Invoice items
    items: [{ description: "", quantity: 1, unitPrice: 0 }],

    // Payment details
    bankName: "",
    accountNumber: "",
    taxRate: 20,
    notes: "",
  })

  const handleInputChange = (field: string, value: any) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }))
  }

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    if (invoiceData.items.length > 1) {
      const updatedItems = [...invoiceData.items]
      updatedItems.splice(index, 1)
      setInvoiceData((prev) => ({ ...prev, items: updatedItems }))
    }
  }

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (invoiceData.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = () => {
    // Here you would implement the actual invoice generation logic
    // For now, we'll just switch to the preview tab
    setActiveTab("preview")
  }

  const handleDownload = () => {
    // Implement download functionality
    alert("Invoice download functionality would be implemented here")
  }

  const handleTokenize = () => {
    // Implement tokenization functionality
    alert("This would redirect to the tokenization flow, requiring wallet connection")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Invoice Details</TabsTrigger>
          <TabsTrigger value="preview">Preview & Finalize</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
              <CardDescription>Enter all the details for your new invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                    placeholder="INV-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <DatePicker date={invoiceData.issueDate} setDate={(date) => handleInputChange("issueDate", date)} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <DatePicker date={invoiceData.dueDate} setDate={(date) => handleInputChange("dueDate", date)} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sender Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Your Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="senderCompany">Company Name</Label>
                    <Input
                      id="senderCompany"
                      value={invoiceData.senderCompany}
                      onChange={(e) => handleInputChange("senderCompany", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderName">Contact Name</Label>
                    <Input
                      id="senderName"
                      value={invoiceData.senderName}
                      onChange={(e) => handleInputChange("senderName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderAddress">Address</Label>
                    <Textarea
                      id="senderAddress"
                      value={invoiceData.senderAddress}
                      onChange={(e) => handleInputChange("senderAddress", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="senderEmail">Email</Label>
                      <Input
                        id="senderEmail"
                        type="email"
                        value={invoiceData.senderEmail}
                        onChange={(e) => handleInputChange("senderEmail", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderPhone">Phone</Label>
                      <Input
                        id="senderPhone"
                        value={invoiceData.senderPhone}
                        onChange={(e) => handleInputChange("senderPhone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Client Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="recipientCompany">Company Name</Label>
                    <Input
                      id="recipientCompany"
                      value={invoiceData.recipientCompany}
                      onChange={(e) => handleInputChange("recipientCompany", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Contact Name</Label>
                    <Input
                      id="recipientName"
                      value={invoiceData.recipientName}
                      onChange={(e) => handleInputChange("recipientName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Address</Label>
                    <Textarea
                      id="recipientAddress"
                      value={invoiceData.recipientAddress}
                      onChange={(e) => handleInputChange("recipientAddress", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={invoiceData.recipientEmail}
                      onChange={(e) => handleInputChange("recipientEmail", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invoice Items */}
              <div className="space-y-4">
                <h3 className="font-medium">Invoice Items</h3>

                {invoiceData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-6 space-y-2">
                      <Label htmlFor={`item-${index}-desc`}>Description</Label>
                      <Input
                        id={`item-${index}-desc`}
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor={`item-${index}-qty`}>Quantity</Label>
                      <Input
                        id={`item-${index}-qty`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor={`item-${index}-price`}>Unit Price</Label>
                      <Input
                        id={`item-${index}-price`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeItem(index)}
                        disabled={invoiceData.items.length <= 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={addItem}>
                  + Add Item
                </Button>
              </div>

              <Separator />

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-medium">Payment Details</h3>

                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={invoiceData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={invoiceData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      value={invoiceData.taxRate}
                      onChange={(e) => handleInputChange("taxRate", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Additional Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={invoiceData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={5}
                      placeholder="Payment terms, delivery information, or any other notes..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">All fields marked with * are required</div>
              <Button onClick={handleSubmit}>Preview Invoice</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Invoice Preview</CardTitle>
                <CardDescription>Review your invoice before finalizing</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoicePreview
                  invoiceData={invoiceData}
                  subtotal={calculateSubtotal()}
                  tax={calculateTax()}
                  total={calculateTotal()}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({invoiceData.taxRate}%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" onClick={() => setActiveTab("details")}>
                    Edit Invoice
                  </Button>

                  <Button className="w-full" variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Tokenize this invoice</AlertTitle>
                    <AlertDescription>
                      Convert this invoice into a digital asset for immediate financing.
                    </AlertDescription>
                    <Button className="w-full mt-4" variant="default" onClick={handleTokenize}>
                      Proceed to Tokenization
                    </Button>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
