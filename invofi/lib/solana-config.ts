import { Connection, clusterApiUrl } from "@solana/web3.js"

// Use devnet RPC endpoint from environment variable or fallback to cluster API
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || clusterApiUrl("devnet")

// Create a connection to the Solana devnet
export const getSolanaConnection = () => {
  return new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
} 