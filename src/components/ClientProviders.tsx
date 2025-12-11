'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { initializeCsrfToken } from '@/lib/api-client'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/providers/QueryProvider'
// import ToastContainer from '@/components/ui/ToastContainer'
import { useToastStore } from '@/hooks/use-toast'

/**
 * Client-side providers and initializers
 * This component wraps all client-side initialization logic
 *
 * Provider Order:
 * 1. QueryProvider - React Query for data fetching
 * 2. AuthProvider - Authentication context
 * 3. Toaster - Toast notifications
 */
export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Initialize CSRF token when app mounts
    console.log('[ClientProviders] Initializing CSRF token...')
    initializeCsrfToken()
  }, [])

  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryProvider>
  )
}

