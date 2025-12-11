'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { useTimesheets, useStartTimer, useStopTimer, useActiveTimer, useForceStopTimer } from '@/hooks/use-timesheets'
import CreateManualEntryDrawer from '@/components/timesheets/CreateManualEntryDrawer'
import EditTimesheetDrawer from '@/components/timesheets/EditTimesheetDrawer'
import ApprovalsTab from '@/components/timesheets/ApprovalsTab'
import StartTimerDialog from '@/components/timesheets/StartTimerDialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { TimesheetStatus, TimesheetSource, TimesheetEntry } from '@/services/timesheets.service'
import { useUsers } from '@/hooks/use-users'
import { useTasks } from '@/hooks/use-tasks'
import { useTickets } from '@/hooks/useTickets'
import { useDrawings } from '@/hooks/useDrawings'
import SearchableMultiSelect, { type Option } from '@/components/common/SearchableMultiSelect'
import { useAuth } from '@/contexts/AuthContext'

// Helper function to get start of week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper function to get end of week (Sunday)
const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day)
  d.setDate(diff)
  d.setHours(23, 59, 59, 999)
  return d
}

// Format date to YYYY-MM-DD for input fields
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// Format date range for display
const formatWeekRange = (startDate: Date, endDate: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
}

/**
 * Timesheets Page
 *
 * Features:
 * - Weekly grid view with daily totals
 * - Timer controls (Start/Stop) with active timer display
 * - Manual entry drawer
 * - Filters: Users, Tasks, Tickets, Status, Source, Date Range
 * - Approvals tab for managers
 * - RBAC: timesheets.view:list (SELF for Draftsmen, ALL for Managers)
 * - Performance Target: P95 ≤1.5s
 */
