'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'
import AppLayout from '@/components/layout/AppLayout'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useResendInvitation } from '@/hooks/use-users'
import { User, UserStatus } from '@/types/user'

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showResendDialog, setShowResendDialog] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [resendError, setResendError] = useState('')

  // Resend invitation mutation
  const resendMutation = useResendInvitation()

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient(getApiUrl(`v1/users/${userId}`), {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to fetch user')
      }

      const data: User = await response.json()
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError('')

    try {
      const response = await apiClient(getApiUrl(`v1/users/${userId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete user')
      }

      // Success - redirect to users list
      router.push('/user-management/users')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user')
      setIsDeleting(false)
    }
  }

  // Show resend confirmation dialog
  const handleResendClick = () => {
    setShowResendDialog(true)
    setResendError('')
    setResendSuccess('')
  }

  // Handle resend invitation confirmation
  const handleResendInvitation = async () => {
    setIsResending(true)
    setResendError('')
    setResendSuccess('')

    try {
      await resendMutation.mutateAsync(userId)
      setResendSuccess('Invitation email sent successfully.')
      setShowResendDialog(false)

      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendSuccess('')
      }, 5000)

      // Refresh user data
      fetchUser()
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend invitation')
      setShowResendDialog(false)

      // Clear error message after 5 seconds
      setTimeout(() => {
        setResendError('')
      }, 5000)
    } finally {
      setIsResending(false)
    }
  }

  // Handle dialog close
  const handleResendDialogClose = () => {
    setShowResendDialog(false)
  }

  // Status badge color
  const getStatusBadgeColor = (status: UserStatus): string => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'bg-green-100 text-green-800'
      case UserStatus.INVITED:
        return 'bg-blue-100 text-blue-800'
      case UserStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case UserStatus.INACTIVE:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatusLabel = (status: UserStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-600 mx-auto"
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
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="py-6 px-6">
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
          </div>
        </header>
        <main className="px-6 py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-md bg-red-50 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <div className="mt-2">
                    <button
                      onClick={() => router.push('/user-management/users')}
                      className="text-sm font-medium text-red-800 underline hover:text-red-900"
                    >
                      Go back to users list
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="py-6 px-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
              <p className="mt-1 text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={() => router.push('/user-management/users')}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Back to Users
            </button>
          </div>
        </header>

      {/* Main Content */}
      <main className="px-6 py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="rounded-md bg-green-50 p-4 mb-6" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{resendSuccess}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Resend Error Message */}
          {resendError && (
            <div className="rounded-md bg-red-50 p-4 mb-6" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{resendError}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push(`/user-management/users/${userId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit User
              </button>

              {user.status === UserStatus.INVITED && (
                <button
                  onClick={handleResendClick}
                  disabled={isResending}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isResending
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
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
                  {isResending ? 'Sending...' : 'Resend Invitation'}
                </button>
              )}

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete User
              </button>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Status and Account Info */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Account Information
              </h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(
                      user.status
                    )}`}
                  >
                    {formatStatusLabel(user.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Enabled</dt>
                <dd className="mt-1">
                  {user.isActive ? (
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                      No
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'Not verified'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
              </div>
            </div>

            {/* Personal Information */}
            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.address || 'Not provided'}</dd>
              </div>
              {user.bio && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.bio}</dd>
                </div>
              )}
            </div>

            {/* Work Information */}
            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Work Information
              </h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.role?.name || 'Unknown'}</dd>
              </div>
            </div>

            {/* Metadata */}
            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Metadata</h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed z-10 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => !isDeleting && setShowDeleteDialog(false)}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Delete User
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <strong>{user.fullName}</strong>? This
                      action cannot be undone. All active sessions will be terminated.
                    </p>
                  </div>
                  {deleteError && (
                    <div className="mt-3 rounded-md bg-red-50 p-3">
                      <p className="text-sm text-red-800">{deleteError}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    isDeleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resend Invitation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResendDialog}
        onClose={handleResendDialogClose}
        onConfirm={handleResendInvitation}
        title="Resend Invitation"
        message="Are you sure you want to resend the invitation email to this user?"
        confirmText="Yes, Resend"
        cancelText="No, Cancel"
        variant="info"
        isLoading={isResending || resendMutation.isPending}
      />
      </div>
    </AppLayout>
  )
}
