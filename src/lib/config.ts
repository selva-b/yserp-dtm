/**
 * Application Configuration
 *
 * Centralized configuration for environment variables and app settings.
 *
 * @module lib/config
 */

/**
 * API Base URL - Points to the backend NestJS server
 * Default: http://localhost:3000/api
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

/**
 * Full API URL constructor
 * @param endpoint - API endpoint path (e.g., 'auth/signup' or '/auth/signup')
 * @returns Full URL including base and endpoint
 *
 * @example
 * // If API_BASE_URL = 'http://localhost:3000/api'
 * getApiUrl('auth/signup') // => 'http://localhost:3000/api/auth/signup'
 * getApiUrl('/auth/signup') // => 'http://localhost:3000/api/auth/signup'
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // If API_BASE_URL already includes /api, don't add it again
  if (API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}/${cleanEndpoint}`
  }

  // API routes are prefixed with /api in the backend
  if (!cleanEndpoint.startsWith('api/')) {
    return `${API_BASE_URL}/api/${cleanEndpoint}`
  }

  return `${API_BASE_URL}/${cleanEndpoint}`
}

/**
 * Application Environment
 */
export const APP_ENV = process.env.NODE_ENV || 'development'

/**
 * Check if running in development mode
 */
export const isDevelopment = APP_ENV === 'development'

/**
 * Check if running in production mode
 */
export const isProduction = APP_ENV === 'production'
