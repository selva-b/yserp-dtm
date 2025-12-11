/**
 * Audit Logs React Query Hooks
 *
 * Purpose: React Query hooks for managing audit log data
 *
 * Features:
 * - Automatic caching and background refetching
 * - Optimistic updates
 * - Error handling
 * - Loading states
 *
 * @module hooks/use-audit-logs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAuditLogs,
  fetchAuditLogById,
  fetchAuditLogDiff,
  requestAuditLogExport,
  type AuditLogQueryParams,
  type AuditLogExportRequest,
} from '@/services/audit-logs.service'

/**
 * Query key factory for audit logs
 */
export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogsKeys.all, 'list'] as const,
  list: (params: AuditLogQueryParams) => [...auditLogsKeys.lists(), params] as const,
  details: () => [...auditLogsKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditLogsKeys.details(), id] as const,
  diff: (id: string) => [...auditLogsKeys.all, 'diff', id] as const,
}

/**
 * Hook to fetch audit logs with filters and pagination
 *
 * @param params - Query parameters
 * @returns Query result with audit logs list
 */
export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: auditLogsKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook to fetch a single audit log by ID
 *
 * @param id - Audit log ID
 * @returns Query result with audit log details
 */
export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: auditLogsKeys.detail(id || ''),
    queryFn: () => {
      if (!id) throw new Error('Audit log ID is required')
      return fetchAuditLogById(id)
    },
    enabled: !!id, // Only fetch when ID is available
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook to fetch audit log diff
 *
 * @param id - Audit log ID
 * @returns Query result with diff data
 */
export function useAuditLogDiff(id: string | null) {
  return useQuery({
    queryKey: auditLogsKeys.diff(id || ''),
    queryFn: () => {
      if (!id) throw new Error('Audit log ID is required')
      return fetchAuditLogDiff(id)
    },
    enabled: !!id, // Only fetch when ID is available
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook to request audit log export
 *
 * @returns Mutation for creating export jobs
 */
export function useAuditLogExport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AuditLogExportRequest) => requestAuditLogExport(request),
    onSuccess: () => {
      // Optionally invalidate audit logs to show export audit event
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.lists() })
    },
  })
}
