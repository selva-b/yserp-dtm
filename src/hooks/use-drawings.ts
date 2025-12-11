import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getDrawings, getDrawingsByTicket, getActiveDrawings, type DrawingsQueryParams, type DrawingOption, type DrawingsListResponse } from '@/services/drawings.service';

/**
 * React Query hooks for drawing data
 */

// Query keys for cache management
export const drawingsKeys = {
  all: ['drawings'] as const,
  lists: () => [...drawingsKeys.all, 'list'] as const,
  list: (params: DrawingsQueryParams) => [...drawingsKeys.lists(), params] as const,
  byTicket: (ticketId: string, search?: string) => [...drawingsKeys.all, 'byTicket', ticketId, search] as const,
  active: (search?: string) => [...drawingsKeys.all, 'active', search] as const,
};

/**
 * Fetch drawings with filters
 * General purpose drawing list query
 */
export function useDrawings(params: DrawingsQueryParams = {}, options?: Omit<UseQueryOptions<DrawingsListResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: drawingsKeys.list(params),
    queryFn: () => getDrawings(params),
    staleTime: 30_000, // 30 seconds
    ...options,
  });
}

/**
 * Fetch drawings for a specific ticket
 * Used to filter drawings when ticket is selected in task form
 */
export function useDrawingsByTicket(ticketId: string | undefined, search?: string, options?: Omit<UseQueryOptions<DrawingOption[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: drawingsKeys.byTicket(ticketId || '', search),
    queryFn: () => getDrawingsByTicket(ticketId!, search),
    staleTime: 60_000, // 1 minute
    enabled: !!ticketId, // Only fetch if ticketId is provided
    ...options,
  });
}

/**
 * Fetch active drawings for dropdown
 */
export function useActiveDrawings(search?: string, options?: Omit<UseQueryOptions<DrawingOption[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: drawingsKeys.active(search),
    queryFn: () => getActiveDrawings(search),
    staleTime: 60_000, // 1 minute
    ...options,
  });
}
