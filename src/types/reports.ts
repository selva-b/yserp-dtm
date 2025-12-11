/**
 * Reports Module TypeScript Types
 *
 * Type definitions for all report-related data structures
 */

// =====================================================================
// Common Types
// =====================================================================

export interface PaginationMeta {
  nextCursor: string | null
  hasMore: boolean
  limit: number
}

export interface ReportResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export type SortDirection = 'asc' | 'desc'

export type DateWindow = 'today' | 'this_week' | 'this_month' | 'custom'

// =====================================================================
// Drawing Report Types
// =====================================================================

export interface DrawingReportItem {
  id: string
  org_id: string
  drawing_number: string
  drawing_name: string
  submission_number?: string
  planned_submission_date?: string
  drawing_status: string
  entity_type: 'bid' | 'project'
  entity_id: string
  created_at: string
  updated_at: string

  // Drawing Type
  drawing_type_id?: string
  drawing_type_name?: string

  // System Info
  sub_system_id?: string
  sub_system_name?: string
  sub_system_code?: string
  main_system_id?: string
  main_system_name?: string
  main_system_code?: string

  // Entity Context
  entity_number?: string
  entity_name?: string
  entity_display_number?: string

  // Creator Info
  created_by_name?: string
  created_by_email?: string
  reviewed_by_name?: string

  // New fields for detailed report
  revision_status?: string
  progress_percentage?: number
  total_duration_hours?: number
  total_days_worked?: number
  user_stats?: {
    user_name: string
    total_hours: number
    total_days: number
  }[]

  // Status
  last_status_changed_at?: string
}

export interface DrawingsFilterParams {
  after?: string
  limit?: number
  sortBy?: string
  sortDir?: SortDirection
  q?: string
  ids?: string[]
  entityType?: 'bid' | 'project'
  bidIds?: string[]
  projectIds?: string[]
  statuses?: string[]
  drawingTypeIds?: string[]
  mainSystemIds?: string[]
  subSystemIds?: string[]
  submissionDateFrom?: string
  submissionDateTo?: string
  includeUserStats?: boolean
}

// =====================================================================
// Project Report Types
// =====================================================================

export interface ProjectReportItem {
  id: string
  org_id: string
  project_number: string
  project_name: string
  industry?: string
  city_town?: string
  state?: string
  country?: string
  project_start_date?: string
  project_closing_date?: string
  created_at: string
  updated_at: string

  // Managers
  project_manager_id?: string
  project_manager_name?: string
  drafting_manager_id?: string
  drafting_manager_name?: string

  // Counts
  drawings_count: number
  tickets_count: number
  tasks_count: number
  tasks_pending_count: number
  tasks_in_progress_count: number
  tasks_completed_count: number
  tasks_cancelled_count: number

  // Naming
  display_number?: string
}

export interface ProjectsFilterParams {
  after?: string
  limit?: number
  sortBy?: string
  sortDir?: SortDirection
  q?: string
  mainSystemIds?: string[]
  subSystemIds?: string[]
  projectManagerIds?: string[]
  draftingManagerIds?: string[]
  industries?: string[]
  countries?: string[]
  states?: string[]
  cities?: string[]
  startDateFrom?: string
  startDateTo?: string
  closingDateFrom?: string
  closingDateTo?: string
}

// =====================================================================
// Bid Report Types
// =====================================================================

export interface BidReportItem {
  id: string
  org_id: string
  bid_number: string
  bid_name: string
  industry?: string
  city_town?: string
  state?: string
  country?: string
  bid_closing_date?: string
  created_at: string
  updated_at: string

  // Managers
  bid_manager_id?: string
  bid_manager_name?: string
  drafting_manager_id?: string
  drafting_manager_name?: string

  // Counts
  drawings_count: number
  tickets_count: number
  tasks_count: number
  tasks_pending_count: number
  tasks_in_progress_count: number
  tasks_completed_count: number
  tasks_cancelled_count: number

  // Naming
  display_number?: string
}

export interface BidsFilterParams {
  after?: string
  limit?: number
  sortBy?: string
  sortDir?: SortDirection
  q?: string
  mainSystemIds?: string[]
  subSystemIds?: string[]
  bidManagerIds?: string[]
  draftingManagerIds?: string[]
  industries?: string[]
  countries?: string[]
  states?: string[]
  cities?: string[]
  closingDateFrom?: string
  closingDateTo?: string
}

