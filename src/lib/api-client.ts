/**
 * API Client Utility
 *
 * Provides a fetch wrapper with automatic JWT and CSRF token handling.
 * Features:
 * - Automatic JWT Bearer token from localStorage
 * - Automatic CSRF token extraction from cookies
 * - Includes tokens in appropriate headers
 * - Credentials included for cookie-based sessions
 * - Type-safe request/response handling
 *
 * @module lib/api-client
 */

import { getApiUrl } from './config'

const ACCESS_TOKEN_KEY = 'access_token'
let csrfTokenInitialized = false
let csrfTokenCache: string | null = null

/**
 * Get cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }

  return null
}

/**
 * Get JWT access token from localStorage
 * @returns Access token or null if not found
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Store JWT access token in localStorage
 * @param token - Access token to store
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

/**
 * Remove JWT access token from localStorage
 */
export function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

/**
 * Refresh CSRF token (used after signin or when token becomes stale)
 * Forces a new token fetch regardless of initialization state
 */
export async function refreshCsrfToken(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  try {
    console.log('[CSRF Refresh] Fetching fresh CSRF token from:', getApiUrl('csrf-token'))

    // Fetch CSRF token from dedicated endpoint
    const response = await fetch(getApiUrl('csrf-token'), {
      method: 'GET',
      credentials: 'include', // Important to receive cookies
    })

    console.log('[CSRF Refresh] Response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      csrfTokenCache = data.csrfToken

      console.log('[CSRF Refresh] CSRF token received and cached:', csrfTokenCache ? `${csrfTokenCache.substring(0, 20)}...` : 'NOT FOUND')

      // Also check if cookie was set (for debugging)
      const cookieToken = getCookie('csrf_token')
      console.log('[CSRF Refresh] CSRF token in cookie:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'NOT FOUND')
    }

    csrfTokenInitialized = true
  } catch (error) {
    console.error('[CSRF Refresh] Failed to refresh CSRF token:', error)
    throw error
  }
}

/**
 * Initialize CSRF token by making a GET request to the API
 * This should be called once when the app loads
 * The backend will set the CSRF token cookie and return it in response body
 */
export async function initializeCsrfToken(): Promise<void> {
  if (csrfTokenInitialized || typeof window === 'undefined') {
    return
  }

  return refreshCsrfToken()
}

/**
 * Get CSRF token from cache or cookie
 */
function getCsrfToken(): string | null {
  // First try cached token (from response body)
  if (csrfTokenCache) {
    return csrfTokenCache
  }

  // Fallback to cookie (may not work cross-port)
  return getCookie('csrf_token')
}

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  /**
   * Skip CSRF token header (for GET requests or public endpoints)
   */
  skipCsrf?: boolean
}

/**
 * Enhanced fetch wrapper with CSRF protection
 *
 * @param url - Request URL
 * @param options - Request options
 * @returns Promise with response
 *
 * @example
 * const response = await apiClient('/api/auth/signin', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password }),
 * })
 */