export default function TimesheetsPage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'my-time' | 'approvals'>('my-time')

  // State for start timer dialog
  const [isStartTimerDialogOpen, setIsStartTimerDialogOpen] = useState(false)

  // State for manual entry drawer
  const [isManualEntryDrawerOpen, setIsManualEntryDrawerOpen] = useState(false)

  // State for edit drawer
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null)

  // State for force stop timer dialog
  const [forceStopDialogOpen, setForceStopDialogOpen] = useState(false)
  const [forceStopTarget, setForceStopTarget] = useState<{ userId: string; userName: string } | null>(null)

  // State for filters
  const [statusFilter, setStatusFilter] = useState<TimesheetStatus | undefined>(undefined)
  const [sourceFilter, setSourceFilter] = useState<TimesheetSource | undefined>(undefined)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()))
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  // Fetch dropdown data
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ limit: 100, status: 'active' })
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks({ pageSize: 100 })
  const { data: ticketsData, isLoading: isLoadingTickets } = useTickets({ page: 1, pageSize: 100 })
  const { data: drawingsData, isLoading: isLoadingDrawings } = useDrawings({ page: 1, pageSize: 100 })

  // Convert data to Option format for SearchableMultiSelect
  const userOptions: Option[] = usersData?.data.map((user) => ({
    value: user.id,
    label: user.fullName,
    subtitle: user.role?.name || 'No Role',
  })) || []

  const taskOptions: Option[] = tasksData?.data.map((task) => ({
    value: task.id,
    label: task.title,
    subtitle: `Status: ${task.status}`,
  })) || []

  const ticketOptions: Option[] = ticketsData?.data.map((ticket) => ({
    value: ticket.id,
    label: `${ticket.ticketNumber}: ${ticket.ticketName}`,
    subtitle: `${ticket.relatedTo} - ${ticket.status}`,
  })) || []

  const drawingOptions: Option[] = drawingsData?.data.map((drawing) => ({
    value: drawing.id,
    label: `${drawing.drawingNumber}: ${drawing.drawingName}`,
    subtitle: `Status: ${drawing.status}`,
  })) || []

  // Initialize with current week on mount
  useEffect(() => {
    const weekStart = getStartOfWeek(new Date())
    const weekEnd = getEndOfWeek(new Date())
    setCurrentWeekStart(weekStart)
    setStartDate(formatDateForInput(weekStart))
    setEndDate(formatDateForInput(weekEnd))
  }, [])

  // Week navigation handlers
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() - 7)
    const newWeekEnd = getEndOfWeek(newWeekStart)
    setCurrentWeekStart(newWeekStart)
    setStartDate(formatDateForInput(newWeekStart))
    setEndDate(formatDateForInput(newWeekEnd))
  }

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + 7)
    const newWeekEnd = getEndOfWeek(newWeekStart)
    setCurrentWeekStart(newWeekStart)
    setStartDate(formatDateForInput(newWeekStart))
    setEndDate(formatDateForInput(newWeekEnd))
  }

  const goToCurrentWeek = () => {
    const weekStart = getStartOfWeek(new Date())
    const weekEnd = getEndOfWeek(new Date())
    setCurrentWeekStart(weekStart)
    setStartDate(formatDateForInput(weekStart))
    setEndDate(formatDateForInput(weekEnd))
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  // Fetch timesheets with React Query
  const { data, isLoading, error } = useTimesheets(
    {
      status: statusFilter,
      source: sourceFilter,
      userIds: selectedUserIds.length > 0 ? selectedUserIds.join(',') : undefined,
      taskIds: selectedTaskIds.length > 0 ? selectedTaskIds.join(',') : undefined,
      ticketIds: selectedTicketIds.length > 0 ? selectedTicketIds.join(',') : undefined,
      drawingIds: selectedDrawingIds.length > 0 ? selectedDrawingIds.join(',') : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      pageSize,
      includeTotals: true,
    },
    {
      enabled: true,
    },
  )

  // Get current user for role-based features
  const { user } = useAuth()

  // Timer mutations
  const { mutate: startTimer, isPending: isStarting } = useStartTimer()
  const { mutate: stopTimer, isPending: isStopping } = useStopTimer()
  const { mutate: forceStopTimer, isPending: isForceStopping } = useForceStopTimer()

  // Fetch active timer for current user (always user-specific, even for Admin)
  const { data: activeTimer } = useActiveTimer()

  const timesheets = data?.data || []
  const total = data?.pagination.total || 0
  const totalPages = data?.pagination.totalPages || 0
  const totals = data?.totals

  // Handlers
  const handleStartTimer = () => {
    setIsStartTimerDialogOpen(true)
  }

  const handleStartTimerConfirm = (data: { taskId?: string; notes?: string }) => {
    startTimer(data, {
      onSuccess: () => {
        setIsStartTimerDialogOpen(false)
      },
    })
  }

  const handleStopTimer = () => {
    if (activeTimer) {
      stopTimer({})
    }
  }

  const handleForceStopTimer = (userId: string, userName: string) => {
    setForceStopTarget({ userId, userName })
    setForceStopDialogOpen(true)
  }

  const confirmForceStopTimer = () => {
    if (forceStopTarget) {
      forceStopTimer(
        { userId: forceStopTarget.userId },
        {
          onSuccess: () => {
            setForceStopDialogOpen(false)
            setForceStopTarget(null)
          },
        }
      )
    }
  }

  const cancelForceStopTimer = () => {
    setForceStopDialogOpen(false)
    setForceStopTarget(null)
  }

  // Helper functions
  const getStatusBadgeColor = (status: TimesheetStatus) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceBadgeColor = (source: TimesheetSource) => {
    return source === 'timer' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // State for live timer display
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  const calculateActiveTimerDuration = () => {
    if (!activeTimer || !activeTimer.startTime) return '0h 0m 0s'
    const start = new Date(activeTimer.startTime)
    const diffSeconds = Math.floor((currentTime.getTime() - start.getTime()) / 1000)
    const hours = Math.floor(diffSeconds / 3600)
    const mins = Math.floor((diffSeconds % 3600) / 60)
    const secs = diffSeconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Timer Controls */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Timesheets</h1>
            <p className="mt-2 text-sm text-gray-700">
              Track time spent on tasks and tickets.
            </p>
          </div>

          {/* Timer Controls */}
          <div className="mt-4 sm:ml-16 sm:mt-0 flex items-center space-x-4">
            {activeTimer && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {calculateActiveTimerDuration()}
                  </span>
                </div>
              </div>
            )}

            {!activeTimer ? (
              <button
                type="button"
                onClick={handleStartTimer}
                disabled={isStarting}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {isStarting ? 'Starting...' : 'Start Timer'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTimer}
                disabled={isStopping}
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
                {isStopping ? 'Stopping...' : 'Stop Timer'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsManualEntryDrawerOpen(true)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Manual Entry
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-time')}
                className={`${
                  activeTab === 'my-time'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                My Time
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`${
                  activeTab === 'approvals'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                Approvals
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'approvals' ? (
          <ApprovalsTab startDate={startDate} endDate={endDate} />
        ) : (
          <>
            {/* Week Selector */}
            <div className="mt-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-sm font-medium text-gray-900">Week View</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousWeek}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
                      {startDate && endDate ? formatWeekRange(new Date(startDate), new Date(endDate)) : 'Select dates'}
                    </span>
                    <button
                      onClick={goToNextWeek}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToCurrentWeek}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Current Week
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter((e.target.value as TimesheetStatus) || undefined)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                Source
              </label>
              <select
                id="source"
                value={sourceFilter || ''}
                onChange={(e) => setSourceFilter((e.target.value as TimesheetSource) || undefined)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Sources</option>
                <option value="timer">Timer</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Users Filter */}
            <SearchableMultiSelect
              id="users"
              label="Filter by Users"
              options={userOptions}
              selectedValues={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Select users..."
              helperText="Search and select multiple users"
              isLoading={isLoadingUsers}
            />

            {/* Tasks Filter */}
            <SearchableMultiSelect
              id="tasks"
              label="Filter by Tasks"
              options={taskOptions}
              selectedValues={selectedTaskIds}
              onChange={setSelectedTaskIds}
              placeholder="Select tasks..."
              helperText="Search and select multiple tasks"
              isLoading={isLoadingTasks}
            />

            {/* Tickets Filter */}
            <SearchableMultiSelect
              id="tickets"
              label="Filter by Tickets"
              options={ticketOptions}
              selectedValues={selectedTicketIds}
              onChange={setSelectedTicketIds}
              placeholder="Select tickets..."
              helperText="Search and select multiple tickets"
              isLoading={isLoadingTickets}
            />

            {/* Drawings Filter */}
            <SearchableMultiSelect
              id="drawings"
              label="Filter by Drawings"
              options={drawingOptions}
              selectedValues={selectedDrawingIds}
              onChange={setSelectedDrawingIds}
              placeholder="Select drawings..."
              helperText="Search and select multiple drawings"
              isLoading={isLoadingDrawings}
            />
          </div>
        </div>

        {/* Totals Summary */}
        {totals && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Total Time</p>
                <p className="text-2xl font-bold text-blue-700">{formatDuration(totals.totalMinutes)}</p>
              </div>
              {/* <div className="text-right">
                <p className="text-sm text-blue-700">
                  {totals.totalHours.toFixed(2)} hours
                </p>
              </div> */}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading timesheets...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading timesheets</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{(error as any)?.message || 'An unexpected error occurred'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timesheets Table */}
        {!isLoading && !error && timesheets.length > 0 && (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Task/Ticket
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Time
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Duration
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Source
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {timesheets.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          {new Date(entry.startTime).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {entry.task ? (
                            <Link
                              href={`/tasks/${entry.task.id}`}
                              className="text-indigo-600 hover:text-indigo-900 hover:underline"
                            >
                              {entry.task.title}
                            </Link>
                          ) : entry.ticket ? (
                            <span className="text-indigo-600">
                              {entry.ticket.ticketNumber}: {entry.ticket.ticketName}
                            </span>
                          ) : (
                            <span className="text-gray-400">No task/ticket</span>
                          )}
                          {entry.notes && (
                            <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-xs">
                            <div>{new Date(entry.startTime).toLocaleTimeString()}</div>
                            {entry.endTime && <div>→ {new Date(entry.endTime).toLocaleTimeString()}</div>}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {entry.endTime ? formatDuration(entry.durationMinutes) : (
                            <span className="text-red-600 flex items-center">
                              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                              Running
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getSourceBadgeColor(entry.source)}`}>
                            {entry.source}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadgeColor(entry.status)}`}>
                            {entry.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div className="flex items-center justify-end gap-3">
                            {/* Edit button for submitted entries */}
                            {entry.endTime && entry.status === 'submitted' && (
                              <button
                                onClick={() => setEditingEntry(entry)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                            )}

                            {/* Force Stop Timer button (Admin only, for active timers of other users) */}
                            {!entry.endTime &&
                             entry.source === 'timer' &&
                             user?.role === 'Admin' &&
                             entry.userId !== user?.id && (
                              <button
                                onClick={() => handleForceStopTimer(entry.userId, entry.user?.fullName || 'User')}
                                disabled={isForceStopping}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Force stop this user's timer"
                              >
                                {isForceStopping ? 'Stopping...' : 'Force Stop'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-6">
              <div className="-mt-px flex w-0 flex-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
              </div>
              <div className="hidden md:-mt-px md:flex">
                <span className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">
                  Page {page} of {totalPages} ({total} total)
                </span>
              </div>
              <div className="-mt-px flex w-0 flex-1 justify-end">
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && timesheets.length === 0 && (
          <div className="mt-8 text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No timesheet entries</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTimer ? 'Stop the timer to create your first entry.' : 'Start a timer or add a manual entry to begin tracking time.'}
            </p>
          </div>
        )}
          </>
        )}
      </div>

      {/* Start Timer Dialog */}
      <StartTimerDialog
        isOpen={isStartTimerDialogOpen}
        onClose={() => setIsStartTimerDialogOpen(false)}
        onConfirm={handleStartTimerConfirm}
        isPending={isStarting}
      />

      {/* Create Manual Entry Drawer */}
      <CreateManualEntryDrawer
        isOpen={isManualEntryDrawerOpen}
        onClose={() => setIsManualEntryDrawerOpen(false)}
      />

      {/* Edit Timesheet Drawer */}
      <EditTimesheetDrawer
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        entry={editingEntry}
      />

      {/* Force Stop Timer Dialog */}
      <ConfirmDialog
        isOpen={forceStopDialogOpen}
        onClose={cancelForceStopTimer}
        onConfirm={confirmForceStopTimer}
        title="Force Stop Timer"
        message={`Are you sure you want to force stop the timer for ${forceStopTarget?.userName || 'this user'}? This action will immediately stop their active timer and cannot be undone.`}
        confirmText="Force Stop"
        cancelText="Cancel"
        variant="danger"
        isLoading={isForceStopping}
      />
    </AppLayout>
  )
}