// =====================================================================
// Ticket Report Types
// =====================================================================

export interface TicketReportItem {
  id: string
  org_id: string
  ticket_number: string
  ticket_name: string
  description?: string
  status: string | null
  priority: string | null
  start_date?: string
  due_date?: string
  related_to: 'bids' | 'projects'
  created_at: string
  updated_at: string

  // Assignee
  assignee_id?: string
  assignee_name?: string

  // Related Entity
  bid_id?: string
  bid_number?: string
  bid_name?: string
  project_id?: string
  project_number?: string
  project_name?: string

  // Naming
  display_number?: string
}

export interface TicketsFilterParams {
  after?: string
  limit?: number
  sortBy?: string
  sortDir?: SortDirection
  q?: string
  statuses?: string[]
  priorities?: string[]
  assigneeIds?: string[]
  relatedTo?: 'bids' | 'projects'
  bidIds?: string[]
  projectIds?: string[]
  dueDateFrom?: string
  dueDateTo?: string
  startDateFrom?: string
  startDateTo?: string
}

// =====================================================================
// Task Report Types
// =====================================================================

export interface TaskReportItem {
  id: string
  org_id: string
  title: string
  description?: string
  status: string | null
  priority: string | null
  due_date?: string
  created_at: string
  updated_at: string

  // Assignee
  assignee_id?: string
  assignee_name?: string

  // Ticket
  ticket_id?: string
  ticket_number?: string
  ticket_name?: string

  // Drawing
  drawing_id?: string
  drawing_number?: string
  drawing_name?: string
}

export interface TasksFilterParams {
  after?: string
  limit?: number
  sortBy?: string
  sortDir?: SortDirection
  q?: string
  entityType?: 'bids' | 'projects'
  entityIds?: string[]
  statuses?: string[]
  priorities?: string[]
  assigneeIds?: string[]
  ticketIds?: string[]
  drawingIds?: string[]
  dateWindow?: DateWindow
  dueDateFrom?: string
  dueDateTo?: string
}

// =====================================================================
// User Report Types
// =====================================================================

export interface UserWorkloadItem {
  user_id: string
  full_name: string
  email: string
  role_name?: string
  department?: string
  is_active: boolean

  // Task Counts
  tasks_pending_count: number
  tasks_in_progress_count: number
  tasks_completed_count: number
  tasks_cancelled_count: number
  tasks_total_count: number

  // Timesheet Hours
  timesheet_total_hours: number
  timesheet_approved_hours: number
  timesheet_pending_hours: number
  timesheet_rejected_hours: number
}

export interface UsersFilterParams {
  after?: string
  limit?: number
  sortBy?: string
  sortDir?: SortDirection
  q?: string
  userIds?: string[]
  roleIds?: string[]
  departments?: string[]
  isActive?: boolean
  dateWindow?: DateWindow
  dateFrom?: string
  dateTo?: string
}

// =====================================================================
// Catalog Types (for filter dropdowns)
// =====================================================================

export interface DrawingType {
  id: string
  name: string
}

export interface System {
  id: string
  name: string
  code: string
}

export interface SubSystem extends System {
  main_system_id: string
}

export interface Role {
  id: string
  name: string
}

export interface UserOption {
  id: string
  full_name: string
  email: string
}

export interface BidOption {
  id: string
  bid_number: string
  bid_name: string
  display_number?: string
}

export interface ProjectOption {
  id: string
  project_number: string
  project_name: string
  display_number?: string
}

export interface TicketOption {
  id: string
  ticket_number: string
  ticket_name: string
  display_number?: string
}

export interface DrawingOption {
  id: string
  drawing_number: string
  drawing_name: string
  display_number?: string
}

export interface LocationOption {
  value: string
  label: string
}

// =====================================================================
// Export Types
// =====================================================================

export type ExportFormat = 'csv' | 'xlsx'

export type ReportType = 'drawings' | 'projects' | 'bids' | 'tickets' | 'tasks' | 'users'

export interface ExportRequest {
  reportType: ReportType
  format: ExportFormat
  filters: Record<string, any>
  fileName?: string
}

export interface ExportResponse {
  success: boolean
  format: ExportFormat
  fileName: string
  data: string // base64 encoded
  rowCount: number
  generatedAt: string
  message?: string
}
