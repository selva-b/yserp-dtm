/**
 * Notification Types
 * Frontend types for the notification system
 */

export enum NotificationCategory {
  AUTHENTICATION = 'authentication',
  USERS = 'users',
  BIDS = 'bids',
  PROJECTS = 'projects',
  TICKETS = 'tickets',
  TASKS = 'tasks',
  TIMESHEETS = 'timesheets',
  DRAWINGS = 'drawings',
  CONTACTS = 'contacts',
}

export enum NotificationSeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface Notification {
  id: string
  user_id: string
  type_code: string
  category: NotificationCategory
  title: string
  message: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, any>
  severity: NotificationSeverity
  is_read: boolean
  is_archived: boolean
  read_at?: string | null
  created_at: string
  updated_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
  page: number
  limit: number
  total_pages: number
}

export interface GetNotificationsParams {
  page?: number
  limit?: number
  isRead?: boolean
  isArchived?: boolean
  category?: NotificationCategory
  search?: string
}

export interface UnreadCountResponse {
  count: number
}
