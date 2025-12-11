'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/config'

type VerificationState = 'pending' | 'verifying' | 'success' | 'error' | 'expired'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerificationState>('pending')
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMessage('Invalid verification link.')
    }
  }, [token])

  // Auto-redirect countdown on success
  useEffect(() => {
    if (state === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (state === 'success' && redirectCountdown === 0) {
      router.push('/auth/signin')
    }
  }, [state, redirectCountdown, router])

  const handleVerifyNow = () => {
    if (!token) return
    setState('verifying')
    verifyEmail(token)
  }

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(getApiUrl('auth/verify-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if token is expired
        if (response.status === 410 || data.message?.toLowerCase().includes('expired')) {
          setState('expired')
          setEmail(data.email || '')
        } else {
          setState('error')
          setErrorMessage(data.message || 'Verification failed. Please try again.')
        }
        return
      }

      // Success
      setState('success')
    } catch (error) {
      setState('error')
      setErrorMessage('Unable to connect. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    if (!email) return

    try {
      const response = await fetch(getApiUrl('auth/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      }
    } catch (error) {
      // Silently fail, user can navigate manually
    }
  }

  const renderContent = () => {
    switch (state) {
      case 'pending':
        return (
          <>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-10 w-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Ready to verify your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Click the button below to verify your email address and activate your account.
            </p>
            <div className="mt-6">
              <button
                onClick={handleVerifyNow}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Verify Now
              </button>
            </div>
          </>
        )

      case 'verifying':
        return (
          <>
            <div className="mx-auto h-16 w-16 flex items-center justify-center">
              <svg
                className="animate-spin h-12 w-12 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </>
        )

      case 'success':
        return (
          <>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Email verified successfully!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your account has been activated. You can now sign in.
            </p>
            <div className="mt-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Redirecting to sign in page in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <a
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign In Now
              </a>
            </div>
          </>
        )

      case 'expired':
        return (
          <>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-10 w-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verification link expired
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This verification link has expired. Verification links are valid for 24 hours.
            </p>
            <div className="mt-6">
              {email ? (
                <button
                  onClick={handleResendVerification}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Resend Verification Email
                </button>
              ) : (
                <a
                  href="/auth/signup"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Sign Up
                </a>
              )}
            </div>
          </>
        )

      case 'error':
        return (
          <>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verification failed
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {errorMessage || 'Something went wrong during verification.'}
            </p>
            <div className="mt-6 space-y-3">
              <a
                href="/auth/signup"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Sign Up
              </a>
              <a
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Sign In
              </a>
            </div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {renderContent()}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
