'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTicketsReport, useExportReport, useUsersCatalog, useBidsCatalog, useProjectsCatalog } from '@/hooks/use-reports'
import { ReportFilterDialog, ReportFilterField } from '@/components/reports/ReportFilterDialog'
import { MetricsCard, MetricsGrid } from '@/components/reports/MetricsCard'
import type { TicketsFilterParams, ExportFormat } from '@/types/reports'
import CommonTable from '@/components/ui/CommonTable'
import type { ColumnDef } from '@/components/ui/CommonTable/types'

/**
 * Enhanced Tickets Report Page (Phase 5)
 *
 * Features:
 * - Advanced filtering with FilterPanel
 * - Multi-select dropdowns for statuses, priorities, assignees
 * - Filter chips display
 * - Debounced search
 * - Summary metrics cards
 * - Column sorting with visual indicators
 * - Drill-through links to related entities
 * - Export with progress indication
 */
export default function TicketsReportPage() {
  const [filters, setFilters] = useState<TicketsFilterParams>({
    limit: 25,
    sortBy: 'created_at',
    sortDir: 'desc',
  })
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

  // Fetch data
  const { data, isLoading, error } = useTicketsReport(filters)
  const exportMutation = useExportReport()

  // Lazy load catalogs for filters - only when filter dialog opens
  const { data: users } = useUsersCatalog(undefined, { enabled: showFilterDialog })
  const { data: bids } = useBidsCatalog({ enabled: showFilterDialog })
  const { data: projects } = useProjectsCatalog({ enabled: showFilterDialog })

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data?.data) return null

    const total = data.data.length
    const byStatus = data.data.reduce((acc, ticket) => {
      const status = ticket.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPriority = data.data.reduce((acc, ticket) => {
      const priority = ticket.priority || 'unknown'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byRelatedTo = data.data.reduce((acc, ticket) => {
      acc[ticket.related_to] = (acc[ticket.related_to] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const overdue = data.data.filter(
      ticket => ticket.due_date && new Date(ticket.due_date) < new Date() &&
                ticket.status !== 'completed' && ticket.status !== 'cancelled'
    ).length

    return {
      total,
      byStatus,
      byPriority,
      byRelatedTo,
      overdue,
      fromBids: byRelatedTo['bids'] || 0,
      fromProjects: byRelatedTo['projects'] || 0,
      pending: byStatus['pending'] || 0,
      ongoing: byStatus['ongoing'] || 0,
    }
  }, [data])

  // Filter configuration
  const filterFields: ReportFilterField[] = [
    {
      name: 'q',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by ticket number, name, or description...',
      value: filters.q,
    },
    {
      name: 'relatedTo',
      label: 'Related To',
      type: 'select',
      options: [
        { value: 'bids', label: 'Bids' },
        { value: 'projects', label: 'Projects' },
      ],
      value: filters.relatedTo,
    },
    {
      name: 'statuses',
      label: 'Status',
      type: 'multiselect',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'ongoing', label: 'Ongoing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      value: filters.statuses,
    },
    {
      name: 'priorities',
      label: 'Priority',
      type: 'multiselect',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
      value: filters.priorities,
    },
    {
      name: 'assigneeIds',
      label: 'Assignee',
      type: 'multiselect',
      options: users?.map(u => ({ value: u.id, label: u.full_name })) || [],
      value: filters.assigneeIds,
    },
    {
      name: 'bidIds',
      label: 'Bid',
      type: 'multiselect',
      options: bids?.map(b => ({ value: b.id, label: `${b.bid_number} - ${b.bid_name}` })) || [],
      value: filters.bidIds,
    },
    {
      name: 'projectIds',
      label: 'Project',
      type: 'multiselect',
      options: projects?.map(p => ({ value: p.id, label: `${p.project_number} - ${p.project_name}` })) || [],
      value: filters.projectIds,
    },
    {
      name: 'dueDate',
      label: 'Due Date Range',
      type: 'daterange',
      value: filters.dueDateFrom,
    },
  ]

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.q) count++
    if (filters.relatedTo) count++
    if (filters.statuses && filters.statuses.length > 0) count++
    if (filters.priorities && filters.priorities.length > 0) count++
    if (filters.assigneeIds && filters.assigneeIds.length > 0) count++
    if (filters.bidIds && filters.bidIds.length > 0) count++
    if (filters.projectIds && filters.projectIds.length > 0) count++
    if (filters.dueDateFrom || filters.dueDateTo) count++
    return count
  }, [filters])

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      q: newFilters.q,
      relatedTo: newFilters.relatedTo,
      statuses: newFilters.statuses,
      priorities: newFilters.priorities,
      assigneeIds: newFilters.assigneeIds,
      bidIds: newFilters.bidIds,
      projectIds: newFilters.projectIds,
      dueDateFrom: newFilters.dueDateFrom,
      dueDateTo: newFilters.dueDateTo,
      after: undefined,
    }))
  }

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    try {
      await exportMutation.mutateAsync({
        reportType: 'tickets',
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
      sortBy: 'created_at',
      sortDir: 'desc',
    })
    setShowFilterDialog(false)
  }

  // Badge severity class helpers
  const getStatusBadgeClass = (status: string | null | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'ongoing':
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
      id: 'ticket_number',
      header: 'Ticket #',
      accessor: 'ticket_number',
      sortable: true,
      width: '130px',
      cell: (row) => (
        <Link href={`/tickets/${row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
          {row.display_number || row.ticket_number}
        </Link>
      ),
    },
    {
      id: 'ticket_name',
      header: 'Name',
      accessor: 'ticket_name',
      sortable: true,
      width: '220px',
      cell: (row) => (
        <div>
          <div>{row.ticket_name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      id: 'related_to',
      header: 'Related To',
      accessor: 'related_to',
      width: '180px',
      cell: (row) => (
        row.related_to === 'bids' && row.bid_number ? (
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Bid</span>
            <Link href={`/bids/${row.bid_id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              {row.bid_number}
            </Link>
          </div>
        ) : row.related_to === 'projects' && row.project_number ? (
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Project</span>
            <Link href={`/projects/${row.project_id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              {row.project_number}
            </Link>
          </div>
        ) : (
          <span className="capitalize">{row.related_to}</span>
        )
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      align: 'center',
      width: '120px',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(row.status)}`}>
          {row.status}
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
          {row.priority}
        </span>
      ),
    },
    {
      id: 'assignee_name',
      header: 'Assignee',
      accessor: 'assignee_name',
      sortable: true,
      hideOnMobile: true,
      width: '150px',
      cell: (row) => row.assignee_name || '—',
    },
    {
      id: 'due_date',
      header: 'Due Date',
      accessor: 'due_date',
      sortable: true,
      width: '130px',
      cell: (row) => {
        if (!row.due_date) return <span className="text-gray-400">—</span>
        const isOverdue = new Date(row.due_date) < new Date() &&
          row.status !== 'completed' && row.status !== 'cancelled'
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
        <h2 className="text-2xl font-semibold text-gray-900">Tickets Report</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and analyze tickets across bids and projects
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <>
          <MetricsGrid columns={4} expanded={showMetrics}>
            <MetricsCard
              title="Total Tickets"
              value={metrics.total}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              }
              color="blue"
            />
            <MetricsCard
              title="From Bids"
              value={metrics.fromBids}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              color="green"
            />
            <MetricsCard
              title="From Projects"
              value={metrics.fromProjects}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              color="yellow"
            />
            <MetricsCard
              title="Overdue"
              value={metrics.overdue}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              color="red"
              description={metrics.overdue > 0 ? `${metrics.pending} pending, ${metrics.ongoing} ongoing` : undefined}
            />
          </MetricsGrid>
        </>
      )}

      {/* Filter Dialog */}
      <ReportFilterDialog
        visible={showFilterDialog}
        onHide={() => setShowFilterDialog(false)}
        fields={filterFields}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

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
              <h3 className="text-sm font-medium text-red-800">Error loading tickets report</h3>
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
          <p className="text-gray-600">Loading tickets report...</p>
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
            globalSearchPlaceholder: 'Search tickets...',
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
                  className={`group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden relative ${activeFilterCount > 0 ? 'text-blue-600' : 'text-gray-600'}`}
                  title="Advanced Filters"
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                    Advanced Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                      {activeFilterCount}
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
    </div>
  )
}
