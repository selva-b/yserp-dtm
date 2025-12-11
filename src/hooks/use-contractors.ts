/**
 * React Query Hooks for Contractors
 *
 * Provides hooks for fetching, creating, updating, and deleting Contractors
 * with automatic caching, refetching, and error handling
 *
 * @module hooks/use-contractors
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import {
  getContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor,
  toggleContractorVerified,
  ContractorsQueryParams,
  ContractorsListResponse,
  ContractorDetails,
  CreateContractorDto,
  UpdateContractorDto,
} from '@/services/contractors.service'

// ============================================================================
// Query Keys
// ============================================================================

export const contractorsKeys = {
  all: ['contractors'] as const,
  lists: () => [...contractorsKeys.all, 'list'] as const,
  list: (params: ContractorsQueryParams) => [...contractorsKeys.lists(), params] as const,
  details: () => [...contractorsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractorsKeys.details(), id] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch Contractors list with filters, search, sort, and pagination
 *
 * @param params - Query parameters
 * @param options - React Query options
 * @returns Query result with Contractors list
 *
 * @example
 * const { data, isLoading, error } = useContractors({
 *   q: 'buildtech',
 *   active: true,
 *   page: 1,
 *   pageSize: 25,
 * })
 */
export function useContractors(
  params: ContractorsQueryParams = {},
  options?: Omit<UseQueryOptions<ContractorsListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: contractorsKeys.list(params),
    queryFn: () => getContractors(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    ...options,
  })
}

/**
 * Fetch Contractor by ID with full details
 *
 * @param id - Contractor organization ID
 * @param options - React Query options
 * @returns Query result with Contractor details
 *
 * @example
 * const { data, isLoading, error } = useContractor('uuid-123')
 */
export function useContractor(
  id: string,
  options?: Omit<UseQueryOptions<ContractorDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: contractorsKeys.detail(id),
    queryFn: () => getContractorById(id),
    staleTime: 60000, // Consider data fresh for 1 minute
    enabled: !!id, // Only fetch if ID is provided
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new Contractor organization
 *
 * @returns Mutation result with create function
 *
 * @example
 * const { mutate, isPending } = useCreateContractor()
 * mutate({ companyName: 'BuildTech Inc.', ... }, {
 *   onSuccess: (data) => console.log('Created:', data),
 *   onError: (error) => console.error('Error:', error),
 * })
 */
export function useCreateContractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateContractorDto) => createContractor(data),
    onSuccess: () => {
      // Invalidate and refetch Contractors list
      queryClient.invalidateQueries({ queryKey: contractorsKeys.lists() })
    },
  })
}

/**
 * Update Contractor organization
 *
 * @returns Mutation result with update function
 *
 * @example
 * const { mutate, isPending } = useUpdateContractor()
 * mutate({ id: 'uuid-123', data: { companyName: 'New Name' } }, {
 *   onSuccess: (data) => console.log('Updated:', data),
 * })
 */
export function useUpdateContractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractorDto }) =>
      updateContractor(id, data),
    onSuccess: (data, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: contractorsKeys.lists() })
      // Invalidate specific detail query
      queryClient.invalidateQueries({ queryKey: contractorsKeys.detail(variables.id) })
    },
  })
}

/**
 * Soft delete Contractor organization
 *
 * @returns Mutation result with delete function
 *
 * @example
 * const { mutate, isPending } = useDeleteContractor()
 * mutate('uuid-123', {
 *   onSuccess: () => console.log('Deleted'),
 * })
 */
export function useDeleteContractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContractor(id),
    onSuccess: () => {
      // Invalidate list queries to remove deleted item
      queryClient.invalidateQueries({ queryKey: contractorsKeys.lists() })
    },
  })
}

/**
 * Toggle verified status of Contractor (Admin-only)
 *
 * @returns Mutation result with toggle function
 *
 * @example
 * const { mutate, isPending } = useToggleContractorVerified()
 * mutate('uuid-123', {
 *   onSuccess: (result) => console.log('Verified:', result.verified),
 * })
 */
export function useToggleContractorVerified() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => toggleContractorVerified(id),
    onSuccess: (data, id) => {
      // Optimistic update for list queries
      queryClient.invalidateQueries({ queryKey: contractorsKeys.lists() })
      // Optimistic update for specific detail query
      queryClient.invalidateQueries({ queryKey: contractorsKeys.detail(id) })
    },
  })
}