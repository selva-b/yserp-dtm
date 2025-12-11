import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getApiUrl } from '@/lib/config';
import {
  NotificationListResponse,
  GetNotificationsParams,
  UnreadCountResponse,
} from '@/types/notifications';

/**
 * React Query hooks for Notifications
 *
 * Features:
 * - Automatic caching and refetching
 * - Real-time unread count updates
 * - Optimistic updates for read/unread status
 * - Query invalidation on mutations
 *
 * Performance:
 * - List queries cached for 30 seconds (frequent updates)
 * - Unread count refetched every 30 seconds
 * - Background refetch on window focus
 */

// ============================================================================
// Query Keys
// ============================================================================

export const NOTIFICATIONS_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATIONS_KEYS.all, 'list'] as const,
  list: (params: GetNotificationsParams) => [...NOTIFICATIONS_KEYS.lists(), params] as const,
  unreadCount: () => [...NOTIFICATIONS_KEYS.all, 'unread-count'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function getNotifications(params: GetNotificationsParams = {}): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.isRead !== undefined) searchParams.append('isRead', params.isRead.toString());
  if (params.isArchived !== undefined) searchParams.append('isArchived', params.isArchived.toString());
  if (params.category) searchParams.append('category', params.category);
  if (params.search) searchParams.append('search', params.search);

  const response = await apiClient(getApiUrl(`v1/notifications?${searchParams.toString()}`));
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
}

async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await apiClient(getApiUrl('v1/notifications/unread-count'));
  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }
  return response.json();
}

async function markAsRead(id: string): Promise<void> {
  const response = await apiClient(getApiUrl(`v1/notifications/${id}/read`), {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

async function markAllAsRead(): Promise<void> {
  const response = await apiClient(getApiUrl('v1/notifications/read-all'), {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

async function archiveNotification(id: string): Promise<void> {
  const response = await apiClient(getApiUrl(`v1/notifications/${id}/archive`), {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to archive notification');
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch paginated list of notifications
 *
 * @example
 * const { data, isLoading } = useNotifications({
 *   page: 1,
 *   limit: 20,
 *   isRead: false,
 *   enabled: true
 * })
 */
export function useNotifications(params: GetNotificationsParams & { enabled?: boolean } = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<NotificationListResponse, Error>({
    queryKey: NOTIFICATIONS_KEYS.list(queryParams),
    queryFn: () => getNotifications(queryParams),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 60 * 1000 : false, // Only refetch when enabled
  });
}

/**
 * Hook to fetch unread notification count
 * Refetches automatically every 30 seconds
 *
 * @example
 * const { data } = useUnreadCount()
 * const unreadCount = data?.count || 0
 */
export function useUnreadCount() {
  return useQuery<UnreadCountResponse, Error>({
    queryKey: NOTIFICATIONS_KEYS.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to mark a notification as read
 *
 * @example
 * const { mutate: markRead } = useMarkAsRead()
 * markRead(notificationId)
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: markAsRead,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEYS.all });

      // Optimistically update all notification lists
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_KEYS.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            ),
            unread_count: Math.max(0, old.unread_count - 1),
          };
        }
      );

      // Update unread count
      queryClient.setQueryData<UnreadCountResponse>(
        NOTIFICATIONS_KEYS.unreadCount(),
        (old) => {
          if (!old) return old;
          return { count: Math.max(0, old.count - 1) };
        }
      );
    },
    onError: () => {
      // Refetch on error to get correct state
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
  });
}

/**
 * Hook to mark all notifications as read
 *
 * @example
 * const { mutate: markAllRead } = useMarkAllAsRead()
 * markAllRead()
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEYS.all });

      // Optimistically update all notification lists
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_KEYS.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) => ({
              ...n,
              is_read: true,
              read_at: new Date().toISOString(),
            })),
            unread_count: 0,
          };
        }
      );

      // Update unread count
      queryClient.setQueryData<UnreadCountResponse>(
        NOTIFICATIONS_KEYS.unreadCount(),
        { count: 0 }
      );
    },
    onError: () => {
      // Refetch on error to get correct state
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
  });
}

/**
 * Hook to archive a notification
 *
 * @example
 * const { mutate: archive } = useArchiveNotification()
 * archive(notificationId)
 */
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: archiveNotification,
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    },
  });
}
