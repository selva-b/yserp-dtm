'use client'

import { useRouter } from 'next/navigation'

/**
 * Create End User Page
 *
 * Features:
 * - Form with 3 sections: Basic Info, Business Info, Contact Persons
 * - Field validation with inline errors
 * - Submit-only validation (no on-blur)
 * - Focus management (first invalid field)
 * - Accessibility (ARIA labels, live regions)
 */
export default function CreateEndUserPage() {
  const router = useRouter()

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg
              className="h-5 w-5 mr-1"
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
            Back to End Users
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New End User
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new client organization with contact information
          </p>
        </div>

        {/* Form - TO BE IMPLEMENTED */}
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="text-center py-12">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Form Coming Soon
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The creation form will be implemented in the next task
            </p>
            <div className="mt-6">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
