/**
 * Reports Module React Query Hooks
 *
 * Provides data fetching hooks for all report types using React Query
 * Follows the pattern established in useDashboard.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClientJson, apiClientBlob } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'
import type {
  // Response types
  ReportResponse,
  DrawingReportItem,
  ProjectReportItem,
  BidReportItem,
  TicketReportItem,
  TaskReportItem,
  UserWorkloadItem,
  // Filter types
  DrawingsFilterParams,
  ProjectsFilterParams,
  BidsFilterParams,
  TicketsFilterParams,
  TasksFilterParams,
  UsersFilterParams,
  // Catalog types
  DrawingType,
  System,
  SubSystem,
  Role,
  UserOption,
  BidOption,
  ProjectOption,
  TicketOption,
  DrawingOption,
  LocationOption,
  // Export types
  ExportRequest,
  ExportResponse,
} from '@/types/reports'

// =====================================================================
// Drawings Report
// =====================================================================

/**
 * Hook to fetch drawings report
 * @param filters - Drawing filter parameters
 * @returns React Query result with drawings data
 */
export function useDrawingsReport(filters: DrawingsFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'drawings', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      // Add filter parameters
      if (filters.after) params.append('after', filters.after)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      if (filters.q) params.append('q', filters.q)
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.bidIds?.length) filters.bidIds.forEach(id => params.append('bidIds', id))
      if (filters.projectIds?.length) filters.projectIds.forEach(id => params.append('projectIds', id))
      if (filters.statuses?.length) filters.statuses.forEach(s => params.append('statuses', s))
      if (filters.drawingTypeIds?.length) filters.drawingTypeIds.forEach(id => params.append('drawingTypeIds', id))
      if (filters.mainSystemIds?.length) filters.mainSystemIds.forEach(id => params.append('mainSystemIds', id))
      if (filters.subSystemIds?.length) filters.subSystemIds.forEach(id => params.append('subSystemIds', id))
      if (filters.submissionDateFrom) params.append('submissionDateFrom', filters.submissionDateFrom)
      if (filters.submissionDateTo) params.append('submissionDateTo', filters.submissionDateTo)

      const url = getApiUrl(`v1/reports/drawings?${params.toString()}`)
      const data = await apiClientJson<ReportResponse<DrawingReportItem>>(url)
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// =====================================================================
// Projects Report
// =====================================================================

/**
 * Hook to fetch projects report
 * @param filters - Project filter parameters
 * @returns React Query result with projects data
 */
export function useProjectsReport(filters: ProjectsFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.after) params.append('after', filters.after)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      if (filters.q) params.append('q', filters.q)
      if (filters.mainSystemIds?.length) filters.mainSystemIds.forEach(id => params.append('mainSystemIds', id))
      if (filters.subSystemIds?.length) filters.subSystemIds.forEach(id => params.append('subSystemIds', id))
      if (filters.projectManagerIds?.length) filters.projectManagerIds.forEach(id => params.append('projectManagerIds', id))
      if (filters.draftingManagerIds?.length) filters.draftingManagerIds.forEach(id => params.append('draftingManagerIds', id))
      if (filters.industries?.length) filters.industries.forEach(i => params.append('industries', i))
      if (filters.countries?.length) filters.countries.forEach(c => params.append('countries', c))
      if (filters.states?.length) filters.states.forEach(s => params.append('states', s))
      if (filters.cities?.length) filters.cities.forEach(c => params.append('cities', c))
      if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom)
      if (filters.startDateTo) params.append('startDateTo', filters.startDateTo)
      if (filters.closingDateFrom) params.append('closingDateFrom', filters.closingDateFrom)
      if (filters.closingDateTo) params.append('closingDateTo', filters.closingDateTo)

      const url = getApiUrl(`v1/reports/projects?${params.toString()}`)
      const data = await apiClientJson<ReportResponse<ProjectReportItem>>(url)
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// =====================================================================
// Bids Report
// =====================================================================

/**
 * Hook to fetch bids report
 * @param filters - Bid filter parameters
 * @returns React Query result with bids data
 */
