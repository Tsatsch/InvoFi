export const SOLANA_WALLET_PATH = "";
export const HELIUS_API_KEY = "";

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