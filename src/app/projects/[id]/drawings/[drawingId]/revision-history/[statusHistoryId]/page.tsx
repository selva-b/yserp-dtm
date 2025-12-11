'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useRevisionHistoryDetail } from '@/hooks/useRevisionHistory'
import { useDrawingStatusHistory } from '@/hooks/useDrawings'
import { useDrawingBaseFiles } from '@/hooks/useDrawingFiles'
import AppLayout from '@/components/layout/AppLayout'
import RevisionFileUpload from '@/components/drawings/RevisionFileUpload'
import RevisionFileViewer from '@/components/drawings/RevisionFileViewer'

export default function ProjectRevisionHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const drawingId = params.drawingId as string
  const statusHistoryId = params.statusHistoryId as string
  const fromStatus = searchParams.get('from') === 'status'

  const { data: detail, isLoading, error } = useRevisionHistoryDetail(statusHistoryId)

  // Fetch full status history to find Internal Review files
  const { data: statusHistory } = useDrawingStatusHistory(drawingId)

  // Fetch Base CAD/PDF files for version 0.0
  const { data: baseFiles } = useDrawingBaseFiles(drawingId)

  // Check if this is a major version (X.0 format like 0.0, 1.0, 2.0, etc.)
  const isMajorVersion = detail?.revision_version?.endsWith('.0')

  // Extract major version number (e.g., "1.0" -> "1", "0.0" -> "0")
  const majorVersionNumber = detail?.revision_version?.split('.')[0]

  // For major versions (X.0), find the latest Internal Review entry with files matching the major version (e.g., for 1.0, find 1.x)
  // For minor versions (X.y with "Internal revision" status), find "Internal review" from the SAME version
  //   e.g., Version 0.1 (Internal revision) → show "Internal review 0.1" files
  //         Version 0.2 (Internal revision) → show "Internal review 0.2" files
  // For version 0.0 with "Internal revision" or "Revision ongoing", show files from "Open" status (initial upload during add drawing)
  // Note: Always look for "Internal review" status only (not "Internal revision"), except for version 0.0 which uses "Open"

  // First, check if we're looking at version 0.x (initial version series)
  const isInitialVersionSeries = majorVersionNumber === '0'

  // Check if current version is 0.0 specifically
  const isInitialVersion = detail?.revision_version === '0.0'

  const internalReviewEntry = statusHistory && statusHistory.length > 0
    ? statusHistory.find(
        (entry) => {
          if (isMajorVersion) {
            if (isInitialVersion) {
              // For version 0.0 with "Open" status, find "Internal review" with version 0.0
              if (detail.status === 'Open') {
                if (entry.status !== 'Internal review' || !entry.hasFiles) return false
                return entry.revisionVersion === '0.0'
              }
              // For version 0.0 with "Internal revision" or "Revision ongoing", find "Open" status with files (initial upload during add drawing)
              if (detail.status === 'Internal revision' || detail.status === 'Revision ongoing') {
                return entry.status === 'Open' && entry.hasFiles
              }
              // For other statuses of version 0.0, don't show submitted files section
              return false
            } else if (isInitialVersionSeries) {
              // For other major versions in 0.x series (shouldn't exist, but handle gracefully)
              return false
            } else {
              // For major versions (1.0, 2.0, etc.), find latest "Internal review" from SAME major series
              // E.g., for 1.0 → find any 1.x (including 1.0, 1.1, 1.2), for 2.0 → find any 2.x
              if (entry.status !== 'Internal review' || !entry.hasFiles) return false
              return entry.revisionVersion === detail?.revision_version //entry.revisionVersion?.startsWith(`${majorVersionNumber}.`)
            }
          } else {
            // For minor versions (X.y with "Internal revision" status ONLY), find "Internal review" from SAME version
            // Only show for "Internal revision" status, not other statuses
            if (detail?.status !== 'Internal revision') return false

            // Find the most recent "Internal review" entry for the SAME version
            // E.g., for 0.1 → find "Internal review" with version 0.1
            //       for 0.2 → find "Internal review" with version 0.2
            //       for 0.3 → find "Internal review" with version 0.3
            if (entry.status !== 'Internal review' || !entry.hasFiles) return false

            return entry.revisionVersion === detail?.revision_version
          }
        }
      )
    : null

  // Debug logging
  console.log('Debug Info:', {
    currentVersion: detail?.revision_version,
    currentStatus: detail?.status,
    isMajorVersion,
    majorVersionNumber,
    internalReviewEntry: internalReviewEntry ? {
      id: internalReviewEntry.id,
      version: internalReviewEntry.revisionVersion,
      status: internalReviewEntry.status,
      hasFiles: internalReviewEntry.hasFiles
    } : null,
    allEntries: statusHistory?.map(e => ({
      status: e.status,
      version: e.revisionVersion,
      hasFiles: e.hasFiles
    }))
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">Failed to load revision history details</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!detail) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-800">Revision history not found</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <a href="/projects" className="hover:text-blue-600">Projects</a>
            </li>
            <li>/</li>
            <li>
              <a href={`/projects/${projectId}`} className="hover:text-blue-600">Project Details</a>
            </li>
            <li>/</li>
            <li>
              <a href={`/projects/${projectId}/drawings/${drawingId}`} className="hover:text-blue-600">
                {detail.drawing_number}
              </a>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{fromStatus ? 'Version' : 'Revision'} {detail.revision_version}</li>
          </ol>
        </nav>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/projects/${projectId}/drawings/${drawingId}`)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            Back to Drawing Details
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {fromStatus ? 'Status History Detail' : 'Revision History Detail'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {detail.drawing_number} - {detail.drawing_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {detail.revision_version}
              </div>
              <div className="text-sm text-gray-500">{fromStatus ? 'Version' : 'Revision Version'}</div>
            </div>
          </div>
        </div>

        {/* Revision Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {fromStatus ? 'Status Information' : 'Revision Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  detail.status === 'Internal revision'
                    ? 'bg-orange-100 text-orange-800'
                    : detail.status === 'Revision ongoing'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {detail.status}
              </span>
            </div>

            {/* Changed By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Changed By
              </label>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <span className="text-sm font-medium text-blue-600">
                    {detail.changed_by.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {detail.changed_by.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{detail.changed_by.email}</p>
                </div>
              </div>
            </div>

            {/* Changed At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Changed At
              </label>
              <p className="text-sm text-gray-900">
                {new Date(detail.changed_at).toLocaleString()}
              </p>
            </div>

            {/* Revision Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revision Version
              </label>
              <p className="text-sm font-semibold text-blue-600">
                {detail.revision_version}
              </p>
            </div>
          </div>

          {/* Comment */}
          {detail.comment && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{detail.comment}</p>
              </div>
            </div>
          )}

          {/* Status Code */}
          {detail.code && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Code
              </label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm font-medium">
                  {detail.code.code}
                </span>
                <span className="text-sm text-gray-600">{detail.code.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Revision Files - Files uploaded during this status change */}
        {/* Don't show for: Submitted, On review, Designing (no file uploads expected) */}
        {detail.status !== 'Submitted' &&
         detail.status !== 'On review' &&
         detail.status !== 'Designing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reference Files
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {detail.revision_version === '0.0' && detail.status === 'Open'
                ? 'Initial files uploaded to Base CAD and Base PDF folders'
                : 'Files uploaded during this status change'}
            </p>
            {/* For version 0.0 with Open status, show Base CAD/PDF files */}
            {detail.revision_version === '0.0' && detail.status === 'Open' && baseFiles ? (
              <div className="space-y-4">
                {/* CADD Files */}
                {baseFiles.cadd && baseFiles.cadd.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">CADD Files</h3>
                    <div className="space-y-2">
                      {baseFiles.cadd.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF Files */}
                {baseFiles.pdf && baseFiles.pdf.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">PDF Files</h3>
                    <div className="space-y-2">
                      {baseFiles.pdf.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No files message */}
                {(!baseFiles.cadd || baseFiles.cadd.length === 0) &&
                 (!baseFiles.pdf || baseFiles.pdf.length === 0) && (
                  <p className="text-sm text-gray-500 italic">No initial files uploaded yet.</p>
                )}
              </div>
            ) : detail.revision_file ? (
              <RevisionFileViewer
                statusHistoryId={statusHistoryId}
                files={detail.revision_file}
              />
            ) : (
              <RevisionFileUpload
                statusHistoryId={statusHistoryId}
                drawingNumber={detail.drawing_number}
                revisionVersion={detail.revision_version}
              />
            )}
          </div>
        )}

        {/* Section 2: Submitted Files */}
        {/* For version 0.0 with "Open" status: Show most recent "Internal review" from 0.x series */}
        {/* For version 0.0 with "Internal revision" or "Revision ongoing": Show files from "Open" status (initial upload) */}
        {/* For major versions (X.0): Show when status is Submitted or Revision ongoing */}
        {/* For minor versions (X.y): Always show the Internal Review files for that version */}
        {internalReviewEntry && (
          !isMajorVersion ||
          (isMajorVersion && (
            detail.status === 'Submitted' ||
            detail.status === 'Revision ongoing' ||
            (isInitialVersion && (detail.status === 'Open' || detail.status === 'Internal revision' || detail.status === 'Revision ongoing'))
          ))
        ) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Submitted Files
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {isInitialVersion && detail.status === 'Open'
                ? `Files uploaded during Internal Review (version ${internalReviewEntry.revisionVersion})`
                : isInitialVersion
                  ? `Files uploaded during initial drawing creation (version ${internalReviewEntry.revisionVersion})`
                  : isMajorVersion
                    ? `Latest files uploaded during Internal Review (version ${internalReviewEntry.revisionVersion})`
                    : `Files uploaded during Internal Review (version ${internalReviewEntry.revisionVersion})`
              }
            </p>
            <RevisionFileViewer
              statusHistoryId={internalReviewEntry.id}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
