'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useTasksReport, useExportReport, useUsersCatalog, useBidsCatalog, useProjectsCatalog } from '@/hooks/use-reports'
import { useTickets } from '@/hooks/useTickets'
import { useDrawings } from '@/hooks/useDrawings'
import FilterDialog, { FilterField, ActiveFilter } from '@/components/common/FilterDialog'
import { MetricsCard, MetricsGrid } from '@/components/reports/MetricsCard'
import type { TasksFilterParams, ExportFormat } from '@/types/reports'
import CommonTable from '@/components/ui/CommonTable'
import type { ColumnDef } from '@/components/ui/CommonTable/types'

/**
 * Enhanced Tasks Report Page (Phase 5)
 *
 * Features:
 * - Advanced filtering with FilterPanel
 * - Multi-select dropdowns for statuses, priorities, assignees
 * - Filter chips display
 * - Debounced search
 * - Summary metrics cards
 * - Column sorting with visual indicators
 * - Drill-through links to tickets and drawings
 * - Export with progress indication
 */
export default function TasksReportPage() {
  const [filters, setFilters] = useState<TasksFilterParams>({
    limit: 25,
    sortBy: 'due_date',
    sortDir: 'asc',
  })
  const [showMetrics, setShowMetrics] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  // Fetch data
  const { data, isLoading, error } = useTasksReport(filters)
  const exportMutation = useExportReport()

  // Track dialog state for dynamic filtering
  const [dialogFilters, setDialogFilters] = useState<Record<string, string>>({})

  // Load catalogs for filters
  const { data: users } = useUsersCatalog()
  const { data: bids } = useBidsCatalog()
  const { data: projects } = useProjectsCatalog()

  // Determine which entity type/id to use for fetching tickets and drawings
  // Use dialog filters if available (for real-time preview), otherwise use applied filters
  const effectiveEntityType = (dialogFilters.entityType || filters.entityType) as 'bids' | 'projects' | undefined
  const effectiveEntityId = dialogFilters.entityId || (filters.entityIds && filters.entityIds.length > 0 ? filters.entityIds[0] : undefined)
  const shouldFetchTicketsAndDrawings = Boolean(effectiveEntityType && effectiveEntityId)

  // Fetch tickets filtered by entity (only when entity is selected)
  const { data: ticketsData } = useTickets(
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

  // Fetch drawings filtered by entity (only when entity is selected)
  const { data: drawingsData } = useDrawings(
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

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data?.data) return null

    const total = data.data.length
    const byStatus = data.data.reduce((acc, task) => {
      const status = task.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPriority = data.data.reduce((acc, task) => {
      const priority = task.priority || 'unknown'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const overdue = data.data.filter(
      task => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      pending: byStatus['pending'] || 0,
      inProgress: byStatus['in_progress'] || 0,
      completed: byStatus['completed'] || 0,
    }
  }, [data])

  // Update dialog filters when they change (for real-time ticket/drawing fetching)
  const handleDialogFiltersChange = (newFilters: Record<string, string>) => {
    setDialogFilters(newFilters)
  }

  // Filter configuration - returns FilterField[] for common FilterDialog
  const getFilterFields = (currentFilters: Record<string, string>): FilterField[] => {
    const selectedEntityType = currentFilters.entityType as 'bids' | 'projects' | ''
    const selectedEntityId = currentFilters.entityId

    return [
      {
        id: 'entityType',
        label: 'Type',
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
        type: 'searchable-select' as const,
        options:
          selectedEntityType === 'bids'
            ? (bids?.map((bid) => ({
              value: bid.id,
              label: `${bid.bid_number} - ${bid.bid_name}`,
            })) || [])
            : selectedEntityType === 'projects'
              ? (projects?.map((project) => ({
                value: project.id,
                label: `${project.project_number} - ${project.project_name}`,
              })) || [])
              : [],
        placeholder: !selectedEntityType ? 'First select type...' : 'Select...',
      },
      {
        id: 'ticketId',
        label: 'Ticket',
        type: 'searchable-select' as const,
        options: tickets?.map((ticket) => ({
          value: ticket.id,
          label: `${ticket.ticketNumber}: ${ticket.ticketName}`,
          subtitle: `${ticket.status} • ${ticket.priority}`,
        })) || [],
        placeholder: !selectedEntityType || !selectedEntityId ? 'Select entity first...' : 'Search tickets...',
      },
      {
        id: 'drawingId',
        label: 'Drawing',
        type: 'searchable-select' as const,
        options: drawings?.map((drawing) => ({
          value: drawing.id,
          label: `${drawing.drawingNumber}: ${drawing.drawingName}`,
          subtitle: drawing.status,
        })) || [],
        placeholder: !selectedEntityType || !selectedEntityId ? 'Select entity first...' : 'Search drawings...',
      },
      {
        id: 'assigneeId',
        label: 'Assignee',
        type: 'searchable-select' as const,
        options: users?.map((user) => ({
          value: user.id,
          label: user.full_name,
        })) || [],
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

  if (filters.entityType) {
    activeFilters.push({
      id: 'entityType',
      label: 'Type',
      value: filters.entityType,
      displayValue: filters.entityType === 'bids' ? 'Bid' : 'Project',
    })
  }

  if (filters.entityIds && filters.entityIds.length > 0 && filters.entityType) {
    const entityData = filters.entityType === 'bids' ? bids : projects
    const entity = entityData?.find((e) => e.id === filters.entityIds![0])
    if (entity) {
      const label = filters.entityType === 'bids' ? 'Bid' : 'Project'
      const displayValue = filters.entityType === 'bids'
        ? `${(entity as any).bid_number} - ${(entity as any).bid_name}`
        : `${(entity as any).project_number} - ${(entity as any).project_name}`

      activeFilters.push({
        id: 'entityId',
        label,
        value: filters.entityIds[0],
        displayValue,
      })
    }
  }

  if (filters.ticketIds && filters.ticketIds.length > 0) {
    // For simplicity, just show count since we can't easily get ticket data here
    activeFilters.push({
      id: 'ticketId',
      label: 'Ticket',
      value: filters.ticketIds[0],
      displayValue: `${filters.ticketIds.length} selected`,
    })
  }

  if (filters.drawingIds && filters.drawingIds.length > 0) {
    activeFilters.push({
      id: 'drawingId',
      label: 'Drawing',
      value: filters.drawingIds[0],
      displayValue: `${filters.drawingIds.length} selected`,
    })
  }

  if (filters.assigneeIds && filters.assigneeIds.length > 0) {
    const assignee = users?.find((u) => u.id === filters.assigneeIds![0])
    activeFilters.push({
      id: 'assigneeId',
      label: 'Assignee',
      value: filters.assigneeIds[0],
      displayValue: assignee ? assignee.full_name : filters.assigneeIds[0],
    })
  }

  if (filters.statuses && filters.statuses.length > 0) {
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    activeFilters.push({
      id: 'status',
      label: 'Status',
      value: filters.statuses[0],
      displayValue: statusLabels[filters.statuses[0]] || filters.statuses[0],
    })
  }

  if (filters.priorities && filters.priorities.length > 0) {
    const priorityLabels: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    }
    activeFilters.push({
      id: 'priority',
      label: 'Priority',
      value: filters.priorities[0],
      displayValue: priorityLabels[filters.priorities[0]] || filters.priorities[0],
    })
  }

  if (filters.q) {
    activeFilters.push({
      id: 'search',
      label: 'Search',
      value: filters.q,
      displayValue: filters.q,
    })
  }

  const handleApplyFilters = (newFilters: Record<string, string>) => {
    // Note: When user selects an entity (bid/project), we use the tickets loaded in the dropdown
    // to filter tasks by those ticket IDs (since backend doesn't support entityType/entityIds directly)

    let ticketIdsToFilter: string[] | undefined = undefined

    // If user selected a specific ticket, use that
    if (newFilters.ticketId) {
      ticketIdsToFilter = [newFilters.ticketId]
    }
    // If user selected an entity but no specific ticket, use all tickets for that entity
    else if (newFilters.entityType && newFilters.entityId && tickets && tickets.length > 0) {
      // Use the tickets already loaded via the useTickets hook when entity was selected
      ticketIdsToFilter = tickets.map(t => t.id)
    }

    setFilters(prev => ({
      ...prev,
      q: newFilters.search,
      entityType: newFilters.entityType as 'bids' | 'projects' | undefined,
      entityIds: newFilters.entityId ? [newFilters.entityId] : undefined,
      statuses: newFilters.status ? [newFilters.status] : undefined,
      priorities: newFilters.priority ? [newFilters.priority] : undefined,
      assigneeIds: newFilters.assigneeId ? [newFilters.assigneeId] : undefined,
      ticketIds: ticketIdsToFilter,
      drawingIds: newFilters.drawingId ? [newFilters.drawingId] : undefined,
      after: undefined,
    }))
  }

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    try {
      await exportMutation.mutateAsync({
        reportType: 'tasks',
        format,
        filters,
      })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      limit: 25,
      sortBy: 'due_date',
      sortDir: 'asc',
    })
  }

  // Badge class helpers
  const getStatusBadgeClass = (status: string | null | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status.toLowerCase()) {
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

  const getPriorityBadgeClass = (priority: string | null | undefined): string => {
    if (!priority) return 'bg-gray-100 text-gray-800'
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-gray-100 text-gray-800'
      case 'medium':
        return 'bg-blue-100 text-blue-800'
      case 'high':
        return 'bg-yellow-100 text-yellow-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Define columns for CommonTable
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'title',
      header: 'Task Title',
      accessor: 'title',
      sortable: true,
      width: '250px',
      cell: (row) => (
        <div>
          <Link href={`/tasks/${row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
            {row.title}
          </Link>
          {row.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      id: 'assignee_name',
      header: 'Assignee',
      accessor: 'assignee_name',
      sortable: true,
      width: '150px',
      cell: (row) => row.assignee_name ? (
        <span className="font-medium text-gray-900">{row.assignee_name}</span>
      ) : '—',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      align: 'center',
      width: '130px',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(row.status)}`}>
          {row.status ? row.status.replace('_', ' ') : '—'}
        </span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      align: 'center',
      width: '110px',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(row.priority)}`}>
          {row.priority || '—'}
        </span>
      ),
    },
    {
      id: 'ticket',
      header: 'Ticket',
      accessor: 'ticket_number',
      hideOnMobile: true,
      width: '180px',
      cell: (row) => (
        row.ticket_number ? (
          <div className="flex flex-col">
            <Link href={`/tickets/${row.ticket_id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              {row.ticket_number}
            </Link>
            {row.ticket_name && (
              <span className="text-xs text-gray-400 line-clamp-1">{row.ticket_name}</span>
            )}
          </div>
        ) : '—'
      ),
    },
    {
      id: 'drawing',
      header: 'Drawing',
      accessor: 'drawing_number',
      hideOnMobile: true,
      width: '180px',
      cell: (row) => (
        row.drawing_number ? (
          <div className="flex flex-col">
            <Link href={`/drawings/${row.drawing_id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              {row.drawing_number}
            </Link>
            {row.drawing_name && (
              <span className="text-xs text-gray-400 line-clamp-1">{row.drawing_name}</span>
            )}
          </div>
        ) : '—'
      ),
    },
    {
      id: 'due_date',
      header: 'Due Date',
      accessor: 'due_date',
      sortable: true,
      width: '130px',
      cell: (row) => {
        if (!row.due_date) return <span className="text-gray-400">—</span>
        const isOverdue = new Date(row.due_date) < new Date() && row.status !== 'completed'
        return (
          <div className="flex flex-col">
            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {new Date(row.due_date).toLocaleDateString()}
            </span>
            {isOverdue && <span className="text-xs text-red-500">Overdue</span>}
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Tasks Report</h2>
        <p className="mt-1 text-sm text-gray-600">
          Track task progress and workload across your organization
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <>
          <MetricsGrid columns={4} expanded={showMetrics}>
            <MetricsCard
              title="Total Tasks"
              value={metrics.total}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="blue"
            />
            <MetricsCard
              title="Pending"
              value={metrics.pending}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="yellow"
            />
            <MetricsCard
              title="In Progress"
              value={metrics.inProgress}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              color="blue"
            />
            <MetricsCard
              title="Completed"
              value={metrics.completed}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="green"
            />
          </MetricsGrid>
          {metrics.overdue > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">{metrics.overdue}</span> task{metrics.overdue !== 1 ? 's are' : ' is'} past the due date
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}


      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading tasks report</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please try refreshing the page or contact support if the problem persists.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading tasks report...</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && data && (
        <CommonTable
          columns={columns}
          data={data.data}
          rowKey="id"
          toolbar={{
            globalSearch: true,
            globalSearchPlaceholder: 'Search tasks...',
            filterToggle: true,
            clearFilters: true,
            densityToggle: true,
            columnVisibility: true,
            fullScreen: true,
            customActions: (
              <div className="flex items-center gap-2">
                {/* Show/Hide Metrics Toggle */}
                <button
                  onClick={() => setShowMetrics(!showMetrics)}
                  className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600"
                  title={showMetrics ? 'Hide Metrics' : 'Show Metrics'}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showMetrics ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    )}
                  </svg>
                  <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                    {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
                  </span>
                </button>

                {/* Advanced Filter Dialog */}
                <button
                  onClick={() => setShowFilterDialog(true)}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden relative ${activeFilters.length > 0 ? 'text-blue-600' : 'text-gray-600'}`}
                  title="Advanced Filters"
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                    Advanced Filters
                  </span>
                  {activeFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {/* Export CSV */}
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exportMutation.isPending}
                  className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export CSV"
                >
                  {exportMutation.isPending ? (
                    <svg className="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                    Export CSV
                  </span>
                </button>

                {/* Export Excel */}
                <button
                  onClick={() => handleExport('xlsx')}
                  disabled={exportMutation.isPending}
                  className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export Excel"
                >
                  {exportMutation.isPending ? (
                    <svg className="animate-spin h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                    Export Excel
                  </span>
                </button>
              </div>
            ),
          }}
         
          className="bg-white shadow rounded-lg overflow-hidden"
        />
      )}

      {/* Filter Dialog */}
      <FilterDialog
        fields={getFilterFields}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onFilterChange={handleDialogFiltersChange}
        visible={showFilterDialog}
        onHide={() => setShowFilterDialog(false)}
        hideTriggerButton={true}
      />
    </div>
  )
}
