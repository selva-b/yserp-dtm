'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useTasks, useDeleteTask, useTask } from '@/hooks/use-tasks'
import { useDebounce } from '@/hooks/use-debounce'
import { useUsers } from '@/hooks/useBidsForm'
import { useTickets } from '@/hooks/useTickets'
import { useDrawings } from '@/hooks/useDrawings'
import { useBids } from '@/hooks/useBids'
import { useProjects } from '@/hooks/useProjects'
import CreateTaskDrawer from '@/components/tasks/CreateTaskDrawer'
import EditTaskDrawer from '@/components/tasks/EditTaskDrawer'
import FilterDialog, { FilterField, ActiveFilter } from '@/components/common/FilterDialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { Task, TaskStatus, Priority } from '@/services/tasks.service'

/**
 * Tasks List Page
 *
 * Features:
 * - List with pagination
 * - Required Assignee filter (per requirements)
 * - Search by title/description (debounced)
 * - Filters: status, priority, ticket, drawing
 * - Sort: dueDate, priority, updatedAt, createdAt
 * - RBAC: tasks.view:list
 * - Performance Target: P95 ≤1.5s
 *
 * Actions:
 * - View details (redirect to /tasks/[id])
 * - Edit (future: drawer/modal)
 * - Delete (soft-delete with confirmation)
 * - Update status (future: inline or modal)
 */