export function useBidsReport(filters: BidsFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'bids', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.after) params.append('after', filters.after)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      if (filters.q) params.append('q', filters.q)
      if (filters.mainSystemIds?.length) filters.mainSystemIds.forEach(id => params.append('mainSystemIds', id))
      if (filters.subSystemIds?.length) filters.subSystemIds.forEach(id => params.append('subSystemIds', id))
      if (filters.bidManagerIds?.length) filters.bidManagerIds.forEach(id => params.append('bidManagerIds', id))
      if (filters.draftingManagerIds?.length) filters.draftingManagerIds.forEach(id => params.append('draftingManagerIds', id))
      if (filters.industries?.length) filters.industries.forEach(i => params.append('industries', i))
      if (filters.countries?.length) filters.countries.forEach(c => params.append('countries', c))
      if (filters.states?.length) filters.states.forEach(s => params.append('states', s))
      if (filters.cities?.length) filters.cities.forEach(c => params.append('cities', c))
      if (filters.closingDateFrom) params.append('closingDateFrom', filters.closingDateFrom)
      if (filters.closingDateTo) params.append('closingDateTo', filters.closingDateTo)

      const url = getApiUrl(`v1/reports/bids?${params.toString()}`)
      const data = await apiClientJson<ReportResponse<BidReportItem>>(url)
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// =====================================================================
// Tickets Report
// =====================================================================

/**
 * Hook to fetch tickets report
 * @param filters - Ticket filter parameters
 * @returns React Query result with tickets data
 */
export function useTicketsReport(filters: TicketsFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.after) params.append('after', filters.after)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      if (filters.q) params.append('q', filters.q)
      if (filters.statuses?.length) filters.statuses.forEach(s => params.append('statuses', s))
      if (filters.priorities?.length) filters.priorities.forEach(p => params.append('priorities', p))
      if (filters.assigneeIds?.length) filters.assigneeIds.forEach(id => params.append('assigneeIds', id))
      if (filters.relatedTo) params.append('relatedTo', filters.relatedTo)
      if (filters.bidIds?.length) filters.bidIds.forEach(id => params.append('bidIds', id))
      if (filters.projectIds?.length) filters.projectIds.forEach(id => params.append('projectIds', id))
      if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom)
      if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo)
      if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom)
      if (filters.startDateTo) params.append('startDateTo', filters.startDateTo)

      const url = getApiUrl(`v1/reports/tickets?${params.toString()}`)
      const data = await apiClientJson<ReportResponse<TicketReportItem>>(url)
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// =====================================================================
// Tasks Report
// =====================================================================

/**
 * Hook to fetch tasks report
 * @param filters - Task filter parameters
 * @returns React Query result with tasks data
 */
export function useTasksReport(filters: TasksFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.after) params.append('after', filters.after)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      if (filters.q) params.append('q', filters.q)
      // Note: entityType and entityIds are NOT supported by the backend API
      // Tasks should be filtered by ticketIds instead, since tickets are linked to bids/projects
      if (filters.statuses?.length) filters.statuses.forEach(s => params.append('statuses', s))
      if (filters.priorities?.length) filters.priorities.forEach(p => params.append('priorities', p))
      if (filters.assigneeIds?.length) filters.assigneeIds.forEach(id => params.append('assigneeIds', id))
      if (filters.ticketIds?.length) filters.ticketIds.forEach(id => params.append('ticketIds', id))
      if (filters.drawingIds?.length) filters.drawingIds.forEach(id => params.append('drawingIds', id))
      if (filters.dateWindow) params.append('dateWindow', filters.dateWindow)
      if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom)
      if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo)

      const url = getApiUrl(`v1/reports/tasks?${params.toString()}`)
      const data = await apiClientJson<ReportResponse<TaskReportItem>>(url)
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// =====================================================================
// Users Report (Workload)
// =====================================================================

/**
 * Hook to fetch users workload report
 * @param filters - User filter parameters
 * @returns React Query result with user workload data
 */
export function useUsersReport(filters: UsersFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'users', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.after) params.append('after', filters.after)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      if (filters.q) params.append('q', filters.q)
      if (filters.userIds?.length) filters.userIds.forEach(id => params.append('userIds', id))
      if (filters.roleIds?.length) filters.roleIds.forEach(id => params.append('roleIds', id))
      if (filters.departments?.length) filters.departments.forEach(d => params.append('departments', d))
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
      if (filters.dateWindow) params.append('dateWindow', filters.dateWindow)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const url = getApiUrl(`v1/reports/users?${params.toString()}`)
      const data = await apiClientJson<ReportResponse<UserWorkloadItem>>(url)
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// =====================================================================
// Catalog Hooks (for filter dropdowns)
// =====================================================================

