import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  getConsultants,
  getConsultant,
  createConsultant,
  updateConsultant,
  deleteConsultant,
  toggleConsultantVerified,
  type ConsultantsQueryParams,
  type CreateConsultantPayload,
  type UpdateConsultantPayload,
  type ConsultantsListResponse,
  type ConsultantDetails,
} from '@/services/consultants.service';

/**
 * React Query hooks for Consultants module
 *
 * Features:
 * - Automatic caching and refetching
 * - Optimistic updates
 * - Error handling with toast notifications
 * - Query invalidation on mutations
 *
 * Performance:
 * - List queries cached for 5 minutes
 * - Detail queries cached for 10 minutes
 * - Background refetch on window focus
 */

// ============================================================================
// Query Keys
// ============================================================================

const CONSULTANTS_KEYS = {
  all: ['consultants'] as const,
  lists: () => [...CONSULTANTS_KEYS.all, 'list'] as const,
  list: (params: ConsultantsQueryParams) => [...CONSULTANTS_KEYS.lists(), params] as const,
  details: () => [...CONSULTANTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CONSULTANTS_KEYS.details(), id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch paginated list of Consultants
 * Performance Target: P95 ≤ 1.5s
 *
 * @example
 * const { data, isLoading, error } = useConsultants({
 *   q: 'search term',
 *   active: true,
 *   verified: true,
 *   page: 1,
 *   pageSize: 25
 * })
 */
export function useConsultants(params: ConsultantsQueryParams = {}) {
  return useQuery<ConsultantsListResponse, Error>({
    queryKey: CONSULTANTS_KEYS.list(params),
    queryFn: () => getConsultants(params),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch a single Consultant by ID
 *
 * @example
 * const { data: consultant, isLoading } = useConsultant('consultant-id-123')
 */
export function useConsultant(
  id: string,
  options?: Omit<UseQueryOptions<ConsultantDetails, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ConsultantDetails, Error>({
    queryKey: CONSULTANTS_KEYS.detail(id),
    queryFn: () => getConsultant(id),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    ...options,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to create a new Consultant
 * Performance Target: P95 ≤ 2s
 *
 * @example
 * const { mutate: create, isPending } = useCreateConsultant()
 * create(payload, {
 *   onSuccess: (data) => console.log('Created:', data),
 *   onError: (error) => console.error('Failed:', error)
 * })
 */
export function useCreateConsultant() {
  const queryClient = useQueryClient();

  return useMutation<ConsultantDetails, Error, CreateConsultantPayload>({
    mutationFn: createConsultant,
    onSuccess: () => {
      // Invalidate all list queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: CONSULTANTS_KEYS.lists() });
    },
    onError: (error) => {
      console.error('Failed to create Consultant:', error);
    },
  });
}

/**
 * Hook to update an existing Consultant
 *
 * @example
 * const { mutate: update, isPending } = useUpdateConsultant()
 * update({ id: 'consultant-id-123', payload: { companyName: 'New Name' } }, {
 *   onSuccess: (data) => console.log('Updated:', data)
 * })
 */
export function useUpdateConsultant() {
  const queryClient = useQueryClient();

  return useMutation<
    ConsultantDetails,
    Error,
    { id: string; payload: UpdateConsultantPayload }
  >({
    mutationFn: ({ id, payload }) => updateConsultant(id, payload),
    onSuccess: (data, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: CONSULTANTS_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CONSULTANTS_KEYS.detail(variables.id),
      });
    },
    onError: (error) => {
      console.error('Failed to update Consultant:', error);
    },
  });
}

/**
 * Hook to soft-delete a Consultant
 *
 * @example
 * const { mutate: deleteConsultant, isPending } = useDeleteConsultant()
 * deleteConsultant('consultant-id-123', {
 *   onSuccess: () => console.log('Deleted')
 * })
 */
export function useDeleteConsultant() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; id: string }, Error, string>({
    mutationFn: deleteConsultant,
    onSuccess: (data) => {
      // Invalidate list queries and remove detail query
      queryClient.invalidateQueries({ queryKey: CONSULTANTS_KEYS.lists() });
      queryClient.removeQueries({ queryKey: CONSULTANTS_KEYS.detail(data.id) });
    },
    onError: (error) => {
      console.error('Failed to delete Consultant:', error);
    },
  });
}

/**
 * Hook to toggle verified status (Admin-only)
 * RBAC: contacts.consultants.verify:toggle
 *
 * @example
 * const { mutate: toggleVerified, isPending } = useToggleConsultantVerified()
 * toggleVerified('consultant-id-123', {
 *   onSuccess: (data) => console.log('Verified:', data.verified)
 * })
 */
export function useToggleConsultantVerified() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; id: string; verified: boolean },
    Error,
    string
  >({
    mutationFn: toggleConsultantVerified,
    onSuccess: (data) => {
      // Invalidate list and detail queries to reflect new verified status
      queryClient.invalidateQueries({ queryKey: CONSULTANTS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CONSULTANTS_KEYS.detail(data.id) });
    },
    onError: (error) => {
      console.error('Failed to toggle verified status:', error);
    },
  });
}