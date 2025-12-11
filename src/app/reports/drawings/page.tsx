'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  useDrawingsReport,
  useExportReport,
  useDrawingTypesCatalog,
  useMainSystemsCatalog,
  useSubSystemsCatalog,
  useBidsCatalog,
  useProjectsCatalog
} from '@/hooks/use-reports'
import { ReportFilterDialog, ReportFilterField } from '@/components/reports/ReportFilterDialog'
import { MetricsCard, MetricsGrid } from '@/components/reports/MetricsCard'
import { ReportCharts } from '@/components/reports/ReportCharts'
import type { DrawingsFilterParams, ExportFormat, DrawingReportItem } from '@/types/reports'
import CollapsibleCommonTable from '@/components/ui/CollapsibleCommonTable'
import type { ColumnDef } from '@/components/ui/CommonTable/types'
import { DrawingUserStats } from './DrawingUserStats'

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
 * Enhanced Drawings Report Page (Phase 5)
 *
 * Features:
 * - Advanced filtering with FilterPanel
 * - Multi-select dropdowns with search (5 item limit)
 * - Auto-populated date filters (current month)
 * - Summary metrics cards
 * - Column sorting
 * - Export capabilities
 * - Collapsible rows for user stats
 */
export default function DrawingsReportPage() {
  const [filters, setFilters] = useState<DrawingsFilterParams>({
    limit: 25,
    sortBy: 'created_at',
    sortDir: 'desc',
    submissionDateFrom: getCurrentMonthStart(),
    submissionDateTo: getCurrentDate(),
  })
  const [showCharts, setShowCharts] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

  const { data, isLoading, error } = useDrawingsReport(filters)
  const exportMutation = useExportReport()

  // Lazy load catalogs for filters - only when filter dialog opens
  const { data: drawingTypes } = useDrawingTypesCatalog({ enabled: showFilterDialog })
  const { data: mainSystems } = useMainSystemsCatalog({ enabled: showFilterDialog })
  const { data: subSystems } = useSubSystemsCatalog(undefined, { enabled: showFilterDialog })
  const { data: bids } = useBidsCatalog({ enabled: showFilterDialog })
  const { data: projects } = useProjectsCatalog({ enabled: showFilterDialog })

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data?.data) return null

    const total = data.data.length
    const byStatus = data.data.reduce((acc, drawing) => {
      const status = drawing.drawing_status || 'Open'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byEntityType = data.data.reduce((acc, drawing) => {
      acc[drawing.entity_type] = (acc[drawing.entity_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      fromBids: byEntityType['bid'] || 0,
      fromProjects: byEntityType['project'] || 0,
      open: byStatus['Open'] || 0,
      approved: byStatus['Approved'] || 0,
    }
  }, [data])

  // Filter fields configuration for dialog
  const filterFields: ReportFilterField[] = [
    {
      name: 'q',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by drawing number, name, or entity...',
      value: filters.q,
    },
    {
      name: 'entityType',
      label: 'Entity Type',
      type: 'select',
      options: [
        { value: 'bid', label: 'Bid' },
        { value: 'project', label: 'Project' },
      ],
      value: filters.entityType,
    },
    {
      name: 'statuses',
      label: 'Status',
      type: 'multiselect',
      options: [
        { value: 'Open', label: 'Open' },
        { value: 'Designing', label: 'Designing' },
        { value: 'Internal review', label: 'Internal Review' },
        { value: 'Internal revision', label: 'Internal Revision' },
        { value: 'Internal Approval', label: 'Internal Approval' },
        { value: 'Submitted', label: 'Submitted' },
        { value: 'On review', label: 'On Review' },
        { value: 'Revision ongoing', label: 'Revision Ongoing' },
        { value: 'Approved', label: 'Approved' },
      ],
      value: filters.statuses,
    },
    {
      name: 'drawingTypeIds',
      label: 'Drawing Type',
      type: 'multiselect',
      options: drawingTypes?.map(dt => ({ value: dt.id, label: dt.name })) || [],
      value: filters.drawingTypeIds,
    },
    {
      name: 'mainSystemIds',
      label: 'Main System',
      type: 'multiselect',
      options: mainSystems?.map(ms => ({ value: ms.id, label: `${ms.code} - ${ms.name}` })) || [],
      value: filters.mainSystemIds,
    },
    {
      name: 'subSystemIds',
      label: 'Sub System',
      type: 'multiselect',
      options: subSystems?.map(ss => ({ value: ss.id, label: `${ss.code} - ${ss.name}` })) || [],
      value: filters.subSystemIds,
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
      name: 'submissionDate',
      label: 'Planned Submission Date',
      type: 'daterange',
      value: filters.submissionDateFrom,
    },
  ]

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.q) count++
    if (filters.entityType) count++
    if (filters.statuses && filters.statuses.length > 0) count++
    if (filters.drawingTypeIds && filters.drawingTypeIds.length > 0) count++
    if (filters.mainSystemIds && filters.mainSystemIds.length > 0) count++
    if (filters.subSystemIds && filters.subSystemIds.length > 0) count++
    if (filters.bidIds && filters.bidIds.length > 0) count++
    if (filters.projectIds && filters.projectIds.length > 0) count++
    if (filters.submissionDateFrom || filters.submissionDateTo) count++
    return count
  }, [filters])

  const handleExport = async (format: ExportFormat) => {
    try {
      await exportMutation.mutateAsync({
        reportType: 'drawings',
        format,
        filters,
      })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      q: newFilters.q,
      entityType: newFilters.entityType,
      statuses: newFilters.statuses,
      drawingTypeIds: newFilters.drawingTypeIds,
      mainSystemIds: newFilters.mainSystemIds,
      subSystemIds: newFilters.subSystemIds,
      bidIds: newFilters.bidIds,
      projectIds: newFilters.projectIds,
      submissionDateFrom: newFilters.submissionDateFrom,
      submissionDateTo: newFilters.submissionDateTo,
      after: undefined,
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      limit: 25,
      sortBy: 'created_at',
      sortDir: 'desc',
      submissionDateFrom: getCurrentMonthStart(),
      submissionDateTo: getCurrentDate(),
    })
  }

  // Define columns for CommonTable
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'planned_submission_date',
      header: 'Date',
      accessor: 'planned_submission_date',
      sortable: true,
      width: '120px',
      cell: (row) => row.planned_submission_date ? new Date(row.planned_submission_date).toLocaleDateString() : '—',
    },
    {
      id: 'entity_type',
      header: 'Related Entity',
      accessor: 'entity_type',
      hideOnMobile: true,
      width: '150px',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium capitalize">{row.entity_type}</span>
          <span className="text-xs text-gray-400">{row.entity_display_number || row.entity_number}</span>
        </div>
      ),
    },
    {
      id: 'system',
      header: 'System',
      accessor: 'main_system_name',
      hideOnMobile: true,
      width: '180px',
      cell: (row) =>
        row.main_system_name ? (
          <div className="flex flex-col">
            <span>{row.main_system_name}</span>
            {row.sub_system_name && <span className="text-xs text-gray-400">→ {row.sub_system_name}</span>}
          </div>
        ) : (
          '—'
        ),
    },
    {
      id: 'drawing_name',
      header: 'Drawing Name',
      accessor: 'drawing_name',
      sortable: true,
      width: '200px',
    },
    {
      id: 'drawing_number',
      header: 'Drawing Number',
      accessor: 'drawing_number',
      sortable: true,
      width: '150px',
      cell: (row) => (
        <Link href={`/reports/drawings/${row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
          {row.drawing_number}
        </Link>
      ),
    },
    {
      id: 'revision_status',
      header: 'Revision / Status',
      accessor: 'revision_status',
      hideOnMobile: true,
      width: '180px',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Rev {row.revisionVersion || 0}</span>
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
            {row.drawing_status}
          </span>
        </div>
      ),
    },
    {
      id: 'drawing_type_name',
      header: 'Type',
      accessor: 'drawing_type_name',
      hideOnMobile: true,
      width: '150px',
      cell: (row) => row.drawing_type_name || '—',
    },
    {
      id: 'progress_percentage',
      header: 'Progress',
      accessor: 'progress_percentage',
      sortable: true,
      hideOnMobile: true,
      width: '120px',
      cell: (row) => {
        const progress = row.progress_percentage
        return progress !== null && progress !== undefined ? (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      },
    },
    {
      id: 'reviewed_by_name',
      header: 'Reviewed By',
      accessor: 'reviewed_by_name',
      hideOnMobile: true,
      width: '150px',
      cell: (row) => row.reviewed_by_name || '—',
    },
    {
      id: 'total_days_worked',
      header: 'Total Days',
      accessor: 'total_days_worked',
      sortable: true,
      hideOnMobile: true,
      width: '110px',
      cell: (row) => row.total_days_worked || '0',
    },
    {
      id: 'total_duration_hours',
      header: 'Duration (Hours)',
      accessor: 'total_duration_hours',
      sortable: true,
      hideOnMobile: true,
      width: '140px',
      cell: (row) => {
        const hours = row.total_duration_hours
        return hours ? `${Number(hours).toFixed(2)}h` : '0h'
      },
    },
  ], [])

  // Render expanded row content
  const renderExpandedRow = (row: DrawingReportItem) => {
    return <DrawingUserStats drawingId={row.id} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Drawings Report</h2>
        <p className="mt-1 text-sm text-gray-600">View drawing data, metrics, and performance</p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <MetricsGrid columns={4} expanded={showMetrics}>
          <MetricsCard title="Total Drawings" value={metrics.total} color="blue"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} />
          <MetricsCard title="From Bids" value={metrics.fromBids} color="green"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <MetricsCard title="From Projects" value={metrics.fromProjects} color="yellow"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <MetricsCard title="Approved" value={metrics.approved} color="gray"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </MetricsGrid>
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
              <h3 className="text-sm font-medium text-red-800">Error loading drawings report</h3>
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
          <p className="text-gray-600">Loading drawings report...</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && data && (
        <CollapsibleCommonTable
          columns={columns}
          data={data.data}
          rowKey="id"
          renderExpandedRow={renderExpandedRow}
          toolbar={{
            globalSearch: true,
            globalSearchPlaceholder: 'Search drawings...',
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
          reportType="drawings"
          data={data.data}
          onClose={() => setShowCharts(false)}
        />
      )}
    </div>
  )
}
