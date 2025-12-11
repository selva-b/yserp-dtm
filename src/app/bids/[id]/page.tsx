'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBid } from '@/hooks/useBids'
import { useDrawings, useDeleteDrawing, useBulkUploadDrawings } from '@/hooks/useDrawings'
import { useSubSystemsSelectors } from '@/hooks/use-systems'
import { useDrawingTypes } from '@/hooks/useDrawingTypes'
import AppLayout from '@/components/layout/AppLayout'
import AddDrawingDrawer from '@/components/bids/AddDrawingDrawer'
import BulkUploadDrawingsModal from '@/components/bids/BulkUploadDrawingsModal'
import FilesTab from '@/components/bids/FilesTab'
import TicketsTab from '@/components/bids/TicketsTab'

export default function BidDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const bidId = params.id as string

  const [activeTab, setActiveTab] = useState<'overview' | 'drawings' | 'tickets' | 'files'>(
    'overview'
  )

  // Check for hash fragment to set active tab on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'tickets' || hash === 'drawings' || hash === 'files') {
      setActiveTab(hash as 'tickets' | 'drawings' | 'files')
    }
  }, [])
  const [isAddDrawingOpen, setIsAddDrawingOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteDrawingMutation = useDeleteDrawing()
  const bulkUploadMutation = useBulkUploadDrawings()

  // Fetch bid data from API
  const { data: bid, isLoading, error } = useBid(bidId)

  // Fetch drawings for this bid
  const { data: drawingsData, isLoading: loadingDrawings, refetch: refetchDrawings } = useDrawings({
    entityType: 'bid',
    entityId: bidId,
    pageSize: 50,
  })

  // Fetch sub systems and drawing types for bulk upload
  const { data: subSystemsData } = useSubSystemsSelectors()
  const { data: drawingTypesData } = useDrawingTypes()

  const handleBulkUpload = async (drawings: any[]) => {
    try {
      const result = await bulkUploadMutation.mutateAsync({
        entityType: 'bid',
        entityId: bidId,
        drawings,
      })
      return result
    } catch (error: any) {
      throw error
    }
  }

  const handleDrawingClick = async (drawing: any) => {
    // Always navigate to drawing detail page
    // The detail page will handle showing upload modal if no files exist
    router.push(`/bids/${bidId}/drawings/${drawing.id}`)
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6">
        {/* Breadcrumb */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/bids" className="text-gray-700 hover:text-blue-600">
                Bids
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">{bid?.bidNumber || 'Loading...'}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-blue-800">Loading bid details...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading bid</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error?.message || 'Failed to load bid details. Please try again.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content - Only show when data is loaded */}
        {!isLoading && !error && bid && (
        <>

        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{bid.bidName}</h1>
              </div>
              <p className="text-sm text-gray-600">{bid.bidNumber}</p>
            </div>
            {hasPermission('bids.edit:update') && (
              <div className="flex gap-2">
                <Link
                  href={`/bids/${bid.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Bid
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('drawings')}
                className={`${
                  activeTab === 'drawings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Drawings
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Tickets
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Files
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bid Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bid Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.bidNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bid Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.bidName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Industry</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.industry || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bid Closing Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {bid.bidClosingDate ? new Date(bid.bidClosingDate).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End User</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.endUser?.companyName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Main Contractor</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.mainContractor?.companyName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Consultant</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.consultant?.companyName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {[bid.cityTown, bid.state, bid.country].filter(Boolean).join(', ') || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Client Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {bid.clientType ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {bid.clientType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Team</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bid Manager</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.bidManager?.fullName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Drafting Manager</dt>
                      <dd className="mt-1 text-sm text-gray-900">{bid.draftingManager?.fullName || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Systems</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Main Systems</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {bid.mainSystems && bid.mainSystems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {bid.mainSystems.map((system) => (
                              <span
                                key={system.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {system.name} ({system.code})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No systems selected</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sub Systems</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {bid.subSystems && bid.subSystems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {bid.subSystems.map((subSystem) => (
                              <span
                                key={subSystem.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {subSystem.name} ({subSystem.code})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No sub systems selected</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'drawings' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Drawings</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsBulkUploadOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Bulk Upload
                    </button>
                    <button
                      onClick={() => setIsAddDrawingOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Drawing
                    </button>
                  </div>
                </div>

                {loadingDrawings ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : drawingsData && drawingsData.data && drawingsData.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Drawing Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Drawing Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sub System
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submission #
                          </th> */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Planned Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {drawingsData.data.map((drawing) => (
                          <tr key={drawing.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              <div className="flex items-center gap-2" title="Missing base CAD file">
                                <button
                                  onClick={() => handleDrawingClick(drawing)}
                                  className="hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  {drawing.drawingNumber}
                                </button>
                                {!drawing.hasInitialFile && (
                                  <svg
                                    className="w-5 h-5 text-red-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-label="Missing initial file"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {drawing.drawingName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {drawing.subSystem ? `${drawing.subSystem.name} (${drawing.subSystem.code})` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {drawing.drawingType?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {drawing.status}
                              </span>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {drawing.submissionNumber || 'N/A'}
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {drawing.plannedSubmissionDate
                                ? new Date(drawing.plannedSubmissionDate).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDrawingClick(drawing)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="View Drawing"
                              >
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDrawingId(drawing.id)
                                  setShowDeleteConfirm(true)
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Drawing"
                              >
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {drawingsData.pagination && (
                      <div className="bg-white px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Showing {drawingsData.data.length} of {drawingsData.pagination.total} drawings
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No drawings</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new drawing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tickets' && (
              <TicketsTab bidId={bidId} />
            )}

            {activeTab === 'files' && (
              <FilesTab bidId={bidId} bidNumber={bid.bidNumber} filesCount={bid.filesCount} />
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>

    {/* Add Drawing Drawer */}
    <AddDrawingDrawer
      isOpen={isAddDrawingOpen}
      onClose={() => setIsAddDrawingOpen(false)}
      bidId={bidId}
      bidSubSystems={bid?.subSystems}
    />

    {/* Bulk Upload Drawings Modal */}
    <BulkUploadDrawingsModal
      isOpen={isBulkUploadOpen}
      onClose={() => setIsBulkUploadOpen(false)}
      bidId={bidId}
      subSystems={
        bid?.subSystems && bid.subSystems.length > 0
          ? (subSystemsData || []).filter(subSystem =>
              bid.subSystems?.some(bidSubSystem => bidSubSystem.id === subSystem.id)
            )
          : subSystemsData || []
      }
      drawingTypes={drawingTypesData || []}
      onUpload={handleBulkUpload}
    />

    {/* Delete Drawing Confirmation Dialog */}
    {showDeleteConfirm && (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowDeleteConfirm(false)}
        ></div>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">Delete Drawing</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this drawing? This action cannot be undone.
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={deleteDrawingMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedDrawingId) {
                        try {
                          await deleteDrawingMutation.mutateAsync(selectedDrawingId)
                          setShowDeleteConfirm(false)
                          setSelectedDrawingId(null)
                        } catch (error) {
                          console.error('Failed to delete drawing:', error)
                        }
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={deleteDrawingMutation.isPending}
                  >
                    {deleteDrawingMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {deleteDrawingMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    </AppLayout>
  )
}
