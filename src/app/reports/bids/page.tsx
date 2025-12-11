'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useBidsReport, useExportReport, useUsersCatalog, useMainSystemsCatalog } from '@/hooks/use-reports'
import { ReportFilterDialog, ReportFilterField } from '@/components/reports/ReportFilterDialog'
import { MetricsCard, MetricsGrid } from '@/components/reports/MetricsCard'
import { ReportCharts } from '@/components/reports/ReportCharts'
import type { BidsFilterParams, ExportFormat } from '@/types/reports'
import CommonTable from '@/components/ui/CommonTable'
import type { ColumnDef } from '@/components/ui/CommonTable/types'

/**
 * Get current month start date in YYYY-MM-DD format
 */
function getCurrentMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Enhanced Bids Report Page (Phase 5)
 */
export default function BidsReportPage() {
  const [filters, setFilters] = useState<BidsFilterParams>({
    limit: 25,
    sortBy: 'created_at',
    sortDir: 'desc',
    closingDateFrom: getCurrentMonthStart(),
    closingDateTo: getCurrentDate(),
  })
  const [showCharts, setShowCharts] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

  const { data, isLoading, error } = useBidsReport(filters)
  const exportMutation = useExportReport()

  // Lazy load catalogs for filters - only when filter dialog opens
  const { data: users } = useUsersCatalog(undefined, { enabled: showFilterDialog })
  const { data: mainSystems } = useMainSystemsCatalog({ enabled: showFilterDialog })

  const metrics = useMemo(() => {
    if (!data?.data) return null
    const total = data.data.length
    const totalDrawings = data.data.reduce((sum, b) => sum + b.drawings_count, 0)
    const totalTickets = data.data.reduce((sum, b) => sum + b.tickets_count, 0)
    const avgDrawings = total > 0 ? Math.round(totalDrawings / total) : 0

    // Task counts
    const totalTasks = data.data.reduce((sum, b) => sum + b.tasks_count, 0)
    const totalPendingTasks = data.data.reduce((sum, b) => sum + b.tasks_pending_count, 0)
    const totalInProgressTasks = data.data.reduce((sum, b) => sum + b.tasks_in_progress_count, 0)
    const totalCompletedTasks = data.data.reduce((sum, b) => sum + b.tasks_completed_count, 0)
    const totalCancelledTasks = data.data.reduce((sum, b) => sum + b.tasks_cancelled_count, 0)

    return {
      total,
      totalDrawings,
      totalTickets,
      avgDrawings,
      totalTasks,
      totalPendingTasks,
      totalInProgressTasks,
      totalCompletedTasks,
      totalCancelledTasks
    }
  }, [data])

  const filterFields: ReportFilterField[] = [
    {
      name: 'q',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by bid number or name...',
      value: filters.q,
    },
    {
      name: 'industries',
      label: 'Industry',
      type: 'multiselect',
      options: [
        { value: 'Manufacturing', label: 'Manufacturing' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Education', label: 'Education' },
        { value: 'Commercial', label: 'Commercial' },
        { value: 'Residential', label: 'Residential' },
      ],
      value: filters.industries,
    },
    {
      name: 'bidManagerIds',
      label: 'Bid Manager',
      type: 'multiselect',
      options: users?.map(u => ({ value: u.id, label: u.full_name })) || [],
      value: filters.bidManagerIds,
    },
    {
      name: 'draftingManagerIds',
      label: 'Drafting Manager',
      type: 'multiselect',
      options: users?.map(u => ({ value: u.id, label: u.full_name })) || [],
      value: filters.draftingManagerIds,
    },
    {
      name: 'mainSystemIds',
      label: 'Main System',
      type: 'multiselect',
      options: mainSystems?.map(ms => ({ value: ms.id, label: `${ms.code} - ${ms.name}` })) || [],
      value: filters.mainSystemIds,
    },
    {
      name: 'closingDate',
      label: 'Bid Closing Date Range',
      type: 'daterange',
      value: filters.closingDateFrom,
    },
  ]

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.q) count++
    if (filters.industries && filters.industries.length > 0) count++
    if (filters.bidManagerIds && filters.bidManagerIds.length > 0) count++
    if (filters.draftingManagerIds && filters.draftingManagerIds.length > 0) count++
    if (filters.mainSystemIds && filters.mainSystemIds.length > 0) count++
    if (filters.closingDateFrom || filters.closingDateTo) count++
    return count
  }, [filters])

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      q: newFilters.q,
      industries: newFilters.industries,
      bidManagerIds: newFilters.bidManagerIds,
      draftingManagerIds: newFilters.draftingManagerIds,
      mainSystemIds: newFilters.mainSystemIds,
      closingDateFrom: newFilters.closingDateFrom,
      closingDateTo: newFilters.closingDateTo,
      after: undefined,
    }))
  }

  const handleExport = async (format: ExportFormat) => {
    try {
      await exportMutation.mutateAsync({ reportType: 'bids', format, filters })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      limit: 25,
      sortBy: 'created_at',
      sortDir: 'desc',
      closingDateFrom: getCurrentMonthStart(),
      closingDateTo: getCurrentDate(),
    })
    setShowFilterDialog(false)
  }

  // Define columns for CommonTable
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'bid_number',
      header: 'Bid #',
      accessor: 'bid_number',
      sortable: true,
      width: '150px',
      cell: (row) => (
        <Link href={`/bids/${row.id}/view`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
          {row.display_number || row.bid_number}
        </Link>
      ),
    },
    {
      id: 'bid_name',
      header: 'Name',
      accessor: 'bid_name',
      sortable: true,
      width: '200px',
    },
    {
      id: 'managers',
      header: 'Managers',
      accessor: (row) => row.bid_manager_name || row.drafting_manager_name,
      hideOnMobile: true,
      width: '200px',
      cell: (row) => (
        <div className="flex flex-col text-xs">
          {row.bid_manager_name && <span>BM: {row.bid_manager_name}</span>}
          {row.drafting_manager_name && <span>DM: {row.drafting_manager_name}</span>}
        </div>
      ),
    },
    {
      id: 'bid_closing_date',
      header: 'Closing Date',
      accessor: 'bid_closing_date',
      sortable: true,
      width: '130px',
      cell: (row) => row.bid_closing_date ? new Date(row.bid_closing_date).toLocaleDateString() : '—',
    },
    {
      id: 'drawings_count',
      header: 'Drawings',
      accessor: 'drawings_count',
      align: 'center',
      width: '100px',
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.drawings_count}
        </span>
      ),
    },
    {
      id: 'tickets_count',
      header: 'Tickets',
      accessor: 'tickets_count',
      align: 'center',
      width: '100px',
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {row.tickets_count}
        </span>
      ),
    },
    {
      id: 'tasks_count',
      header: 'Total Tasks',
      accessor: 'tasks_count',
      align: 'center',
      width: '110px',
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          {row.tasks_count}
        </span>
      ),
    },
    {
      id: 'tasks_pending',
      header: 'Pending Tasks',
      accessor: 'tasks_pending_count',
      align: 'center',
      hideOnMobile: true,
      width: '130px',
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          {row.tasks_pending_count}/{row.tasks_count}
        </span>
      ),
    },
    {
      id: 'tasks_in_progress',
      header: 'In Progress',
      accessor: 'tasks_in_progress_count',
      align: 'center',
      hideOnMobile: true,
      width: '130px',
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.tasks_in_progress_count}/{row.tasks_count}
        </span>
      ),
    },
    {
      id: 'tasks_completed',
      header: 'Completed',
      accessor: 'tasks_completed_count',
      align: 'center',
      hideOnMobile: true,
      width: '120px',
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {row.tasks_completed_count}/{row.tasks_count}
        </span>
      ),
    },
    {
      id: 'industry',
      header: 'Industry',
      accessor: 'industry',
      hideOnMobile: true,
      width: '150px',
      cell: (row) => row.industry || '—',
    },
    {
      id: 'location',
      header: 'Location',
      accessor: (row) => row.city_town && row.country ? `${row.city_town}, ${row.country}` : '—',
      hideOnMobile: true,
      width: '180px',
    },
  ], [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Bids Report</h2>
        <p className="mt-1 text-sm text-gray-600">View bids data, metrics, and performance</p>
      </div>

      {metrics && (
        <MetricsGrid expanded={showMetrics}>
          <MetricsCard title="Total Bids" value={metrics.total} />
          <MetricsCard title="Total Drawings" value={metrics.totalDrawings} />
          <MetricsCard title="Total Tickets" value={metrics.totalTickets} />
          <MetricsCard title="Total Tasks" value={metrics.totalTasks} />
          <MetricsCard title="Pending Tasks" value={metrics.totalPendingTasks} />
          <MetricsCard title="In Progress" value={metrics.totalInProgressTasks} />
          <MetricsCard title="Completed Tasks" value={metrics.totalCompletedTasks} />
          <MetricsCard title="Cancelled Tasks" value={metrics.totalCancelledTasks} />
        </MetricsGrid>
      )}

      <ReportFilterDialog
        visible={showFilterDialog}
        onHide={() => setShowFilterDialog(false)}
        fields={filterFields}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex"><div className="flex-shrink-0"><svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Error loading bids report</h3><p className="mt-2 text-sm text-red-700">Please try refreshing the page.</p></div></div>
        </div>
      )}

      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading bids report...</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <CommonTable
          columns={columns}
          data={data.data}
          rowKey="id"
          toolbar={{
            globalSearch: true,
            globalSearchPlaceholder: 'Search bids...',
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

                {/* View Charts */}
                <button
                  onClick={() => setShowCharts(true)}
                  disabled={!data?.data || data.data.length === 0}
                  className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View Charts"
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                    View Charts
                  </span>
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

      {/* Charts Modal */}
      {showCharts && data?.data && (
        <ReportCharts
          reportType="bids"
          data={data.data}
          onClose={() => setShowCharts(false)}
        />
      )}
    </div>
  )
}
