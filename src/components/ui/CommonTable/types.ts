/**
 * CommonTable Types
 *
 * Type definitions for the reusable table component
 * Supports server-side pagination, sorting, filtering, and row actions
 */

import { ReactNode } from 'react'

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface FilterState {
  [key: string]: any
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// Pagination Types
// ============================================================================

export type PaginationMode = 'page' | 'cursor'

export interface PagePagination {
  mode: 'page'
  page: number
  pageSize: number
}

export interface CursorPagination {
  mode: 'cursor'
  cursor?: string | number
  pageSize: number
}

export type PaginationState = PagePagination | CursorPagination

// ============================================================================
// Data Fetching Types
// ============================================================================

export interface FetchDataParams {
  filters?: FilterState
  sort?: SortState
  cursor?: string | number
  page?: number
  pageSize?: number
}

export interface FetchDataResult<T> {
  rows: T[]
  cursor?: string | number
  total?: number
  hasMore?: boolean
}

export type FetchDataFn<T> = (params: FetchDataParams) => Promise<FetchDataResult<T>>

// ============================================================================
// Column Definition Types
// ============================================================================

export type CellRenderer<T> = (row: T, value: any, rowIndex: number) => ReactNode

export interface ColumnFilter {
  /** Filter type */
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange'
  /** Placeholder for filter input */
  placeholder?: string
  /** Options for select/multiselect */
  options?: { value: string | number; label: string }[]
  /** Filter mode (starts_with, contains, equals, etc.) */
  mode?: 'contains' | 'starts_with' | 'ends_with' | 'equals'
}

export interface ColumnDef<T> {
  /** Unique identifier for the column */
  id: string
  /** Column header label */
  header: string | ReactNode
  /** Accessor key or function to get cell value */
  accessor: keyof T | ((row: T) => any)
  /** Optional custom cell renderer */
  cell?: CellRenderer<T>
  /** Enable sorting for this column */
  sortable?: boolean
  /** Custom sort field (if different from accessor) */
  sortField?: string
  /** Column width (CSS value) */
  width?: string
  /** Column alignment */
  align?: 'left' | 'center' | 'right'
  /** Hide column on mobile */
  hideOnMobile?: boolean
  /** Custom className for th */
  headerClassName?: string
  /** Custom className for td */
  cellClassName?: string
  /** Enable column filtering */
  filterable?: boolean
  /** Column filter configuration */
  filter?: ColumnFilter
}

// ============================================================================
// Row Actions Types
// ============================================================================

export interface RowAction<T> {
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'primary' | 'danger'
  disabled?: (row: T) => boolean
  hidden?: (row: T) => boolean
}

export type RowActionsRenderer<T> = (row: T, rowIndex: number) => ReactNode

// ============================================================================
// Bulk Actions Types
// ============================================================================

export interface BulkAction<T> {
  label: string
  icon?: ReactNode
  onClick: (selectedRows: T[]) => void
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}

// ============================================================================
// Table State Types
// ============================================================================

export interface TableState<T> {
  data: T[]
  isLoading: boolean
  error: Error | null
  selectedRows: T[]
  sort: SortState | null
  pagination: PaginationState
  totalRows?: number
  hasMore?: boolean
}

// ============================================================================
// Toolbar Configuration Types
// ============================================================================

export interface TableToolbarConfig {
  /** Show global search input */
  globalSearch?: boolean
  /** Global search placeholder */
  globalSearchPlaceholder?: string
  /** Show filter toggle button */
  filterToggle?: boolean
  /** Show clear filters button */
  clearFilters?: boolean
  /** Show table density toggle */
  densityToggle?: boolean
  /** Show column visibility toggle */
  columnVisibility?: boolean
  /** Show full-screen toggle */
  fullScreen?: boolean
  /** Custom toolbar actions */
  customActions?: ReactNode
}

// ============================================================================
// CommonTable Props
// ============================================================================

export interface CommonTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[]

  /** Data fetching function (server-side) or direct data (client-side) */
  fetchData?: FetchDataFn<T>
  data?: T[]

  /** External filters to apply */
  filters?: FilterState

  /** Callback when filters change (for URL sync) */
  onFiltersChange?: (filters: FilterState) => void

  /** Toolbar configuration */
  toolbar?: TableToolbarConfig

  /** Enable row selection */
  selection?: boolean

  /** Row actions renderer or config */
  rowActions?: RowActionsRenderer<T> | RowAction<T>[]

  /** Bulk actions for selected rows */
  bulkActions?: BulkAction<T>[]

  /** Enable virtualization for large datasets */
  virtualized?: boolean

  /** Initial sort state */
  initialSort?: SortState

  /** Page size options */
  pageSizeOptions?: number[]

  /** Default page size */
  defaultPageSize?: number

  /** Pagination mode */
  paginationMode?: PaginationMode

  /** Unique row key accessor */
  rowKey?: keyof T | ((row: T) => string | number)

  /** Empty state message */
  emptyMessage?: string | ReactNode

  /** Error state message */
  errorMessage?: string | ReactNode

  /** Loading message */
  loadingMessage?: string | ReactNode

  /** Custom className for table container */
  className?: string

  /** Sticky header */
  stickyHeader?: boolean

  /** Compact mode (reduce padding) */
  compact?: boolean

  /** On row click handler */
  onRowClick?: (row: T, rowIndex: number) => void

  /** Custom row className */
  rowClassName?: string | ((row: T, rowIndex: number) => string)
}
