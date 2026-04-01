/**
 * Simple encryption/decryption for localStorage
 * Uses a basic XOR cipher - for production, use proper encryption like TweetNaCl.js
 */

const STORAGE_VERSION = "v1"
const STORAGE_PREFIX = "encrypted_"

/**
 * Simple hash-based encryption (not cryptographically secure, use for obfuscation only)
 * For production, replace with proper encryption library
 */
function simpleEncrypt(data: string, key: string): string {
  let encrypted = ""
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(encrypted) // Base64 encode
}

function simpleDecrypt(encrypted: string, key: string): string {
  try {
    const data = atob(encrypted) // Base64 decode
    let decrypted = ""
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return decrypted
  } catch {
    return ""
  }
}

/**
 * Save encrypted data to localStorage
 * Note: This is basic obfuscation, not true encryption
 * For production, use a proper encryption library
 */
export function saveEncrypted(key: string, value: unknown, encryptionKey: string): void {
  try {
    const json = JSON.stringify(value)
    const encrypted = simpleEncrypt(json, encryptionKey)
    const stored = JSON.stringify({ version: STORAGE_VERSION, encrypted })
    localStorage.setItem(STORAGE_PREFIX + key, stored)
  } catch (error) {
    console.error("Failed to save encrypted data:", error)
  }
}

/**
 * Load encrypted data from localStorage
 */
export function loadEncrypted<T>(key: string, encryptionKey: string, defaultValue?: T): T | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key)
    if (!stored) return defaultValue ?? null

    const { encrypted } = JSON.parse(stored)
    const decrypted = simpleDecrypt(encrypted, encryptionKey)
    return JSON.parse(decrypted) as T
  } catch (error) {
    console.error("Failed to load encrypted data:", error)
    return defaultValue ?? null
  }
}

/**
 * Delete encrypted data from localStorage
 */
export function deleteEncrypted(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

/**
 * Alternative: Clear sensitive data from localStorage (for high-security use cases)
 * Use this for really sensitive data instead of storing it
 */
export function clearSensitiveData(): void {
  const sensitiveKeys = [
    "pulp-notes",
    "pulp-settings",
    "pulp-grove",
  ]
  sensitiveKeys.forEach(key => {
    localStorage.removeItem(key)
    localStorage.removeItem(STORAGE_PREFIX + key)
  })
}
