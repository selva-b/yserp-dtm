/**
 * React Query Hooks for End Users
 *
 * Provides hooks for fetching, creating, updating, and deleting End Users
 * with automatic caching, refetching, and error handling
 *
 * @module hooks/use-end-users
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import {
  getEndUsers,
  getEndUserById,
  createEndUser,
  updateEndUser,
  deleteEndUser,
  toggleEndUserVerified,
  EndUsersQueryParams,
  EndUsersListResponse,
  EndUserDetails,
  CreateEndUserDto,
  UpdateEndUserDto,
} from '@/services/end-users.service'

// ============================================================================
// Query Keys
// ============================================================================

export const endUsersKeys = {
  all: ['end-users'] as const,
  lists: () => [...endUsersKeys.all, 'list'] as const,
  list: (params: EndUsersQueryParams) => [...endUsersKeys.lists(), params] as const,
  details: () => [...endUsersKeys.all, 'detail'] as const,
  detail: (id: string) => [...endUsersKeys.details(), id] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch End Users list with filters, search, sort, and pagination
 *
 * @param params - Query parameters
 * @param options - React Query options
 * @returns Query result with End Users list
 *
 * @example
 * const { data, isLoading, error } = useEndUsers({
 *   q: 'acme',
 *   active: true,
 *   page: 1,
 *   pageSize: 25,
 * })
 */
export function useEndUsers(
  params: EndUsersQueryParams = {},
  options?: Omit<UseQueryOptions<EndUsersListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: endUsersKeys.list(params),
    queryFn: () => getEndUsers(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    ...options,
  })
}

/**
 * Fetch End User by ID with full details
 *
 * @param id - End User organization ID
 * @param options - React Query options
 * @returns Query result with End User details
 *
 * @example
 * const { data, isLoading, error } = useEndUser('uuid-123')
 */
export function useEndUser(
  id: string,
  options?: Omit<UseQueryOptions<EndUserDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: endUsersKeys.detail(id),
    queryFn: () => getEndUserById(id),
    staleTime: 60000, // Consider data fresh for 1 minute
    enabled: !!id, // Only fetch if ID is provided
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new End User organization
 *
 * @returns Mutation result with create function
 *
 * @example
 * const { mutate, isPending } = useCreateEndUser()
 * mutate({ companyName: 'Acme Corp', ... }, {
 *   onSuccess: (data) => console.log('Created:', data),
 *   onError: (error) => console.error('Error:', error),
 * })
 */
export function useCreateEndUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEndUserDto) => createEndUser(data),
    onSuccess: () => {
      // Invalidate and refetch End Users list
      queryClient.invalidateQueries({ queryKey: endUsersKeys.lists() })
    },
  })
}

/**
 * Update End User organization
 *
 * @returns Mutation result with update function
 *
 * @example
 * const { mutate, isPending } = useUpdateEndUser()
 * mutate({ id: 'uuid-123', data: { companyName: 'New Name' } }, {
 *   onSuccess: (data) => console.log('Updated:', data),
 * })
 */
export function useUpdateEndUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEndUserDto }) =>
      updateEndUser(id, data),
    onSuccess: (data, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: endUsersKeys.lists() })
      // Invalidate specific detail query
      queryClient.invalidateQueries({ queryKey: endUsersKeys.detail(variables.id) })
    },
  })
}

/**
 * Soft delete End User organization
 *
 * @returns Mutation result with delete function
 *
 * @example
 * const { mutate, isPending } = useDeleteEndUser()
 * mutate('uuid-123', {
 *   onSuccess: () => console.log('Deleted'),
 * })
 */
export function useDeleteEndUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEndUser(id),
    onSuccess: () => {
      // Invalidate list queries to remove deleted item
      queryClient.invalidateQueries({ queryKey: endUsersKeys.lists() })
    },
  })
}

/**
 * Toggle verified status of End User (Admin-only)
 *
 * @returns Mutation result with toggle function
 *
 * @example
 * const { mutate, isPending } = useToggleEndUserVerified()
 * mutate('uuid-123', {
 *   onSuccess: (result) => console.log('Verified:', result.verified),
 * })
 */
export function useToggleEndUserVerified() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => toggleEndUserVerified(id),
    onSuccess: (data, id) => {
      // Optimistic update for list queries
      queryClient.invalidateQueries({ queryKey: endUsersKeys.lists() })
      // Optimistic update for specific detail query
      queryClient.invalidateQueries({ queryKey: endUsersKeys.detail(id) })
    },
  })
}
