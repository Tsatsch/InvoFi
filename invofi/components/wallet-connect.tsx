"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/context/wallet-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Plus, Import } from "lucide-react"

export function WalletConnect() {
  const { connect, createWallet, importWallet } = useWallet()
  const [privateKey, setPrivateKey] = useState("")
  const [isLoading, setIsLoading] = useState({
    connect: false,
    create: false,
    import: false,
  })

  const handleConnect = async () => {
    setIsLoading((prev) => ({ ...prev, connect: true }))
    try {
      await connect()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsLoading((prev) => ({ ...prev, connect: false }))
    }
  }

  const handleCreate = async () => {
    setIsLoading((prev) => ({ ...prev, create: true }))
    try {
      await createWallet()
    } catch (error) {
      console.error("Failed to create wallet:", error)
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }))
    }
  }

  const handleImport = async () => {
    setIsLoading((prev) => ({ ...prev, import: true }))
    try {
      await importWallet(privateKey)
    } catch (error) {
      console.error("Failed to import wallet:", error)
    } finally {
      setIsLoading((prev) => ({ ...prev, import: false }))
    }
  }

  return (
    <Tabs defaultValue="connect" className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="connect">Connect Existing</TabsTrigger>
        <TabsTrigger value="create">Create New</TabsTrigger>
        <TabsTrigger value="import">Import Wallet</TabsTrigger>
      </TabsList>

      <TabsContent value="connect">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Wallet className="mx-auto h-12 w-12 text-primary" />
                <h3 className="font-medium">MetaMask</h3>
                <p className="text-sm text-muted-foreground">Connect using the MetaMask browser extension</p>
                <Button onClick={handleConnect} disabled={isLoading.connect} className="w-full">
                  {isLoading.connect ? "Connecting..." : "Connect MetaMask"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Wallet className="mx-auto h-12 w-12 text-primary" />
                <h3 className="font-medium">WalletConnect</h3>
                <p className="text-sm text-muted-foreground">Connect using WalletConnect compatible wallets</p>
                <Button onClick={handleConnect} disabled={isLoading.connect} className="w-full">
                  {isLoading.connect ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="create">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Plus className="mx-auto h-12 w-12 text-primary" />
              <h3 className="font-medium">Create New Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Create a new non-custodial wallet. Your private keys will remain with you.
              </p>
              <Button onClick={handleCreate} disabled={isLoading.create} className="w-full">
                {isLoading.create ? "Creating..." : "Create New Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="import">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <Import className="mx-auto h-12 w-12 text-primary" />
                <h3 className="font-medium mt-2">Import Existing Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Import your existing wallet using your private key. Your keys remain secure.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="Enter your private key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Never share your private key with anyone. This field is encrypted.
                </p>
              </div>
              <Button onClick={handleImport} disabled={isLoading.import || !privateKey} className="w-full">
                {isLoading.import ? "Importing..." : "Import Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
