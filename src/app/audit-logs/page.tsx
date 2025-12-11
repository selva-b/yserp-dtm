'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ViewDiffDrawer from '@/components/audit-logs/ViewDiffDrawer'
import ExportButton from '@/components/audit-logs/ExportButton'
import EntityLink from '@/components/audit-logs/EntityLink'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { useDebounce } from '@/hooks/use-debounce'
import { AuditOutcome, type AuditLogQueryParams } from '@/services/audit-logs.service'

/**
 * Audit Logs List Page
 *
 * Features:
 * - List with pagination
 * - Global search across multiple fields
 * - Multi-filter support (module, action, outcome, date range, etc.)
 * - Sort by created_at, module, action, outcome
 * - View details drawer with diff
 * - Export to CSV/XLSX
 * - RBAC: audit_logs.view:list (Admin only)
 * - Performance Target: P95 ≤1.5s
 *
 * Actions:
 * - View diff (drawer)
 * - Export (CSV/XLSX with filters)
 * - Drill-through to source records
 */
export default function AuditLogsPage() {
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState<AuditOutcome | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Sorting
  const [sortBy, setSortBy] = useState<'created_at' | 'module' | 'action' | 'outcome'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Diff drawer state
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(null)
  const [isDiffDrawerOpen, setIsDiffDrawerOpen] = useState(false)

  // Open diff drawer
  const handleViewDiff = (auditLogId: string) => {
    setSelectedAuditLogId(auditLogId)
    setIsDiffDrawerOpen(true)
  }

  // Close diff drawer
  const handleCloseDiffDrawer = () => {
    setIsDiffDrawerOpen(false)
    // Delay clearing the ID to allow drawer animation to complete
    setTimeout(() => setSelectedAuditLogId(null), 300)
  }

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Build query params
  const queryParams: AuditLogQueryParams = {
    page,
    pageSize,
    q: debouncedSearch || undefined,
    module: moduleFilter || undefined,
    action: actionFilter || undefined,
    outcome: outcomeFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    actorUserId: actorUserId || undefined,
    entityType: entityType || undefined,
    entityId: entityId || undefined,
    sortBy,
    sortDir,
  }

  // Fetch audit logs
  const { data, isLoading, error, refetch } = useAuditLogs(queryParams)

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: any) => void) => (value: any) => {
    setter(value)
    setPage(1)
  }

  // Toggle sort direction
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
    setPage(1)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setModuleFilter('')
    setActionFilter('')
    setOutcomeFilter('')
    setStartDate('')
    setEndDate('')
    setActorUserId('')
    setEntityType('')
    setEntityId('')
    setPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery ||
    moduleFilter ||
    actionFilter ||
    outcomeFilter ||
    startDate ||
    endDate ||
    actorUserId ||
    entityType ||
    entityId

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  // Get outcome badge color
  const getOutcomeBadgeColor = (outcome: AuditOutcome) => {
    switch (outcome) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failure':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and search system audit trail for compliance and security monitoring
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButton
              filters={queryParams}
              disabled={!data || data.data.length === 0}
            />
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Global search */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
                  placeholder="Search by ID, action, entity, actor email/name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => handleFilterChange(setStartDate)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => handleFilterChange(setEndDate)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Module filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module
                </label>
                <select
                  value={moduleFilter}
                  onChange={(e) => handleFilterChange(setModuleFilter)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="auth">Auth</option>
                  <option value="user_management">User Management</option>
                  <option value="organization">Organization</option>
                  <option value="roles_permissions">Roles & Permissions</option>
                  <option value="bids">Bids</option>
                  <option value="projects">Projects</option>
                  <option value="drawings">Drawings</option>
                  <option value="tickets">Tickets</option>
                  <option value="tasks">Tasks</option>
                  <option value="timesheets">Timesheets</option>
                  <option value="contacts_end_users">Contacts - End Users</option>
                  <option value="contacts_contractors">Contacts - Contractors</option>
                  <option value="contacts_consultants">Contacts - Consultants</option>
                  <option value="settings_profile">Settings - Profile</option>
                  <option value="settings_organization">Settings - Organization</option>
                  <option value="settings_systems">Settings - Systems</option>
                  <option value="settings_naming">Settings - Naming</option>
                  <option value="settings_drawing_types">Settings - Drawing Types</option>
                  <option value="reports">Reports</option>
                  <option value="exports">Exports</option>
                  <option value="audit_logs">Audit Logs</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Action filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <input
                  type="text"
                  value={actionFilter}
                  onChange={(e) => handleFilterChange(setActionFilter)(e.target.value)}
                  placeholder="e.g., created, updated, deleted"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Outcome filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outcome
                </label>
                <select
                  value={outcomeFilter}
                  onChange={(e) => handleFilterChange(setOutcomeFilter)(e.target.value as AuditOutcome | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Entity Type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <select
                  value={entityType}
                  onChange={(e) => handleFilterChange(setEntityType)(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="user">User</option>
                  <option value="organization">Organization</option>
                  <option value="role">Role</option>
                  <option value="permission">Permission</option>
                  <option value="bid">Bid</option>
                  <option value="project">Project</option>
                  <option value="drawing">Drawing</option>
                  <option value="ticket">Ticket</option>
                  <option value="task">Task</option>
                  <option value="timesheet">Timesheet</option>
                  <option value="contact">Contact</option>
                  <option value="system">System</option>
                  <option value="holiday">Holiday</option>
                  <option value="work_schedule">Work Schedule</option>
                  <option value="session">Session</option>
                </select>
              </div>

              {/* Entity ID filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity ID
                </label>
                <input
                  type="text"
                  value={entityId}
                  onChange={(e) => handleFilterChange(setEntityId)(e.target.value)}
                  placeholder="Enter UUID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter actions */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {data?.meta.total || 0} results found
                </p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Timestamp</span>
                      {sortBy === 'created_at' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('module')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Module</span>
                      {sortBy === 'module' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('action')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Action</span>
                      {sortBy === 'action' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('outcome')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Outcome</span>
                      {sortBy === 'outcome' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading audit logs...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="text-red-600 mb-2">
                        <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">Failed to load audit logs</p>
                      <p className="text-sm text-gray-600 mt-1">{(error as Error).message}</p>
                      <button
                        onClick={() => refetch()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <svg className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-900 font-medium">No audit logs found</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {hasActiveFilters
                          ? 'Try adjusting your filters'
                          : 'Audit logs will appear here as actions are performed'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {log.module || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono text-xs">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeBadgeColor(log.outcome)}`}>
                          {log.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {log.actor ? (
                          <div>
                            <div className="text-gray-900">{log.actor.fullName}</div>
                            <div className="text-gray-500 text-xs">{log.actor.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {log.entityType || log.entityId ? (
                          <div>
                            <div className="text-gray-700 text-xs uppercase mb-1">{log.entityType || 'Unknown'}</div>
                            <EntityLink
                              entityType={log.entityType}
                              entityId={log.entityId}
                              displayText={log.entityId ? `${log.entityId.substring(0, 8)}...` : undefined}
                              className="text-xs"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDiff(log.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="View diff"
                        >
                          View Diff
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.data.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.meta.total)} of {data.meta.total}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {data.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                  disabled={page === data.meta.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Diff Drawer */}
        <ViewDiffDrawer
          auditLogId={selectedAuditLogId}
          isOpen={isDiffDrawerOpen}
          onClose={handleCloseDiffDrawer}
        />
      </div>
    </AppLayout>
  )
}