/**
 * Hook to fetch drawing types catalog
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useDrawingTypesCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'drawing-types'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/drawing-types')
      const response = await apiClientJson<{ data: DrawingType[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - catalogs change rarely
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch main systems catalog
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useMainSystemsCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'main-systems'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/main-systems')
      const response = await apiClientJson<{ data: System[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 10,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch sub systems catalog
 * @param mainSystemId - Optional filter by main system
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useSubSystemsCatalog(mainSystemId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'sub-systems', mainSystemId],
    queryFn: async () => {
      const params = mainSystemId ? `?mainSystemId=${mainSystemId}` : ''
      const url = getApiUrl(`v1/reports/catalog/sub-systems${params}`)
      const response = await apiClientJson<{ data: SubSystem[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 10,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch roles catalog
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useRolesCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'roles'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/roles')
      const response = await apiClientJson<{ data: Role[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 10,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch users catalog (for assignee dropdowns)
 * @param roleId - Optional filter by role
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useUsersCatalog(roleId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'users', roleId],
    queryFn: async () => {
      const params = roleId ? `?roleId=${roleId}` : ''
      const url = getApiUrl(`v1/reports/catalog/users${params}`)
      const response = await apiClientJson<{ data: UserOption[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - users can change more frequently
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch bids catalog (for bid dropdowns)
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useBidsCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'bids'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/bids')
      const response = await apiClientJson<{ data: BidOption[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch projects catalog (for project dropdowns)
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useProjectsCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'projects'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/projects')
      const response = await apiClientJson<{ data: ProjectOption[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch tickets catalog (for ticket dropdowns)
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useTicketsCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'tickets'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/tickets')
      const response = await apiClientJson<{ data: TicketOption[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to fetch drawings catalog (for drawing dropdowns)
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useDrawingsCatalog(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', 'catalog', 'drawings'],
    queryFn: async () => {
      const url = getApiUrl('v1/reports/catalog/drawings')
      const response = await apiClientJson<{ data: DrawingOption[] }>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  })
}

// =====================================================================
// Export Hook
// =====================================================================

/**
 * Hook to export report data
 * @returns Mutation hook for exporting reports
 */
export function useExportReport() {
  return useMutation({
    mutationFn: async (request: ExportRequest) => {
      const url = getApiUrl('v1/reports/export')

      // For MVP: Synchronous export returns base64 data
      const response = await apiClientJson<ExportResponse>(url, {
        method: 'POST',
        body: JSON.stringify(request),
      })

      return response
    },
    onSuccess: (data) => {
      // Download the file
      if (data.success && data.data) {
        // Decode base64 data
        const binaryString = atob(data.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Create blob and download
        const mimeType = data.format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        const blob = new Blob([bytes], { type: mimeType })
        const downloadUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(downloadUrl)
      }
    },
  })
}

// =====================================================================
// Unified Catalog Hook (fetches all at once)
// =====================================================================

/**
 * Hook to fetch all catalog data at once
 * Useful for initializing filter panels
 * @param options - Optional query options (e.g., { enabled: false } for lazy loading)
 */
export function useAllCatalogs(options?: { enabled?: boolean }) {
  const drawingTypes = useDrawingTypesCatalog(options)
  const mainSystems = useMainSystemsCatalog(options)
  const subSystems = useSubSystemsCatalog(undefined, options)
  const roles = useRolesCatalog(options)
  const users = useUsersCatalog(undefined, options)
  const bids = useBidsCatalog(options)
  const projects = useProjectsCatalog(options)
  const tickets = useTicketsCatalog(options)

  return {
    drawingTypes: drawingTypes.data ?? [],
    mainSystems: mainSystems.data ?? [],
    subSystems: subSystems.data ?? [],
    roles: roles.data ?? [],
    users: users.data ?? [],
    bids: bids.data ?? [],
    projects: projects.data ?? [],
    tickets: tickets.data ?? [],
    isLoading:
      drawingTypes.isLoading ||
      mainSystems.isLoading ||
      subSystems.isLoading ||
      roles.isLoading ||
      users.isLoading ||
      bids.isLoading ||
      projects.isLoading ||
      tickets.isLoading,
    isError:
      drawingTypes.isError ||
      mainSystems.isError ||
      subSystems.isError ||
      roles.isError ||
      users.isError ||
      bids.isError ||
      projects.isError ||
      tickets.isError,
  }
}