export async function apiClient(
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { skipCsrf, ...fetchOptions } = options

  // Add CSRF token for state-changing requests
  const method = fetchOptions.method?.toUpperCase() || 'GET'
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !skipCsrf

  console.log('[apiClient] Request:', {
    url,
    method,
    needsCsrf,
    skipCsrf,
    hasCsrfToken: !!getCsrfToken()
  })

  // If CSRF is needed but token is missing, initialize it first
  if (needsCsrf && !getCsrfToken()) {
    console.log('[apiClient] CSRF token missing, initializing...')
    await initializeCsrfToken()
    console.log('[apiClient] After init, token present:', !!getCsrfToken())
  }

  // Default headers
  const headers: Record<string, string> = {}

  // Merge existing headers
  if (fetchOptions.headers) {
    const existingHeaders = new Headers(fetchOptions.headers)
    existingHeaders.forEach((value, key) => {
      headers[key] = value
    })
  }

  // Set default Content-Type to application/json only if not explicitly provided
  // This allows FormData uploads to set their own multipart/form-data boundary
  if (!headers['Content-Type'] && !headers['content-type']) {
    // Check if body is FormData - don't set Content-Type for FormData
    const isFormData = fetchOptions.body instanceof FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
  }

  // JWT token is automatically sent via HTTP-only cookies (access_token cookie)
  // The backend JWT strategy extracts it from cookies first, then falls back to Authorization header
  // No need to manually add Authorization header since cookies are more secure

  // Add CSRF token for state-changing requests
  if (needsCsrf) {
    const csrfToken = getCsrfToken()
    console.log('[apiClient] Adding CSRF token to headers:', {
      tokenFound: !!csrfToken,
      tokenPreview: csrfToken ? `${csrfToken.substring(0, 20)}...` : 'NONE',
      tokenSource: csrfTokenCache ? 'cache' : getCookie('csrf_token') ? 'cookie' : 'none'
    })
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    } else {
      console.warn('[apiClient] ⚠️ CSRF token required but not found!')
    }
  }

  // Make request with credentials (cookies)
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Important for cookies
  })

  // If 401 Unauthorized and not a refresh/signin/logout request, try refreshing token
  // Skip refresh if already on auth pages (signin, signup, verify, reset) or accept-invitation
  const isOnAuthPage = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/auth') ||
    window.location.pathname.startsWith('/accept-invitation')
  )

  if (
    response.status === 401 &&
    !url.includes('/auth/refresh') &&
    !url.includes('/auth/signin') &&
    !url.includes('/auth/logout') &&
    !url.includes('/auth/signup') &&
    !url.includes('/auth/verify-email') &&
    !url.includes('/auth/forgot-password') &&
    !url.includes('/auth/reset-password') &&
    !url.includes('/accept-invitation') &&
    !isOnAuthPage  // Don't refresh if user is on auth pages
  ) {
    console.log('[apiClient] 401 Unauthorized, attempting token refresh...')

    try {
      // Call refresh endpoint
      const refreshResponse = await fetch(getApiUrl('auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      })

      if (refreshResponse.ok) {
        console.log('[apiClient] Token refreshed successfully, retrying original request...')

        // Retry original request with same headers
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        })
      } else {
        console.log('[apiClient] Token refresh failed, redirecting to signin...')
        // Redirect to signin page
        if (typeof window !== 'undefined' && !isOnAuthPage) {
          window.location.href = '/auth/signin'
        }
      }
    } catch (error) {
      console.error('[apiClient] Token refresh error:', error)
      // Redirect to signin on error
      if (typeof window !== 'undefined' && !isOnAuthPage) {
        window.location.href = '/auth/signin'
      }
    }
  }

  return response
}

/**
 * Type-safe JSON API client
 *
 * @param url - Request URL
 * @param options - Request options
 * @returns Promise with parsed JSON response
 *
 * @example
 * const data = await apiClientJson<SignInResponse>('/api/auth/signin', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password }),
 * })
 */
export async function apiClientJson<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await apiClient(url, options)

  // Check if response is OK first
  if (!response.ok) {
    // Parse JSON error response
    const data = await response.json().catch(() => ({}))
    const error: any = new Error(data.message || 'API request failed')
    error.status = response.status
    error.statusCode = response.status
    error.response = { status: response.status, data }
    error.data = data
    throw error
  }

  // For successful responses, check if there's content to parse
  // 204 No Content and empty responses should return undefined
  const contentType = response.headers.get('content-type')
  const contentLength = response.headers.get('content-length')

  if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
    return undefined as T
  }

  // Parse JSON response
  const text = await response.text()
  if (!text || text.trim() === '') {
    return undefined as T
  }

  return JSON.parse(text) as T
}

/**
 * API client for file downloads (blob responses)
 *
 * @param url - Request URL
 * @param options - Request options
 * @returns Promise with blob and filename
 *
 * @example
 * const { blob, filename } = await apiClientBlob('/api/audit-logs/export', {
 *   method: 'POST',
 *   body: JSON.stringify({ format: 'csv', filters }),
 * })
 */
export async function apiClientBlob(
  url: string,
  options: ApiRequestOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient(url, options)

  // Check if response is OK
  if (!response.ok) {
    // Try to parse error as JSON
    const errorData = await response.json().catch(() => ({}))
    const error: any = new Error(errorData.message || 'API request failed')
    error.status = response.status
    error.statusCode = response.status
    error.response = { status: response.status, data: errorData }
    error.data = errorData
    throw error
  }

  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition')
  let filename = 'download'

  if (contentDisposition) {
    const matches = /filename="?([^"]+)"?/.exec(contentDisposition)
    if (matches && matches[1]) {
      filename = matches[1]
    }
  }

  // Get blob
  const blob = await response.blob()

  return { blob, filename }
}
