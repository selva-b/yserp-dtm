'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useTask, useDeleteTask, useUpdateTaskStatus } from '@/hooks/use-tasks'
import { useStartTimer, useStopTimer, useActiveTimer } from '@/hooks/use-timesheets'
import EditTaskDrawer from '@/components/tasks/EditTaskDrawer'
import type { TaskStatus } from '@/services/tasks.service'
import { toast } from 'sonner'

/**
 * Task Details Page
 *
 * Features:
 * - Full task information display
 * - Status timeline with history (chronological)
 * - Timesheet entries summary
 * - Action buttons (Edit, Delete, Update Status)
 * - RBAC: tasks.view:details
 * - Performance Target: P95 ≤1.5s
 *
 * Actions:
 * - Back to list
 * - Edit task (future: modal/drawer)
 * - Delete task (with confirmation)
 * - Update status (inline with validation)
 */
export default function TaskDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params?.id as string
  const { hasPermission } = useAuth()

  const [isStatusUpdateMode, setIsStatusUpdateMode] = useState(false)
  const [newStatus, setNewStatus] = useState<TaskStatus | ''>('')
  const [statusNote, setStatusNote] = useState('')
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  // State for live timer display
  const [currentTime, setCurrentTime] = useState(new Date())

  // Check permissions
  const canEdit = hasPermission('tasks.edit:update')
  const canDelete = hasPermission('tasks.delete:remove')
  const canUpdateStatus = hasPermission('tasks.status:update')

  // Fetch task details
  const { data: task, isLoading, error } = useTask(taskId)

  // Fetch active timer
  const { data: activeTimer } = useActiveTimer()

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  // Mutations
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTaskStatus()
  const { mutate: startTimer, isPending: isStartingTimer } = useStartTimer()
  const { mutate: stopTimer, isPending: isStoppingTimer } = useStopTimer()

  // Handlers
  const handleBack = () => {
    router.push('/tasks')
  }

  const handleEdit = () => {
    setIsEditDrawerOpen(true)
  }

  const handleDelete = () => {
    deleteTask(taskId, {
      onSuccess: () => {
        router.push('/tasks')
      },
    })
  }

  const handleStatusUpdate = () => {
    if (!newStatus) {
      toast.error('Please select a new status')
      return
    }

    // Validate note requirement for cancelled
    if (newStatus === 'cancelled' && !statusNote.trim()) {
      toast.error('Note is required when cancelling a task')
      return
    }

    updateStatus({
      id: taskId,
      data: {
        status: newStatus as TaskStatus,
        note: statusNote.trim() || undefined,
      },
    }, {
      onSuccess: () => {
        setIsStatusUpdateMode(false)
        setNewStatus('')
        setStatusNote('')
      },
    })
  }

  const handleCancelStatusUpdate = () => {
    setIsStatusUpdateMode(false)
    setNewStatus('')
    setStatusNote('')
  }

  const handleStartTimer = () => {
    startTimer({
      taskId: taskId,
      notes: `Working on: ${task?.title}`,
    })
  }

  const handleStopTimer = () => {
    stopTimer({})
  }

  // Check if this task has the active timer
  const hasActiveTimer = activeTimer?.task?.id === taskId
  const isTimerActive = !!activeTimer

  // Calculate active timer duration in H:M:S format
  const calculateActiveTimerDuration = () => {
    if (!hasActiveTimer || !activeTimer?.startTime) return '0h 0m 0s'
    const start = new Date(activeTimer.startTime)
    const diffSeconds = Math.floor((currentTime.getTime() - start.getTime()) / 1000)
    const hours = Math.floor(diffSeconds / 3600)
    const mins = Math.floor((diffSeconds % 3600) / 60)
    const secs = diffSeconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  // Helper functions
  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', { dateStyle: 'medium' })
  }

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false
    return new Date(dueDate) < new Date()
  }

  const isTerminalState = (status: TaskStatus) => {
    return status === 'completed' || status === 'cancelled'
  }

  const getAllowedTransitions = (currentStatus: TaskStatus): TaskStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['in_progress', 'cancelled']
      case 'in_progress':
        return ['completed', 'cancelled']
      case 'completed':
      case 'cancelled':
        return [] // Terminal states
      default:
        return []
    }
  }

  // Calculate total timesheet hours
  const calculateTotalHours = () => {
    if (!task?.timesheetEntries) return 0
    const totalMinutes = task.timesheetEntries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0)
    return (totalMinutes / 60).toFixed(2)
  }

  // Format duration for display (e.g., "2 hrs 30 mins" or "45 mins")
  const formatDuration = (minutes: number) => {
    if (!minutes) return '0 mins'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0 && mins > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`
    } else {
      return `${mins} min${mins > 1 ? 's' : ''}`
    }
  }

  // Format total hours for display
  const formatTotalHours = () => {
    if (!task?.timesheetEntries) return '0 mins'
    const totalMinutes = task.timesheetEntries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0)
    return formatDuration(totalMinutes)
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading task details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !task) {
    const errorStatus = (error as any)?.response?.status || (error as any)?.status
    const isForbidden = errorStatus === 403

    return (
      <AppLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className={`rounded-md p-4 ${isForbidden ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${isForbidden ? 'text-yellow-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  {isForbidden ? (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  )}
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${isForbidden ? 'text-yellow-800' : 'text-red-800'}`}>
                  {isForbidden ? 'Access Denied' : 'Error loading task'}
                </h3>
                <div className={`mt-2 text-sm ${isForbidden ? 'text-yellow-700' : 'text-red-700'}`}>
                  <p>
                    {isForbidden
                      ? 'You do not have permission to view this task. Please contact your administrator if you believe this is an error.'
                      : (error as any)?.message || 'Task not found'}
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleBack}
                    className={`text-sm font-medium ${isForbidden ? 'text-yellow-800 hover:text-yellow-700' : 'text-red-800 hover:text-red-700'}`}
                  >
                    ← Back to tasks list
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const allowedTransitions = getAllowedTransitions(task.status)

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            ← Back to tasks
          </button>

          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.priority && (
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
                {isOverdue(task.dueDate, task.status) && (
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    ⚠️ Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex gap-2 items-center">
              {!isTerminalState(task.status) && (task.status === 'pending' || task.status === 'in_progress') && (
                <>
                  {hasActiveTimer && (
                    <div className="flex items-center space-x-2 mr-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {calculateActiveTimerDuration()}
                      </span>
                    </div>
                  )}
                  {hasActiveTimer ? (
                    <button
                      onClick={handleStopTimer}
                      disabled={isStoppingTimer}
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {isStoppingTimer ? 'Stopping...' : 'Stop Timer'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartTimer}
                      disabled={isStartingTimer || isTimerActive}
                      className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {isStartingTimer ? 'Starting...' : isTimerActive ? 'Timer Running (Other Task)' : 'Start Timer'}
                    </button>
                  )}
                </>
              )}
              {!isTerminalState(task.status) && canEdit && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Edit
                </button>
              )}
              {!isTerminalState(task.status) && canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Task Information</h2>

                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.description || <span className="text-gray-400">No description</span>}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className={`mt-1 text-sm ${isOverdue(task.dueDate, task.status) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                      {formatDate(task.dueDate)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assignee</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.assignee ? (
                        <div>
                          <div className="font-medium">{task.assignee.fullName}</div>
                          <div className="text-gray-500">{task.assignee.email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {task.assignee.department} • {task.assignee.role.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ticket</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.ticket ? (
                        <div>
                          <div className="font-medium">{task.ticket.ticketNumber}</div>
                          <div className="text-gray-500">{task.ticket.ticketName}</div>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(task.ticket.status as TaskStatus)} mt-1`}>
                            {task.ticket.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No ticket</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Drawing</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.drawing ? (
                        <div>
                          <Link
                            href={`/${task.drawing.entityType === 'bid' ? 'bids' : 'projects'}/${task.drawing.entityId}/drawings/${task.drawing.id}?from=tasks&taskId=${taskId}`}
                            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            {task.drawing.drawingNumber}
                          </Link>
                          <div className="text-gray-500">{task.drawing.drawingName}</div>
                          <div className="text-xs text-gray-400 mt-1">Status: {task.drawing.status}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No drawing</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(task.createdAt)}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(task.updatedAt)}</dd>
                  </div>

                </dl>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Status Timeline</h2>

                {task.statusHistory && task.statusHistory.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {task.statusHistory.map((history, idx) => (
                        <li key={history.id}>
                          <div className="relative pb-8">
                            {idx !== task.statusHistory.length - 1 && (
                              <span
                                className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusBadgeColor(history.status)}`}>
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="3" />
                                  </svg>
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    Status changed to{' '}
                                    <span className="font-medium">{history.status.replace('_', ' ')}</span>
                                  </p>
                                  {history.note && (
                                    <p className="mt-1 text-sm text-gray-500 italic">"{history.note}"</p>
                                  )}
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    by {history.user.fullName}
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  <time dateTime={history.changedAt}>{formatDateTime(history.changedAt)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No status changes yet</p>
                )}
              </div>
            </div>

            {/* Timesheet Summary */}
            {task.timesheetEntries && task.timesheetEntries.length > 0 && (
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Time Tracking</h2>

                  <div className="mb-4">
                    <div className="text-sm text-gray-500">Total Approved Time</div>
                    <div className="text-2xl font-semibold text-gray-900">{formatTotalHours()}</div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Entries ({task.timesheetEntries.filter(entry => entry.status === 'submitted' || entry.status === 'approved').length})
                    </h3>
                    <div className="space-y-3">
                      {task.timesheetEntries.filter(entry => entry.status === 'submitted' || entry.status === 'approved').slice(0, 5).map((entry) => (
                        <div key={entry.id} className="border-l-2 border-indigo-200 pl-3 py-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {entry.durationMinutes ? formatDuration(entry.durationMinutes) : 'In progress'}
                                </span>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                  entry.source === 'timer' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {entry.source}
                                </span>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                  entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {entry.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(entry.startTime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                                {' '}
                                {new Date(entry.startTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {entry.endTime && (
                                  <>
                                    {' → '}
                                    {new Date(entry.endTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Status Update Card */}
            {!isTerminalState(task.status) && allowedTransitions.length > 0 && (
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-base font-medium text-gray-900 mb-4">Update Status</h2>

                  {!canUpdateStatus ? (
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-sm text-gray-600">You don't have permission to update status.</p>
                    </div>
                  ) : !isStatusUpdateMode ? (
                    <button
                      onClick={() => setIsStatusUpdateMode(true)}
                      className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Change Status
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          New Status
                        </label>
                        <select
                          id="status"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select status...</option>
                          {allowedTransitions.map((status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                          Note {newStatus === 'cancelled' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          id="note"
                          rows={3}
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Optional note about this status change..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {newStatus === 'cancelled' && (
                          <p className="mt-1 text-xs text-gray-500">Note is required when cancelling</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleStatusUpdate}
                          disabled={isUpdatingStatus}
                          className="flex-1 inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {isUpdatingStatus ? 'Updating...' : 'Update'}
                        </button>
                        <button
                          onClick={handleCancelStatusUpdate}
                          disabled={isUpdatingStatus}
                          className="flex-1 inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Info Card */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-base font-medium text-gray-900 mb-4">Quick Info</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Status Changes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{task.statusHistory?.length || 0}</dd>
                  </div>
                  {task.timesheetEntries && task.timesheetEntries.length > 0 && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Time Entries</dt>
                      <dd className="mt-1 text-sm text-gray-900">{task.timesheetEntries.length}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Drawer */}
      {task && (
        <EditTaskDrawer
          task={task}
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
        />
      )}
    </AppLayout>
  )
}
