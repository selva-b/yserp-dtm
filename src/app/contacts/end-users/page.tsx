'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { useEndUsers, useEndUser, useDeleteEndUser, useToggleEndUserVerified } from '@/hooks/use-end-users'
import { useDebounce } from '@/hooks/use-debounce'
import CreateEndUserDrawer from '@/components/contacts/CreateEndUserDrawer'
import EditEndUserDrawer from '@/components/contacts/EditEndUserDrawer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { EndUser, EndUserDetails } from '@/services/end-users.service'

/**
 * End Users List Page
 *
 * Features:
 * - List with pagination
 * - Search by company name/email (debounced)
 * - Filters: active, verified, country
 * - Sort: companyName, email, city, country, createdAt
 * - RBAC: contacts.end_users.view:list
 * - Performance Target: P95 ≤1.5s
 *
 * Actions:
 * - Create new End User (drawer)
 * - View details (redirect to /contacts/end-users/[id])
 * - Edit (drawer)
 * - Delete (soft-delete with confirmation)
 * - Toggle verified (Admin-only)
 */
export default function EndUsersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined)
  const [countryFilter, setCountryFilter] = useState('')
  const [sortBy, setSortBy] = useState('companyName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)

  // Drawer and modal states
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [endUserIdToEdit, setEndUserIdToEdit] = useState<string>('')
  const [selectedEndUser, setSelectedEndUser] = useState<EndUserDetails | null>(null)
  const [endUserToDelete, setEndUserToDelete] = useState<EndUser | null>(null)

  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch End Users with React Query
  const { data, isLoading, error } = useEndUsers({
    q: debouncedSearch,
    active: activeFilter,
    verified: verifiedFilter,
    country: countryFilter || undefined,
    sortBy,
    sortDir,
    page,
    pageSize,
  })

  // Fetch full details for editing
  const { data: endUserDetails, isLoading: isLoadingDetails } = useEndUser(endUserIdToEdit, {
    enabled: !!endUserIdToEdit && isEditDrawerOpen,
  })

  // Mutations
  const { mutate: deleteEndUser, isPending: isDeleting } = useDeleteEndUser()
  const { mutate: toggleVerified, isPending: isTogglingVerified } = useToggleEndUserVerified()

  const endUsers = data?.data || []
  const total = data?.pagination.total || 0
  const totalPages = data?.pagination.totalPages || 0

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeFilter, verifiedFilter, countryFilter])

  // Update selectedEndUser when details are fetched
  useEffect(() => {
    if (endUserDetails && isEditDrawerOpen) {
      setSelectedEndUser(endUserDetails)
    }
  }, [endUserDetails, isEditDrawerOpen])

  // Handlers
  const handleCreateNew = () => {
    setIsCreateDrawerOpen(true)
  }

  const handleCreateSuccess = () => {
    // Query will be automatically invalidated by the mutation hook
  }

  const handleEdit = (endUser: EndUser) => {
    setEndUserIdToEdit(endUser.id)
    setIsEditDrawerOpen(true)
  }

  const handleEditSuccess = () => {
    setSelectedEndUser(null)
    setEndUserIdToEdit('')
  }

  const handleDeleteClick = (endUser: EndUser) => {
    setEndUserToDelete(endUser)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!endUserToDelete) return

    deleteEndUser(endUserToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setEndUserToDelete(null)
      },
      onError: (error) => {
        console.error('Failed to delete End User:', error)
        // Keep dialog open to show error
      },
    })
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setEndUserToDelete(null)
  }

  const handleToggleVerified = (endUser: EndUser) => {
    toggleVerified(endUser.id, {
      onSuccess: () => {
        // Query will be automatically invalidated
      },
      onError: (error) => {
        console.error('Failed to toggle verified status:', error)
      },
    })
  }

  const handleViewDetails = (id: string) => {
    router.push(`/contacts/end-users/${id}`)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 py-8">
          {/* Page Header */}
          <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">End Users</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage client organizations and contact persons
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New End User
            </button>
          </div>
        </div>

        {/* Toolbar - Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by company name or email..."
                />
              </div>
            </div>

            {/* Active Filter */}
            <div>
              <select
                value={activeFilter === undefined ? '' : activeFilter.toString()}
                onChange={(e) =>
                  setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')
                }
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div>
              <select
                value={
                  verifiedFilter === undefined ? '' : verifiedFilter.toString()
                }
                onChange={(e) =>
                  setVerifiedFilter(
                    e.target.value === '' ? undefined : e.target.value === 'true',
                  )
                }
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Verification</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (sortBy === 'companyName') {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy('companyName')
                      setSortDir('asc')
                    }
                  }}
                >
                  <div className="flex items-center">
                    Company Name
                    {sortBy === 'companyName' && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDir === 'desc' ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Primary Contact
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Error loading End Users
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : endUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No End Users found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new End User organization
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        New End User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                endUsers.map((endUser: any) => (
                  <tr
                    key={endUser.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <button
                        onClick={() => handleViewDetails(endUser.id)}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {endUser.companyName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endUser.primaryContactName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endUser.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {endUser.city}, {endUser.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            endUser.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {endUser.active ? 'Active' : 'Inactive'}
                        </span>
                        {endUser.verified && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(endUser)
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleVerified(endUser)
                          }}
                          disabled={isTogglingVerified}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title={endUser.verified ? 'Remove verification' : 'Mark as verified'}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(endUser)
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * pageSize, total)}
                    </span>{' '}
                    of <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {page} of {Math.ceil(total / pageSize)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(total / pageSize)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Create End User Drawer */}
      <CreateEndUserDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit End User Drawer */}
      <EditEndUserDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false)
          setSelectedEndUser(null)
          setEndUserIdToEdit('')
        }}
        onSuccess={handleEditSuccess}
        endUser={selectedEndUser}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete End User"
        message={`Are you sure you want to delete "${endUserToDelete?.companyName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
      </div>
      </div>
    </AppLayout>
  )
}
