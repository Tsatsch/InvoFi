// Whitelisted admin addresses
export const ADMIN_ADDRESSES = [
  "HzVz5UReDtaL64ZCXjKhn2gSwhxuqB3KUYF79MJGuEJh"
]

// Check if an address is an admin
export const isAdminAddress = (address: string | null): boolean => {
  if (!address) return false
  return ADMIN_ADDRESSES.includes(address)
} 