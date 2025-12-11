'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/config'
import { ProgressBar } from '@/components/auth/ProgressBar'
import { AriaLiveRegion } from '@/components/auth/AriaLiveRegion'

interface FormState {
  email: string
}

interface FormErrors {
  [key: string]: string
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>({
    email: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formState.email.trim()) {
      newErrors.email = 'Enter your email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      newErrors.email = 'Valid email is required.'
    }

    setErrors(newErrors)

    // Announce errors to screen readers
    if (Object.keys(newErrors).length > 0) {
      setAnnouncement(`Form has ${Object.keys(newErrors).length} error${Object.keys(newErrors).length > 1 ? 's' : ''}`)
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setAnnouncement('')

    if (!validateForm()) {
      document.getElementById('email')?.focus()
      return
    }

    setIsSubmitting(true)
    setAnnouncement('Sending reset link, please wait')

    try {
      const response = await fetch(getApiUrl('auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formState.email.trim().toLowerCase(),
        }),
      })

      // Show success message regardless of response status (security: no account enumeration)
      setIsSuccess(true)
      setAnnouncement('Reset link sent. Check your email.')
    } catch (error) {
      // Still show success message to prevent enumeration
      setIsSuccess(true)
      setAnnouncement('Reset link sent. Check your email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (value: string) => {
    setFormState({ email: value })
    if (errors.email) {
      setErrors({})
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <AriaLiveRegion message="Password reset email sent successfully" />

          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-10 w-10 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
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
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              If an account exists for <span className="font-medium text-gray-900">{formState.email}</span>,
              you will receive a password reset link.
            </p>
          </div>

          <div className="rounded-md bg-blue-50 p-4" role="region" aria-label="Next steps">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">What's next?</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Check your email inbox</li>
                    <li>Click the password reset link</li>
                    <li>Enter your new password</li>
                  </ol>
                </div>
                <p className="mt-2 text-xs text-blue-600">
                  The reset link expires in 24 hours. Didn't receive an email? Check your spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/auth/signin"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded px-2 py-1"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Global Progress Bar */}
      <ProgressBar isLoading={isSubmitting} label="Sending password reset email" />

      {/* ARIA Live Region for Announcements */}
      <AriaLiveRegion message={announcement} />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Forgot your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={formState.email}
                onChange={(e) => handleChange(e.target.value)}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:ring-2 sm:text-sm transition-colors`}
                placeholder="john.doe@company.com"
                aria-describedby={errors.email ? 'email-error email-hint' : 'email-hint'}
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
              />
              <p id="email-hint" className="mt-1 text-xs text-gray-500">
                We'll send a password reset link to this email address
              </p>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" id="email-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            <div className="text-center">
              <a
                href="/auth/signin"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded px-2 py-1"
              >
                Back to Sign In
              </a>
            </div>
          </form>

          {/* Accessibility Info */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>
              Need help? Email{' '}
              <a href="mailto:support@yserp-dtm.com" className="underline hover:text-gray-700">
                support@yserp-dtm.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