export default function TasksPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()

  // Step 1: Bid or Project selection (REQUIRED FIRST)
  const [entityType, setEntityType] = useState<'bids' | 'projects' | ''>('')
  const [entityId, setEntityId] = useState<string>('')

  // Step 2: Ticket and Drawing filters (both optional - can select ticket, drawing, both, or neither)
  const [ticketFilter, setTicketFilter] = useState('')
  const [drawingFilter, setDrawingFilter] = useState('')

  // Step 3: Assignee filter (REQUIRED)
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')

  // Other filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined)
  const [priorityFilter, setPriorityFilter] = useState<Priority | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'updatedAt' | 'createdAt'>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  // Temporary state for FilterDialog selections (used for fetching tickets/drawings while dialog is open)
  const [dialogEntityType, setDialogEntityType] = useState<'bids' | 'projects' | ''>('')
  const [dialogEntityId, setDialogEntityId] = useState<string>('')

  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Step 1: Fetch Bids and Projects for first dropdown
  const { data: bidsData, isLoading: isLoadingBids } = useBids({
    pageSize: 100,
  })
  const bids = bidsData?.data || []

  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({
    pageSize: 100,
  })
  const projects = projectsData?.data || []

  // Step 2: Fetch Tickets and Drawings
  // Use dialogEntityType/dialogEntityId when dialog is open (for preview)
  // Use entityType/entityId for actual applied filters
  const effectiveEntityType = dialogEntityType || entityType
  const effectiveEntityId = dialogEntityId || entityId
  const shouldFetchTicketsAndDrawings = !!(effectiveEntityType && effectiveEntityId)

  const {
    data: ticketsData,
    isLoading: isLoadingTickets,
    error: ticketsError,
  } = useTickets(
    shouldFetchTicketsAndDrawings
      ? {
          relatedTo: effectiveEntityType,
          [effectiveEntityType === 'bids' ? 'bidId' : 'projectId']: effectiveEntityId,
          pageSize: 100,
        }
      : undefined,
    {
      enabled: shouldFetchTicketsAndDrawings,
    }
  )
  const tickets = shouldFetchTicketsAndDrawings ? (ticketsData?.data || []) : []

  const {
    data: drawingsData,
    isLoading: isLoadingDrawings,
    error: drawingsError,
  } = useDrawings(
    shouldFetchTicketsAndDrawings
      ? {
          entityType: effectiveEntityType === 'bids' ? 'bid' : 'project',
          entityId: effectiveEntityId,
          pageSize: 100,
        }
      : undefined,
    {
      enabled: shouldFetchTicketsAndDrawings,
    }
  )
  const drawings = shouldFetchTicketsAndDrawings ? (drawingsData?.data || []) : []

  // Check for permission errors
  const hasTicketsPermissionError = ticketsError && (ticketsError as any)?.response?.status === 403
  const hasDrawingsPermissionError = drawingsError && (drawingsError as any)?.response?.status === 403

  // Step 3: Fetch users for assignee dropdown (filtered for Draftsman role)
  const { data: usersData, isLoading: isLoadingUsers } = useUsers()
  const draftsmen = usersData?.filter((user) => user.role.name === 'Draftsman') || []

  // Fetch Tasks with React Query
  // Role-based filtering is handled on the backend
  const { data, isLoading, error } = useTasks(
    {
      assigneeId: assigneeFilter || undefined,
      status: statusFilter,
      priority: priorityFilter,
      ticketId: ticketFilter || undefined,
      drawingId: drawingFilter || undefined,
      search: debouncedSearch,
      sortBy,
      sortDir,
      page,
      pageSize,
    },
    {
      enabled: true, // Always fetch - role-based filtering on backend
    },
  )

  // Mutations
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask()

  // Fetch task details for editing
  const { data: taskDetails } = useTask(editingTaskId || '', {
    enabled: !!editingTaskId,
  })

  // Filter tasks on frontend if entity is selected but no specific ticket/drawing
  // This shows all tasks related to the selected bid/project
  let tasks = data?.data || []
  if (entityType && entityId && !ticketFilter && !drawingFilter) {
    // Get all ticket IDs from the fetched tickets
    const ticketIds = tickets.map(t => t.id)
    const drawingIds = drawings.map(d => d.id)

    // Filter tasks to only those with a ticket or drawing from this entity
    tasks = tasks.filter(task => {
      if (task.ticket && ticketIds.includes(task.ticket.id)) return true
      if (task.drawing && drawingIds.includes(task.drawing.id)) return true
      return false
    })
  }

  // Use original pagination data from API, not filtered count
  const total = data?.pagination.total || 0
  const totalPages = data?.pagination.totalPages || 0

  // Reset dependent filters when entityType or entityId changes
  useEffect(() => {
    setTicketFilter('')
    setDrawingFilter('')
    setPage(1)
  }, [entityType, entityId])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, assigneeFilter, statusFilter, priorityFilter, ticketFilter, drawingFilter])

  // Build filter fields for FilterDialog
  // This function is called by FilterDialog with its current internal filter values
  // This allows the Entity dropdown to update when Type is changed inside the dialog
  const getFilterFields = (currentFilters: Record<string, string>): FilterField[] => {
    const selectedEntityType = currentFilters.entityType as 'bids' | 'projects' | ''
    const selectedEntityId = currentFilters.entityId

    return [
      {
        id: 'entityType',
        label: 'Related To',
        type: 'select' as const,
        options: [
          { value: 'bids', label: 'Bid' },
          { value: 'projects', label: 'Project' },
        ],
        placeholder: 'Select Bid or Project...',
      },
      {
        id: 'entityId',
        label: selectedEntityType === 'bids' ? 'Bid' : selectedEntityType === 'projects' ? 'Project' : 'Entity',
        type: 'select' as const,
        options:
          selectedEntityType === 'bids'
            ? bids.map((bid) => ({
                value: bid.id,
                label: `${bid.bidNumber}: ${bid.bidName}`,
              }))
            : selectedEntityType === 'projects'
              ? projects.map((project) => ({
                  value: project.id,
                  label: `${project.projectNumber}: ${project.projectName}`,
                }))
              : [],
        placeholder: !selectedEntityType ? 'First select type...' : isLoadingBids || isLoadingProjects ? 'Loading...' : 'Select...',
      },
      {
        id: 'ticketId',
        label: 'Ticket',
        type: 'searchable-select' as const,
        options: tickets.map((ticket) => ({
          value: ticket.id,
          label: `${ticket.ticketNumber}: ${ticket.ticketName}`,
          subtitle: `${ticket.status} • ${ticket.priority}`,
        })),
        placeholder: !selectedEntityType || !selectedEntityId ? 'Select entity first...' : 'Search tickets...',
      },
      {
        id: 'drawingId',
        label: 'Drawing',
        type: 'searchable-select' as const,
        options: drawings.map((drawing) => ({
          value: drawing.id,
          label: `${drawing.drawingNumber}: ${drawing.drawingName}`,
          subtitle: drawing.status,
        })),
        placeholder: !selectedEntityType || !selectedEntityId ? 'Select entity first...' : 'Search drawings...',
      },
      {
        id: 'assigneeId',
        label: 'Assignee',
        type: 'select' as const,
        options: draftsmen.map((user) => ({
          value: user.id,
          label: user.fullName,
        })),
        placeholder: 'Select Assignee...',
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
        placeholder: 'All Statuses',
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'select' as const,
        options: [
          { value: 'urgent', label: 'Urgent' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ],
        placeholder: 'All Priorities',
      },
      {
        id: 'search',
        label: 'Search',
        type: 'text' as const,
        placeholder: 'Search by title...',
      },
    ]
  }

  // Build active filters for chips
  const activeFilters: ActiveFilter[] = []

  if (entityType) {
    activeFilters.push({
      id: 'entityType',
      label: 'Type',
      value: entityType,
      displayValue: entityType === 'bids' ? 'Bid' : 'Project',
    })
  }

  if (entityId) {
    const entity =
      entityType === 'bids'
        ? bids.find((b) => b.id === entityId)
        : projects.find((p) => p.id === entityId)
    if (entity) {
      activeFilters.push({
        id: 'entityId',
        label: entityType === 'bids' ? 'Bid' : 'Project',
        value: entityId,
        displayValue:
          entityType === 'bids'
            ? `${(entity as any).bidNumber}: ${(entity as any).bidName}`
            : `${(entity as any).projectNumber}: ${(entity as any).projectName}`,
      })
    }
  }

  if (ticketFilter) {
    const ticket = tickets.find((t) => t.id === ticketFilter)
    if (ticket) {
      activeFilters.push({
        id: 'ticketId',
        label: 'Ticket',
        value: ticketFilter,
        displayValue: `${ticket.ticketNumber}: ${ticket.ticketName}`,
      })
    }
  }

  if (drawingFilter) {
    const drawing = drawings.find((d) => d.id === drawingFilter)
    if (drawing) {
      activeFilters.push({
        id: 'drawingId',
        label: 'Drawing',
        value: drawingFilter,
        displayValue: `${drawing.drawingNumber}: ${drawing.drawingName}`,
      })
    }
  }

  if (assigneeFilter) {
    const assignee = draftsmen.find((u) => u.id === assigneeFilter)
    if (assignee) {
      activeFilters.push({
        id: 'assigneeId',
        label: 'Assignee',
        value: assigneeFilter,
        displayValue: assignee.fullName,
      })
    }
  }

  if (statusFilter) {
    activeFilters.push({
      id: 'status',
      label: 'Status',
      value: statusFilter,
      displayValue: statusFilter.replace('_', ' '),
    })
  }

  if (priorityFilter) {
    activeFilters.push({
      id: 'priority',
      label: 'Priority',
      value: priorityFilter,
      displayValue: priorityFilter,
    })
  }

  if (searchQuery) {
    activeFilters.push({
      id: 'search',
      label: 'Search',
      value: searchQuery,
      displayValue: searchQuery,
    })
  }

  // Handlers
  const handleViewDetails = (id: string) => {
    router.push(`/tasks/${id}`)
  }

  const handleEditClick = (id: string) => {
    setEditingTaskId(id)
    setIsEditDrawerOpen(true)
  }

  const handleEditClose = () => {
    setIsEditDrawerOpen(false)
    setEditingTaskId(null)
  }

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setTaskToDelete(null)
        },
      })
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setTaskToDelete(null)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  // Handle filter changes inside dialog (for dynamic ticket/drawing fetching)
  const handleFilterChange = (filters: Record<string, string>) => {
    setDialogEntityType((filters.entityType as 'bids' | 'projects' | '') || '')
    setDialogEntityId(filters.entityId || '')
  }

  // Handle filter apply
  const handleApplyFilters = (filters: Record<string, string>) => {
    // Check if entityType or entityId changed to clear dependent fields
    const entityTypeChanged = filters.entityType !== entityType
    const entityIdChanged = filters.entityId !== entityId

    // Update all filter states
    setEntityType((filters.entityType as 'bids' | 'projects' | '') || '')
    setEntityId(filters.entityId || '')

    // Clear ticket and drawing if entity type or entity ID changed
    if (entityTypeChanged || entityIdChanged) {
      setTicketFilter('')
      setDrawingFilter('')
    } else {
      setTicketFilter(filters.ticketId || '')
      setDrawingFilter(filters.drawingId || '')
    }

    setAssigneeFilter(filters.assigneeId || '')
    setStatusFilter((filters.status as TaskStatus) || undefined)
    setPriorityFilter((filters.priority as Priority) || undefined)
    setSearchQuery(filters.search || '')

    // Clear dialog temporary state
    setDialogEntityType('')
    setDialogEntityId('')
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setEntityType('')
    setEntityId('')
    setTicketFilter('')
    setDrawingFilter('')
    setAssigneeFilter('')
    setStatusFilter(undefined)
    setPriorityFilter(undefined)
    setSearchQuery('')

    // Clear dialog temporary state
    setDialogEntityType('')
    setDialogEntityId('')
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

  const getPriorityBadgeColor = (priority: Priority | null) => {
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

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false
    return new Date(dueDate) < new Date()
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and track tasks assigned to team members.
            </p>
          </div>
          {hasPermission('tasks.create:add') && (
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => setIsCreateDrawerOpen(true)}
              >
                Create Task
              </button>
            </div>
          )}
        </div>

        {/* Filter Dialog */}
        <div className="mt-8">
          <FilterDialog
            fields={getFilterFields}
            activeFilters={activeFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            onFilterChange={handleFilterChange}
            triggerButtonText="Add Filter"
          />
        </div>

        {/* Permission Error for Tickets or Drawings */}
        {(hasTicketsPermissionError || hasDrawingsPermissionError) && (
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
                <h3 className="text-sm font-medium text-red-800">Permission Denied</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    You don't have permission to access{' '}
                    {hasTicketsPermissionError && hasDrawingsPermissionError
                      ? 'tickets and drawings'
                      : hasTicketsPermissionError
                        ? 'tickets'
                        : 'drawings'}
                    . Please contact your administrator to request the following permissions:
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {hasTicketsPermissionError && <li>tickets.view:list</li>}
                    {hasDrawingsPermissionError && <li>drawings.view:list</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
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
                <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{(error as any)?.message || 'An unexpected error occurred'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        {!isLoading && !error && tasks.length > 0 && (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        <button
                          onClick={() => handleSort('updatedAt')}
                          className="group inline-flex"
                        >
                          Title
                          {sortBy === 'updatedAt' && (
                            <span className="ml-2 flex-none rounded text-gray-400">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort('priority')}
                          className="group inline-flex"
                        >
                          Priority
                          {sortBy === 'priority' && (
                            <span className="ml-2 flex-none rounded text-gray-400">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort('dueDate')}
                          className="group inline-flex"
                        >
                          Due Date
                          {sortBy === 'dueDate' && (
                            <span className="ml-2 flex-none rounded text-gray-400">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Assignee
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                          <button
                            onClick={() => handleViewDetails(task.id)}
                            className="font-medium text-indigo-600 hover:text-indigo-900 text-left"
                          >
                            {task.title}
                          </button>
                          {task.ticket && (
                            <p className="text-gray-500 text-xs mt-1">
                              {task.ticket.ticketNumber}: {task.ticket.ticketName}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {task.ticket ? (
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              task.ticket.relatedTo === 'bids'
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                                : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            }`}>
                              {task.ticket.relatedTo === 'bids' ? 'Bid' : 'Project'}
                            </span>
                          ) : task.drawing ? (
                            <span className="text-gray-400 text-xs">Via Drawing</span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {task.priority && (
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-semibold' : ''}>
                            {formatDate(task.dueDate)}
                            {isOverdue(task.dueDate, task.status) && ' ⚠️'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {task.assignee?.fullName || 'Unassigned'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <button
                            onClick={() => handleViewDetails(task.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            View
                          </button>
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleEditClick(task.id)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(task)}
                                className="text-red-600 hover:text-red-900"
                                disabled={isDeleting}
                              >
                                Delete
                              </button>
                            </>
                          )}
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
        {!isLoading && !error && tasks.length === 0 && (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">No tasks match your current filters.</p>
          </div>
        )}
      </div>

      {/* Create Task Drawer */}
      <CreateTaskDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
      />

      {/* Edit Task Drawer */}
      <EditTaskDrawer
        isOpen={isEditDrawerOpen}
        onClose={handleEditClose}
        task={taskDetails || null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete task "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </AppLayout>
  )
}
