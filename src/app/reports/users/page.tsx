'use client'

import { useState, useMemo } from 'react'
import { useUsersReport, useExportReport, useRolesCatalog } from '@/hooks/use-reports'
import { ReportFilterDialog, ReportFilterField } from '@/components/reports/ReportFilterDialog'
import { MetricsCard, MetricsGrid } from '@/components/reports/MetricsCard'
import type { UsersFilterParams, ExportFormat, UserWorkloadItem } from '@/types/reports'
import CommonTable from '@/components/ui/CommonTable'
import type { ColumnDef } from '@/components/ui/CommonTable/types'

/**
 * Users Report Page - Phase 5 Enhanced
 *
 * Displays user workload metrics with advanced filtering, metrics cards, and sorting
 *
 * Features:
 * - FilterPanel with 5 filters (search, roles, departments, isActive, per page)
 * - 4 MetricsCards (Total Users, Active Users, Total Tasks Assigned, Total Tickets via Timesheet Hours)
 * - Column sorting on full_name, email, role_name
 * - Status badges for active/inactive
 * - Count badges for tasks (no drill-through)
 * - Load More pagination
 * - Export to CSV/XLSX with loading states
 */
export default function UsersReportPage() {
  const [filters, setFilters] = useState<UsersFilterParams>({
    limit: 25,
    sortBy: 'full_name',
    sortDir: 'asc',
  })
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

  const { data, isLoading, error } = useUsersReport(filters)
  const exportMutation = useExportReport()

  // Lazy load catalogs for filters - only when filter dialog opens
  const { data: roles } = useRolesCatalog({ enabled: showFilterDialog })

  // Extract unique departments from the data
  const departments = useMemo(() => {
    if (!data?.data) return []
    const uniqueDepts = new Set<string>()
    data.data.forEach(user => {
      if (user.department) uniqueDepts.add(user.department)
    })
    return Array.from(uniqueDepts).sort().map(dept => ({ value: dept, label: dept }))
  }, [data])

  // Calculate metrics from current page data
  const metrics = useMemo(() => {
    if (!data?.data) return null

    const total = data.data.length
    const activeUsers = data.data.filter(u => u.is_active).length
    const totalTasksAssigned = data.data.reduce((sum, u) => sum + (u.tasks_total_count || 0), 0)
    const totalTimesheetHours = data.data.reduce((sum, u) => sum + (Number(u.timesheet_total_hours) || 0), 0)

    return {
      total,
      activeUsers,
      totalTasksAssigned,
      totalTimesheetHours,
    }
  }, [data])

  const handleExport = async (format: ExportFormat) => {
    try {
      await exportMutation.mutateAsync({
        reportType: 'users',
        format,
        filters,
      })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      limit: 25,
      sortBy: 'full_name',
      sortDir: 'asc',
    })
    setShowFilterDialog(false)
  }

  // Task status breakdown helper
  const getTaskBreakdown = (user: UserWorkloadItem) => {
    const parts = []
    if (user.tasks_pending_count > 0) parts.push(`${user.tasks_pending_count} Pending`)
    if (user.tasks_in_progress_count > 0) parts.push(`${user.tasks_in_progress_count} In Progress`)
    if (user.tasks_completed_count > 0) parts.push(`${user.tasks_completed_count} Completed`)
    return parts.join(' · ')
  }

  // Define columns for CommonTable
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'full_name',
      header: 'User',
      accessor: 'full_name',
      sortable: true,
      width: '180px',
      cell: (row) => <div className="text-sm font-medium text-gray-900">{row.full_name}</div>,
    },
    {
      id: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
      width: '220px',
    },
    {
      id: 'role_name',
      header: 'Role',
      accessor: 'role_name',
      sortable: true,
      hideOnMobile: true,
      width: '150px',
      cell: (row) => row.role_name || '—',
    },
    {
      id: 'department',
      header: 'Department',
      accessor: 'department',
      hideOnMobile: true,
      width: '150px',
      cell: (row) => row.department || '—',
    },
    {
      id: 'is_active',
      header: 'Status',
      accessor: 'is_active',
      align: 'center',
      width: '110px',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'tasks_total_count',
      header: 'Tasks',
      accessor: 'tasks_total_count',
      align: 'right',
      width: '180px',
      cell: (row) => (
        <div className="flex flex-col items-end">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {row.tasks_total_count} Total
          </span>
          {row.tasks_total_count > 0 && (
            <span className="mt-1 text-xs text-gray-500">
              {getTaskBreakdown(row)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'timesheet_total_hours',
      header: 'Timesheet Hours',
      accessor: 'timesheet_total_hours',
      align: 'right',
      hideOnMobile: true,
      width: '150px',
      cell: (row) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">
            {(Number(row.timesheet_total_hours) || 0).toFixed(1)}h
          </span>
          {(Number(row.timesheet_approved_hours) || 0) > 0 && (
            <span className="text-xs text-gray-500">
              {(Number(row.timesheet_approved_hours) || 0).toFixed(1)}h approved
            </span>
          )}
        </div>
      ),
    },
  ], [getTaskBreakdown])

  // Filter configuration
  const filterFields: ReportFilterField[] = [
    {
      name: 'q',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name or email...',
      value: filters.q,
    },
    {
      name: 'roleIds',
      label: 'Roles',
      type: 'multiselect',
      options: roles?.map(r => ({ value: r.id, label: r.name })) || [],
      value: filters.roleIds,
    },
    {
      name: 'departments',
      label: 'Departments',
      type: 'multiselect',
      options: departments,
      value: filters.departments,
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
      value: filters.isActive === undefined ? '' : String(filters.isActive),
    },
  ]

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.q) count++
    if (filters.roleIds && filters.roleIds.length > 0) count++
    if (filters.departments && filters.departments.length > 0) count++
    if (filters.isActive !== undefined) count++
    return count
  }, [filters])

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      q: newFilters.q,
      roleIds: newFilters.roleIds,
      departments: newFilters.departments,
      isActive: newFilters.isActive === '' ? undefined : newFilters.isActive === 'true',
      after: undefined,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Users Workload Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            Track user workload, task counts, and timesheet hours with advanced filtering
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <MetricsGrid columns={4} expanded={showMetrics}>
          <MetricsCard
            title="Total Users"
            value={metrics.total}
            color="blue"
            description="Users in current filter"
          />
          <MetricsCard
            title="Active Users"
            value={metrics.activeUsers}
            color="green"
            description={`${metrics.total - metrics.activeUsers} inactive`}
          />
          <MetricsCard
            title="Total Tasks Assigned"
            value={metrics.totalTasksAssigned}
            color="yellow"
            description="Across all users"
          />
          <MetricsCard
            title="Total Timesheet Hours"
            value={`${metrics.totalTimesheetHours.toFixed(1)}h`}
            color="gray"
            description="Approved + pending hours"
          />
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Error loading users report. Please try again.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading users report...</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && data && (
        <CommonTable
          columns={columns}
          data={data.data}
          rowKey="user_id"
          toolbar={{
            globalSearch: true,
            globalSearchPlaceholder: 'Search users...',
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
          // emptyMessage={
          //   <div className="text-center py-12">
          //     <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          //     </svg>
          //     <p className="text-sm text-gray-500">No users found matching your filters</p>
          //     {activeFilterCount > 0 && (
          //       <button
          //         onClick={handleClearFilters}
          //         className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          //       >
          //         Clear filters
          //       </button>
          //     )}
          //   </div>
          // }
          rowClassName={(rowData) => !rowData.is_active ? 'opacity-60' : ''}
          className="bg-white shadow rounded-lg overflow-hidden"
        />
      )}
    </div>
  )
}
