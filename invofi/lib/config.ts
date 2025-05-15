export const SOLANA_WALLET_PATH = "/Users/nikitatikhomirov/.config/solana/id.json";
export const HELIUS_API_KEY = "[REDACTED]";

// Whitelisted admin addresses
export const ADMIN_ADDRESSES = [
  "HzVz5UReDtaL64ZCXjKhn2gSwhxuqB3KUYF79MJGuEJh",
  "2UBUzdkZZSZaEJiWNwmXQPjRA8iVL2H8okwL8K5BsbrU"
]

// Check if an address is an admin
export const isAdminAddress = (address: string | null): boolean => {
  if (!address) return false
  return ADMIN_ADDRESSES.includes(address)
} 