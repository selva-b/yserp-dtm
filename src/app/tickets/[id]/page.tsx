'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useTicket } from '@/hooks/use-tickets'
import { useTasks } from '@/hooks/use-tasks'
import StatusBadge from '@/components/ui/StatusBadge'
import PriorityBadge from '@/components/ui/PriorityBadge'
import EditTicketDrawer from '@/components/tickets/EditTicketDrawer'
import DeleteTicketDialog from '@/components/tickets/DeleteTicketDialog'
import CreateTaskDrawer from '@/components/tasks/CreateTaskDrawer'
import InlineFileUpload from '@/components/common/InlineFileUpload'
import { deleteTicketAttachment, getTicketAttachmentDownloadUrl } from '@/services/tickets.service'
import type { TicketOption } from '@/services/tickets.service'
import { formatStatus as formatTaskStatus } from '@/services/tasks.service'

/**
 * Ticket Details Page
 *
 * Features:
 * - Display ticket information
 * - View related bid/project
 * - View attachments
 * - Edit ticket (drawer)
 * - Delete ticket (with confirmation)
 * - RBAC: tickets.view:details
 *
 * Business Rules:
 * - Bid Manager can only access tickets where Related To = Bids
 * - Project Manager can only access tickets where Related To = Projects
 */
export default function TicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = useAuth()
  const ticketId = params.id as string

  const { data: ticket, isLoading, error, refetch } = useTicket(ticketId)

  // Determine back navigation based on query params or ticket data
  const [backLink, setBackLink] = useState({ url: '/tickets', label: 'Back to Tickets' })

  useEffect(() => {
    // Check if we have a 'from' query parameter
    const fromParam = searchParams.get('from')

    // Only change the back link if explicitly coming from bid or project
    if (fromParam === 'bid' && ticket?.bid?.id) {
      setBackLink({
        url: `/bids/${ticket.bid.id}#tickets`,
        label: 'Back to Bid'
      })
    } else if (fromParam === 'project' && ticket?.project?.id) {
      setBackLink({
        url: `/projects/${ticket.project.id}#tickets`,
        label: 'Back to Project'
      })
    }
    // If no 'from' parameter, keep the default "Back to Tickets"
  }, [searchParams, ticket])

  // Fetch tasks for this ticket
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    ticketId: ticketId,
    pageSize: 100, // Show all tasks for this ticket
  })
  const tasks = tasksData?.data || []

  // Calculate completed tasks count
  const completedTasksCount = tasks.filter(task => task.status === 'completed').length
  const totalTasksCount = tasks.length

  // Drawer/Dialog state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateTaskDrawerOpen, setIsCreateTaskDrawerOpen] = useState(false)

  // Handle edit drawer close - refetch to get updated attachments
  const handleEditDrawerClose = () => {
    setIsEditDrawerOpen(false)
    // Refetch ticket data to get updated attachments
    refetch()
  }

  // Attachment delete state
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [attachmentToDelete, setAttachmentToDelete] = useState<{
    id: string;
    filename: string;
  } | null>(null)

  // File upload state
  const [showAddAttachments, setShowAddAttachments] = useState(false)

  // PDF preview state
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: string;
    fileUrl: string;
    uploadedAt: string;
  } | null>(null)

  // Handle deleting an attachment with confirmation
  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return

    setDeletingAttachmentId(attachmentToDelete.id)
    try {
      await deleteTicketAttachment(attachmentToDelete.id)
      // Refetch to show updated attachments
      refetch()
      setAttachmentToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete attachment:', error)
      alert(error.message || 'Failed to delete attachment')
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  // Handle downloading an attachment
  const handleDownloadAttachment = async (attachmentId: string) => {
    try {
      // Get download URL with Content-Disposition header from backend
      const { downloadUrl } = await getTicketAttachmentDownloadUrl(attachmentId)

      // Open the download URL - browser will download due to Content-Disposition header
      window.location.href = downloadUrl
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download attachment. Please try again.')
    }
  }


  // Convert TicketDetails to TicketOption for components
  const ticketOption: TicketOption | null = ticket ? {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    ticketName: ticket.ticketName,
    relatedTo: ticket.relatedTo,
    status: ticket.status,
    priority: ticket.priority,
    dueDate: ticket.dueDate,
    assignee: ticket.assignee,
    bid: ticket.bid,
    project: ticket.project,
  } : null

  const handleDeleteSuccess = () => {
    // Redirect to tickets list after successful deletion
    router.push('/tickets')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(backLink.url)}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
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
                  {backLink.label}
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {ticket?.ticketNumber || 'Ticket Details'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {ticket?.ticketName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditDrawerOpen(true)}
                  disabled={isLoading || !ticket}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>

                {/* Only show delete button if no tasks are mapped to this ticket */}
                {totalTasksCount === 0 && (
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading || !ticket}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Loading State */}
          {isLoading && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading ticket details...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading ticket</h3>
                  <p className="mt-1 text-sm text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Details */}
          {!isLoading && !error && ticket && (
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ticket Number</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">{ticket.ticketNumber}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <StatusBadge status={ticket.status as any} />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Priority</dt>
                      <dd className="mt-1">
                        {ticket.priority ? <PriorityBadge priority={ticket.priority as any} /> : <span className="text-gray-400">Not set</span>}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Assignee</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {ticket.assignee ? (
                          <div>
                            <div>{ticket.assignee.fullName}</div>
                            <div className="text-xs text-gray-500">{ticket.assignee.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(ticket.startDate)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(ticket.dueDate)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Related Entity Card */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Related To</h2>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 capitalize">{ticket.relatedTo}</dt>
                      <dd className="mt-1">
                        {ticket.relatedTo === 'bids' && ticket.bid ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-blue-600">{ticket.bid.bidNumber}</span>
                            <span className="text-sm text-gray-900">{ticket.bid.bidName}</span>
                            <button
                              onClick={() => router.push(`/bids/${ticket.bid?.id}`)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              View Bid →
                            </button>
                          </div>
                        ) : ticket.relatedTo === 'projects' && ticket.project ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-blue-600">{ticket.project.projectNumber}</span>
                            <span className="text-sm text-gray-900">{ticket.project.projectName}</span>
                            <button
                              onClick={() => router.push(`/projects/${ticket.project?.id}`)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              View Project →
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Description Card */}
              {ticket.description && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Description</h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>
              )}

              {/* Attachments Card */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Attachments {ticket.attachments && ticket.attachments.length > 0 && `(${ticket.attachments.length})`}
                  </h2>
                  <button
                    onClick={() => setShowAddAttachments(!showAddAttachments)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {showAddAttachments ? 'Cancel' : 'Add Attachments'}
                  </button>
                </div>
                <div className="px-6 py-5">
                  {/* Add Attachments Section */}
                  {showAddAttachments && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Upload New Attachments</h3>
                        <button
                          onClick={() => setShowAddAttachments(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <InlineFileUpload
                        entityType={ticket.relatedTo === 'bids' ? 'bid' : 'project'}
                        entityId={ticket.relatedTo === 'bids' ? ticket.bid!.id : ticket.project!.id}
                        fileContext="ticket"
                        bidCode={ticket.relatedTo === 'bids' ? ticket.bid!.bidNumber : ticket.project!.projectNumber}
                        ticketNumber={ticket.ticketNumber}
                        onUploadComplete={() => {
                          refetch()
                          setShowAddAttachments(false)
                        }}
                      />
                    </div>
                  )}

                  {/* Existing Attachments */}
                  {(!ticket.attachments || ticket.attachments.length === 0) ? (
                    <div className="text-center py-6">
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
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No attachments uploaded yet</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Click "Add Attachments" to upload files
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ticket.attachments.map((attachment) => {
                        const fileName = attachment.fileUrl.split('/').pop()?.split('?')[0] || 'Attachment'
                        const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE'

                        return (
                          <div key={attachment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                            {/* File Icon and Name */}
                            <div className="flex items-start space-x-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <p className="text-xs text-gray-500">{fileExtension}</p>
                              </div>
                            </div>

                            {/* Upload Info */}
                            <div className="mb-3">
                              <p className="text-xs text-gray-500">
                                {formatDateTime(attachment.uploadedAt)}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <button
                                onClick={() => setPreviewAttachment(attachment)}
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                              >
                                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => handleDownloadAttachment(attachment.id)}
                                className="inline-flex items-center text-xs text-gray-600 hover:text-gray-800"
                              >
                                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </button>
                              <button
                                onClick={() => setAttachmentToDelete({ id: attachment.id, filename: fileName })}
                                disabled={deletingAttachmentId === attachment.id}
                                className="inline-flex items-center text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {deletingAttachmentId === attachment.id ? (
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                                ) : (
                                  <>
                                    <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks and Metadata - Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks List Card */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {completedTasksCount} / {totalTasksCount} completed
                        </span>
                        {hasPermission('tasks.create:add') && (
                          <button
                            onClick={() => setIsCreateTaskDrawerOpen(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg
                              className="h-4 w-4 mr-1.5"
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
                            Create Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    {tasksLoading && (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading tasks...</span>
                      </div>
                    )}

                    {!tasksLoading && tasks.length === 0 && (
                      <div className="text-center py-8">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">No tasks found for this ticket</p>
                      </div>
                    )}

                    {!tasksLoading && tasks.length > 0 && (
                      <div className="overflow-hidden max-h-80 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                          {tasks.map((task) => (
                            <li
                              key={task.id}
                              onClick={() => router.push(`/tasks/${task.id}`)}
                              className="py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 rounded-md px-3 -mx-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="mt-1 text-sm text-gray-500 truncate">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {/* Status Badge */}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {formatTaskStatus(task.status)}
                                    </span>

                                    {/* Priority Badge */}
                                    {task.priority && (
                                      <PriorityBadge priority={task.priority as any} />
                                    )}

                                    {/* Due Date */}
                                    {task.dueDate && (
                                      <span className="text-xs text-gray-500">
                                        Due: {formatDate(task.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Arrow Icon */}
                                <svg
                                  className="ml-4 h-5 w-5 text-gray-400 flex-shrink-0"
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
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata Card */}
                <div className="bg-white shadow rounded-lg h-fit">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Metadata</h2>
                  </div>
                  <div className="px-6 py-5">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Ticket Drawer */}
      <EditTicketDrawer
        isOpen={isEditDrawerOpen}
        onClose={handleEditDrawerClose}
        ticket={ticketOption}
      />

      {/* Delete Ticket Dialog */}
      <DeleteTicketDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        ticket={ticketOption}
        onSuccess={handleDeleteSuccess}
      />

      {/* Delete Attachment Confirmation Dialog */}
      {attachmentToDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Attachment
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{attachmentToDelete.filename}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAttachmentToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAttachment}
                disabled={deletingAttachmentId === attachmentToDelete.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAttachmentId === attachmentToDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Drawer */}
      <CreateTaskDrawer
        isOpen={isCreateTaskDrawerOpen}
        onClose={() => setIsCreateTaskDrawerOpen(false)}
        preselectedTicketId={ticketId}
        preselectedEntityType={ticket?.relatedTo as 'bids' | 'projects' | undefined}
        preselectedEntityId={ticket?.relatedTo === 'bids' ? ticket?.bid?.id : ticket?.project?.id}
      />

      {/* PDF Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] m-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {previewAttachment.fileUrl.split('/').pop()?.split('?')[0] || 'Attachment'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Uploaded on {formatDateTime(previewAttachment.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleDownloadAttachment(previewAttachment.id)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  title="Download"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  title="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewAttachment.fileUrl}
                className="w-full h-full border-0"
                title="Attachment Preview"
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
