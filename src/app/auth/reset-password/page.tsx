'use client'

import { Suspense, useEffect, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/config'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { ProgressBar } from '@/components/auth/ProgressBar'
import { AriaLiveRegion } from '@/components/auth/AriaLiveRegion'

interface FormState {
  password: string
  confirmPassword: string
}

interface FormErrors {
  [key: string]: string
}

type ResetState = 'validating' | 'form' | 'submitting' | 'success' | 'expired' | 'invalid' | 'consumed'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [resetState, setResetState] = useState<ResetState>('validating')
  const [formState, setFormState] = useState<FormState>({
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [announcement, setAnnouncement] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  // Preflight token validation
  useEffect(() => {
    if (!token) {
      setResetState('invalid')
      setAnnouncement('Invalid reset link. No token provided.')
      return
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `${getApiUrl('auth/reset/validate')}?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        const data = await response.json()

        if (data.valid) {
          setResetState('form')
          setAnnouncement('Please enter your new password')
        } else {
          // Map reason to state
          if (data.reason === 'expired') {
            setResetState('expired')
            setAnnouncement('Reset link has expired')
          } else if (data.reason === 'consumed') {
            setResetState('consumed')
            setAnnouncement('Reset link has already been used')
          } else {
            setResetState('invalid')
            setAnnouncement('Reset link is invalid')
          }
        }
      } catch (error) {
        setResetState('invalid')
        setAnnouncement('Unable to validate reset link')
      }
    }

    validateToken()
  }, [token])

  // Auto-redirect countdown on success
  useEffect(() => {
    if (resetState === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (resetState === 'success' && redirectCountdown === 0) {
      router.push('/auth/signin')
    }
  }, [resetState, redirectCountdown, router])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Password: Minimum 8 chars with upper, lower, number, and symbol
    if (!formState.password) {
      newErrors.password = 'Enter password.'
    } else if (formState.password.length < 8) {
      newErrors.password = 'Must be at least 8 characters.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formState.password)) {
      newErrors.password = 'Must include upper, lower, number, symbol.'
    }

    // Confirm Password
    if (formState.password !== formState.confirmPassword) {
      newErrors.confirmPassword = 'Passwords must match.'
    }

    setErrors(newErrors)

    // Announce errors to screen readers
    if (Object.keys(newErrors).length > 0) {
      setAnnouncement(`Form has ${Object.keys(newErrors).length} error${Object.keys(newErrors).length > 1 ? 's' : ''}. Please correct and try again.`)
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    setErrors({})
    setAnnouncement('')

    if (!validateForm()) {
      const firstError = Object.keys(errors)[0]
      document.getElementById(firstError)?.focus()
      return
    }

    if (!token) {
      setResetState('invalid')
      return
    }

    setResetState('submitting')
    setAnnouncement('Resetting your password, please wait')

    try {
      const response = await fetch(getApiUrl('auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formState.password,
          confirmPassword: formState.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if token is expired or invalid
        if (response.status === 401 || data.message?.toLowerCase().includes('expired')) {
          setResetState('expired')
          setAnnouncement('Reset link has expired')
        } else if (response.status === 401 || data.message?.toLowerCase().includes('invalid')) {
          setResetState('invalid')
          setAnnouncement('Reset link is invalid or has been used')
        } else if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors)
          setResetState('form')
          setAnnouncement('Please correct the errors and try again')
        } else {
          setGlobalError(data.message || 'Password reset failed. Please try again.')
          setResetState('form')
          setAnnouncement('Password reset failed')
        }
        return
      }

      // Success
      setResetState('success')
      setAnnouncement('Password reset successfully! Redirecting to sign in...')
    } catch (error) {
      setGlobalError('Unable to connect. Please try again.')
      setResetState('form')
      setAnnouncement('Connection error. Please try again.')
    }
  }

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleResend = async () => {
    if (!token || resending || resendCooldown > 0) return

    setResending(true)
    setAnnouncement('Sending fresh reset link')

    try {
      const response = await fetch(getApiUrl('auth/reset/resend'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendCooldown(60) // 60 second cooldown
        setAnnouncement('Fresh reset link sent! Please check your email.')
      } else {
        setAnnouncement('Unable to send reset link. Please try again.')
      }
    } catch (error) {
      setAnnouncement('Connection error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (resetState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <AriaLiveRegion message="Password reset successfully" />

          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password reset successfully!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <div className="mt-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700" role="timer" aria-live="polite">
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
          </div>
        </div>
      </div>
    )
  }

  // Validating state - show loader while checking token
  if (resetState === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <AriaLiveRegion message="Validating reset link" />
          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full" role="status" aria-label="Loading"></div>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Validating reset link...
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we verify your reset link
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (resetState === 'expired' || resetState === 'invalid' || resetState === 'consumed') {
    const stateMessages = {
      expired: {
        title: 'Reset link expired',
        description: 'This password reset link has expired. Reset links are valid for 24 hours.',
        announcement: 'Reset link has expired'
      },
      consumed: {
        title: 'Reset link already used',
        description: 'This password reset link has already been used. Each link can only be used once.',
        announcement: 'Reset link has already been used'
      },
      invalid: {
        title: 'Invalid reset link',
        description: 'This password reset link is invalid.',
        announcement: 'Reset link is invalid'
      }
    }

    const message = stateMessages[resetState as keyof typeof stateMessages] || stateMessages.invalid

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <AriaLiveRegion message={message.announcement} />

          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-10 w-10 text-yellow-600"
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {message.title}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {message.description}
            </p>

            {/* Resend button with cooldown */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all ${
                  resending || resendCooldown > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
                aria-busy={resending}
              >
                {resending ? (
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
                    Sending fresh link...
                  </>
                ) : resendCooldown > 0 ? (
                  <span role="timer" aria-live="polite">
                    Wait {resendCooldown}s to resend
                  </span>
                ) : (
                  'Send Fresh Reset Link'
                )}
              </button>

              <a
                href="/auth/forgot-password"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Start Over
              </a>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/auth/signin"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded px-2 py-1"
              >
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Global Progress Bar */}
      <ProgressBar isLoading={resetState === 'submitting'} label="Resetting your password" />

      {/* ARIA Live Region for Announcements */}
      <AriaLiveRegion message={announcement} />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Set your new password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter a strong password for your account
            </p>
          </div>

          {globalError && (
            <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{globalError}</h3>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    autoFocus
                    value={formState.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:ring-2 sm:text-sm transition-colors`}
                    placeholder="••••••••"
                    aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                    aria-invalid={!!errors.password}
                    disabled={resetState === 'submitting'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600" id="password-error" role="alert">
                    {errors.password}
                  </p>
                )}

                {/* Password Strength Meter */}
                <PasswordStrengthMeter password={formState.password} className="mt-2" />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formState.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                      errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:ring-2 sm:text-sm transition-colors`}
                    placeholder="••••••••"
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    aria-invalid={!!errors.confirmPassword}
                    disabled={resetState === 'submitting'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600" id="confirmPassword-error" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={resetState === 'submitting'}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-all ${
                  resetState === 'submitting'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
                aria-busy={resetState === 'submitting'}
              >
                {resetState === 'submitting' ? (
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
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
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
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
