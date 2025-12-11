'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { useContractor, useDeleteContractor, useToggleContractorVerified } from '@/hooks/use-contractors'
import EditContractorDrawer from '@/components/contacts/contractors/EditContractorDrawer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AppLayout from '@/components/layout/AppLayout'

/**
 * Contractor Details Page
 *
 * Features:
 * - View complete contractor organization details
 * - Display all contact persons
 * - Show status badges (Active/Verified)
 * - Edit/Delete/Verify actions
 * - Responsive layout with sidebar
 * - Loading and error states
 * - Business registration information
 */
export default function ContractorDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // State management
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Data fetching
  const { data: contractor, isLoading, error } = useContractor(id)

  // Mutations
  const { mutate: deleteContractor, isPending: isDeleting } = useDeleteContractor()
  const { mutate: toggleVerified } = useToggleContractorVerified()

  // Handlers
  const handleBack = () => {
    router.push('/contacts/contractors')
  }

  const handleEdit = () => {
    setIsEditDrawerOpen(true)
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    deleteContractor(id, {
      onSuccess: () => {
        router.push('/contacts/contractors')
      },
    })
  }

  const handleToggleVerified = () => {
    toggleVerified(id)
  }

  const handleEditSuccess = () => {
    // React Query will automatically refetch
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Loading contractor details...</p>
        </div>
      </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !contractor) {
    return (
      <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 py-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="text-center">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Contractor Not Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The contractor you're looking for does not exist or has been deleted.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Contractors
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </AppLayout>
    )
  }

  // Separate primary and additional contact persons
  const primaryContact = contractor.contactPersons?.find((cp: any) => cp.isPrimary)
  const additionalContacts = contractor.contactPersons?.filter((cp: any) => !cp.isPrimary) || []

  // Check if we have business registration info
  const hasBusinessInfo = contractor.registrationNumber || contractor.taxId ||
    contractor.licenseNumber || contractor.gstNumber || contractor.panNumber

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Contractors
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contractor.companyName}</h1>
                <div className="mt-2 flex items-center space-x-2">
                  {/* Active Badge */}
                  {contractor.active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}

                  {/* Verified Badge */}
                  {contractor.verified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>

              <button
                onClick={handleToggleVerified}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  contractor.verified
                    ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {contractor.verified ? 'Unverify' : 'Verify'}
              </button>

              <button
                onClick={handleDeleteClick}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Contact Information */}
            {primaryContact && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Primary Contact Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{primaryContact.fullName || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Designation</dt>
                      <dd className="mt-1 text-sm text-gray-900">{primaryContact.designation || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {primaryContact.email ? (
                          <a
                            href={`mailto:${primaryContact.email}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {primaryContact.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {primaryContact.phone ? (
                          <a
                            href={`tel:${primaryContact.phone}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {primaryContact.phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </dd>
                    </div>
                    {primaryContact.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900">{primaryContact.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Company Information */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Company Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.email ? (
                        <a href={`mailto:${contractor.email}`} className="text-blue-600 hover:text-blue-700">
                          {contractor.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Primary Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.primaryPhone ? (
                        <a href={`tel:${contractor.primaryPhone}`} className="text-blue-600 hover:text-blue-700">
                          {contractor.primaryPhone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Secondary Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contractor.secondaryPhone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.website ? (
                        <a
                          href={contractor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {contractor.website}
                        </a>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Address</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contractor.address || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">City</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contractor.city || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">State / Province</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contractor.state || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Country</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contractor.country || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contractor.postalCode || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Business Registration (Contractors only) */}
            {hasBusinessInfo && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Business Registration
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    {contractor.registrationNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contractor.registrationNumber}</dd>
                      </div>
                    )}
                    {contractor.taxId && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Tax ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contractor.taxId}</dd>
                      </div>
                    )}
                    {contractor.licenseNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">License Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contractor.licenseNumber}</dd>
                      </div>
                    )}
                    {contractor.gstNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">GST Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contractor.gstNumber}</dd>
                      </div>
                    )}
                    {contractor.panNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">PAN Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contractor.panNumber}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Contact Persons */}
            {additionalContacts.length > 0 ? (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Contact Persons ({contractor.contactPersons?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {additionalContacts.map((contact: any, index: number) => (
                      <div
                        key={contact.id || index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">{contact.fullName || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Designation</dt>
                            <dd className="mt-1 text-sm text-gray-900">{contact.designation || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {contact.email ? (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {contact.email}
                                </a>
                              ) : (
                                '-'
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {contact.phone ? (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {contact.phone}
                                </a>
                              ) : (
                                '-'
                              )}
                            </dd>
                          </div>
                          {contact.notes && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Notes</dt>
                              <dd className="mt-1 text-sm text-gray-900">{contact.notes}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Contact Persons
                  </h3>
                  <p className="text-sm text-gray-500">No additional contact persons added.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg sticky top-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Info</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Verification</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Contact Persons</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.contactPersons?.length || 0} contact
                      {contractor.contactPersons?.length !== 1 ? 's' : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.createdAt
                        ? new Date(contractor.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contractor.updatedAt
                        ? new Date(contractor.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditContractorDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSuccess={handleEditSuccess}
        contractor={contractor}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contractor"
        message={`Are you sure you want to delete "${contractor.companyName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
    </AppLayout>
  )
}