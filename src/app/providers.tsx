'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { initializeCsrfToken } from '@/lib/api-client'

/**
 * Providers Component
 *
 * Wraps the app with all necessary providers.
 * This is a client component that provides context to the entire app.
 *
 * Currently includes:
 * - AuthProvider: Authentication and user session management
 * - CSRF Token Initialization: Fetches CSRF token on app load
 *
 * Usage: Imported in root layout.tsx
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize CSRF token on app load
  useEffect(() => {
    initializeCsrfToken().catch((error) => {
      console.error('[Providers] Failed to initialize CSRF token:', error)
    })
  }, [])

  return <AuthProvider>{children}</AuthProvider>
}
