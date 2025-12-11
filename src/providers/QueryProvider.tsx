'use client'

/**
 * React Query Provider
 *
 * Wraps the application with QueryClient for data fetching, caching,
 * and state management
 *
 * @module providers/QueryProvider
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance - using useState to ensure it's created once per component mount
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global defaults for queries
            staleTime: 60000, // Data is fresh for 1 minute
            gcTime: 300000, // Garbage collect after 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false, // Don't refetch on window focus (can be enabled per query)
            retry: 1, // Retry failed queries once
          },
          mutations: {
            // Global defaults for mutations
            retry: 0, // Don't retry mutations
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  )
}
