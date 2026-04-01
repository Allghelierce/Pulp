'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveEncrypted, loadEncrypted, deleteEncrypted } from './localStorageEncrypt'

/**
 * Hook for encrypted localStorage access
 * Uses a simple encryption key based on user ID or session
 */
export function useEncryptedStorage<T>(
  key: string,
  initialValue: T,
  encryptionKey?: string
) {
  // Generate encryption key from browser fingerprint if not provided
  const finalKey = encryptionKey || (() => {
    const stored = sessionStorage.getItem('_encryption_key')
    if (stored) return stored

    // Generate a simple key from browser info (not cryptographically secure, but better than nothing)
    const browserKey = [
      navigator.userAgent,
      new Date().getFullYear().toString(),
      window.screen.width.toString(),
    ].join('|')

    const hash = browserKey.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0)
    }, 0).toString(16)

    sessionStorage.setItem('_encryption_key', hash)
    return hash
  })()

  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load from encrypted storage on mount
  useEffect(() => {
    try {
      const loaded = loadEncrypted<T>(key, finalKey, initialValue)
      if (loaded !== null) {
        setStoredValue(loaded)
      }
    } catch (error) {
      console.error(`Failed to load encrypted storage for ${key}:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [key, finalKey])

  // Save to encrypted storage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        saveEncrypted(key, valueToStore, finalKey)
      } catch (error) {
        console.error(`Failed to save encrypted storage for ${key}:`, error)
      }
    },
    [key, storedValue, finalKey]
  )

  // Delete from encrypted storage
  const clearValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      deleteEncrypted(key)
    } catch (error) {
      console.error(`Failed to clear encrypted storage for ${key}:`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, clearValue, isLoading] as const
}
