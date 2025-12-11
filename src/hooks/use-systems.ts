/**
 * React Query Hooks for Systems
 *
 * Provides hooks for fetching, creating, updating, and deleting Main and Sub Systems
 * with automatic caching, refetching, and error handling
 *
 * @module hooks/use-systems
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  getMainSystems,
  getMainSystemById,
  getMainSystemsForSelectors,
  createMainSystem,
  updateMainSystem,
  deleteMainSystem,
  getSubSystems,
  getSubSystemById,
  getSubSystemsForSelectors,
  createSubSystem,
  updateSubSystem,
  deleteSubSystem,
  MainSystemsQueryParams,
  MainSystemsListResponse,
  MainSystemDetails,
  MainSystemSelector,
  CreateMainSystemDto,
  UpdateMainSystemDto,
  SubSystemsQueryParams,
  SubSystemsListResponse,
  SubSystem,
  SubSystemSelector,
  CreateSubSystemDto,
  UpdateSubSystemDto,
} from '@/services/systems.service';

// ============================================================================
// Query Keys
// ============================================================================

export const systemsKeys = {
  all: ['systems'] as const,

  // Main Systems
  mainSystems: () => [...systemsKeys.all, 'main'] as const,
  mainSystemsLists: () => [...systemsKeys.mainSystems(), 'list'] as const,
  mainSystemsList: (params: MainSystemsQueryParams) => [...systemsKeys.mainSystemsLists(), params] as const,
  mainSystemsDetails: () => [...systemsKeys.mainSystems(), 'detail'] as const,
  mainSystemDetail: (id: string) => [...systemsKeys.mainSystemsDetails(), id] as const,
  mainSystemsSelectors: () => [...systemsKeys.mainSystems(), 'selectors'] as const,

  // Sub Systems
  subSystems: () => [...systemsKeys.all, 'sub'] as const,
  subSystemsLists: () => [...systemsKeys.subSystems(), 'list'] as const,
  subSystemsList: (params: SubSystemsQueryParams) => [...systemsKeys.subSystemsLists(), params] as const,
  subSystemsDetails: () => [...systemsKeys.subSystems(), 'detail'] as const,
  subSystemDetail: (id: string) => [...systemsKeys.subSystemsDetails(), id] as const,
  subSystemsSelectors: (mainSystemId?: string) =>
    [...systemsKeys.subSystems(), 'selectors', mainSystemId || 'all'] as const,
};

// ============================================================================
// Main Systems - Query Hooks
// ============================================================================

/**
 * Fetch Main Systems list with filters, search, sort, and pagination
 */
export function useMainSystems(
  params: MainSystemsQueryParams = {},
  options?: Omit<UseQueryOptions<MainSystemsListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: systemsKeys.mainSystemsList(params),
    queryFn: () => getMainSystems(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    ...options,
  });
}

/**
 * Fetch Main System by ID with sub systems
 */
export function useMainSystem(
  id: string,
  options?: Omit<UseQueryOptions<MainSystemDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: systemsKeys.mainSystemDetail(id),
    queryFn: () => getMainSystemById(id),
    staleTime: 60000, // Consider data fresh for 1 minute
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch active Main Systems for selectors
 */
export function useMainSystemsSelectors(
  options?: Omit<UseQueryOptions<MainSystemSelector[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: systemsKeys.mainSystemsSelectors(),
    queryFn: () => getMainSystemsForSelectors(),
    staleTime: 300000, // Consider data fresh for 5 minutes
    ...options,
  });
}

// ============================================================================
// Main Systems - Mutation Hooks
// ============================================================================

/**
 * Create new Main System
 */
export function useCreateMainSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMainSystem,
    onSuccess: () => {
      // Invalidate all main systems queries
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystems() });
    },
  });
}

/**
 * Update Main System
 */
export function useUpdateMainSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMainSystemDto }) =>
      updateMainSystem(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific system and list
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystemDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystemsLists() });
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystemsSelectors() });
    },
  });
}

/**
 * Delete Main System
 */
export function useDeleteMainSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMainSystem,
    onSuccess: () => {
      // Invalidate all main systems queries
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystems() });
    },
  });
}

// ============================================================================
// Sub Systems - Query Hooks
// ============================================================================

/**
 * Fetch Sub Systems list with filters, search, sort, and pagination
 */
export function useSubSystems(
  params: SubSystemsQueryParams = {},
  options?: Omit<UseQueryOptions<SubSystemsListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: systemsKeys.subSystemsList(params),
    queryFn: () => getSubSystems(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    ...options,
  });
}

/**
 * Fetch Sub System by ID
 */
export function useSubSystem(
  id: string,
  options?: Omit<UseQueryOptions<SubSystem>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: systemsKeys.subSystemDetail(id),
    queryFn: () => getSubSystemById(id),
    staleTime: 60000, // Consider data fresh for 1 minute
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch active Sub Systems for selectors
 */
export function useSubSystemsSelectors(
  mainSystemId?: string,
  options?: Omit<UseQueryOptions<SubSystemSelector[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: systemsKeys.subSystemsSelectors(mainSystemId),
    queryFn: () => getSubSystemsForSelectors(mainSystemId),
    staleTime: 300000, // Consider data fresh for 5 minutes
    ...options,
  });
}

// ============================================================================
// Sub Systems - Mutation Hooks
// ============================================================================

/**
 * Create new Sub System
 */
export function useCreateSubSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubSystem,
    onSuccess: () => {
      // Invalidate all sub systems queries and main system details
      queryClient.invalidateQueries({ queryKey: systemsKeys.subSystems() });
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystemsDetails() });
    },
  });
}

/**
 * Update Sub System
 */
export function useUpdateSubSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubSystemDto }) =>
      updateSubSystem(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific system, lists, and parent main system
      queryClient.invalidateQueries({ queryKey: systemsKeys.subSystemDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: systemsKeys.subSystemsLists() });
      queryClient.invalidateQueries({ queryKey: systemsKeys.subSystemsSelectors() });
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystemsDetails() });
    },
  });
}

/**
 * Delete Sub System
 */
export function useDeleteSubSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubSystem,
    onSuccess: () => {
      // Invalidate all sub systems queries and main system details
      queryClient.invalidateQueries({ queryKey: systemsKeys.subSystems() });
      queryClient.invalidateQueries({ queryKey: systemsKeys.mainSystemsDetails() });
    },
  });
}
