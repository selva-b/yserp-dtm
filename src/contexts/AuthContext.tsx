'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClientJson } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'

/**
 * User profile data structure
 */
export interface User {
  id: string
  fullName: string
  email: string
  role: string
  orgId: string
  department?: string
  isActive: boolean
  permissions: string[]
}

/**
 * Authentication context value
 */
interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * AuthProvider Component
 *
 * Provides authentication state and methods to the entire app.
 * Automatically fetches user data on mount and manages session state.
 *
 * Features:
 * - Automatic user session restoration
 * - Login/logout functionality
 * - User data refresh
 * - Loading and error states
 * - Session persistence
 *
 * Usage:
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch current user from backend
   */
  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[AuthContext] Fetching user from:', getApiUrl('auth/me'))
      console.log('[AuthContext] Token in localStorage:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING')

      // Call the /me endpoint to get current user
      const userData = await apiClientJson<User>(getApiUrl('auth/me'))

      console.log('[AuthContext] USERDATA received:', userData)
      console.log('[AuthContext] fullName:', userData?.fullName)
      console.log('[AuthContext] email:', userData?.email)
      console.log('[AuthContext] role:', userData?.role)

      setUser(userData)
    } catch (err: any) {
      console.error('[AuthContext] Error fetching user:', err)
      console.error('[AuthContext] Error status:', err?.status, err?.statusCode)

      // If 401, user is not authenticated
      if (err?.status === 401 || err?.statusCode === 401) {
        console.log('[AuthContext] User not authenticated (401)')
        setUser(null)
      } else {
        console.error('Failed to fetch user:', err)
        setError(err?.message || 'Failed to load user data')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login user
   */
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Call signin endpoint
      await apiClientJson(getApiUrl('auth/signin'), {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      })

      // Fetch user data after successful login
      await fetchUser()
    } catch (err: any) {
      console.error('Login failed:', err)
      const errorMessage = err?.message || 'Login failed. Please try again.'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setLoading(true)
      setError(null)

      // Call logout endpoint
      await apiClientJson(getApiUrl('auth/logout'), {
        method: 'POST',
      })
    } catch (err) {
      console.error('Logout failed:', err)
      // Continue with logout even if API fails
    } finally {
      setUser(null)
      setLoading(false)

      // Redirect to signin page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
    }
  }

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    await fetchUser()
  }

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permission)
  }

  // Fetch user on mount (restore session)
  useEffect(() => {
    fetchUser()
  }, [])

  // Periodic token refresh - refresh every 10 minutes to keep session alive
  // Access tokens expire after 15 minutes, so refreshing every 10 minutes ensures we never hit expiration
  useEffect(() => {
    if (!user) return

    console.log('[AuthContext] Setting up periodic token refresh (every 10 minutes)')

    const refreshInterval = setInterval(
      async () => {
        try {
          console.log('[AuthContext] Refreshing token...')
          const response = await fetch(getApiUrl('auth/refresh'), {
            method: 'POST',
            credentials: 'include',
          })

          if (response.ok) {
            console.log('[AuthContext] Token refreshed successfully')
          } else {
            console.warn('[AuthContext] Token refresh failed with status:', response.status)
            // User will be logged out on next API call
          }
        } catch (error) {
          console.error('[AuthContext] Token refresh error:', error)
          // User will be logged out on next API call
        }
      },
      10 * 60 * 1000
    ) // 10 minutes

    return () => {
      console.log('[AuthContext] Cleaning up token refresh interval')
      clearInterval(refreshInterval)
    }
  }, [user])

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 *
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 *
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, logout } = useAuth()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!user) return <div>Not authenticated</div>
 *
 *   return (
 *     <div>
 *       <p>Welcome {user.fullName}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
