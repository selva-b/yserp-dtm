'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'
import AppLayout from '@/components/layout/AppLayout'
import { RoleDetail } from '@/types/user'

export default function RoleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roleId = params.id as string

  const [role, setRole] = useState<RoleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRole()
  }, [roleId])

  const fetchRole = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient(getApiUrl(`v1/roles/${roleId}`), {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Role not found')
        }
        throw new Error('Failed to fetch role')
      }

      const data: RoleDetail = await response.json()
      setRole(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Count granted permissions
  const grantedPermissionsCount = role?.permissions.filter((p) => p.granted).length || 0

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
          <p className="mt-4 text-gray-600">Loading role...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !role) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="py-6 px-6">
            <h1 className="text-3xl font-bold text-gray-900">Role Details</h1>
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
                      onClick={() => router.push('/user-management/roles')}
                      className="text-sm font-medium text-red-800 underline hover:text-red-900"
                    >
                      Go back to roles
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{role.name}</h1>
                {role.isDefault && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Default Role
                  </span>
                )}
                {role.locked && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <svg
                      className="mr-1 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">View role details and permissions</p>
            </div>
            <button
              onClick={() => router.push('/user-management/roles')}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Back to Roles
            </button>
          </div>
        </header>

      {/* Main Content */}
      <main className="px-6 py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/user-management/roles/${roleId}/permissions`)}
                disabled={role.locked}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  role.locked
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }`}
                title={
                  role.locked
                    ? 'Cannot edit permissions for locked system roles'
                    : 'Manage permissions'
                }
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Manage Permissions
              </button>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Basic Info */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Role Information
              </h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Role Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{role.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{role.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Users with this Role</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(role.createdAt)}</dd>
              </div>
            </div>

            {/* Permissions Summary */}
            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Permissions Summary
              </h3>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Granted Permissions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {grantedPermissionsCount} / {role.permissions.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Coverage</p>
                  <p className="text-2xl font-semibold text-primary-600">
                    {role.permissions.length > 0
                      ? Math.round((grantedPermissionsCount / role.permissions.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${
                      role.permissions.length > 0
                        ? (grantedPermissionsCount / role.permissions.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Granted Permissions List */}
            <div className="px-6 py-5 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Granted Permissions</h4>
              {grantedPermissionsCount === 0 ? (
                <p className="text-sm text-gray-500">No permissions granted</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {role.permissions
                    .filter((p) => p.granted)
                    .map((permission) => (
                      <div
                        key={permission.permissionId}
                        className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                      >
                        <svg
                          className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
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
                        <span className="font-mono text-xs">{permission.key}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </AppLayout>
  )
}
