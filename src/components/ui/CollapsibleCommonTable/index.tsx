'use client'

import { useState, useCallback, Fragment } from 'react'
import { CommonTable } from '../CommonTable'
import { CollapsibleCommonTableProps } from './types'
import { ColumnDef } from '../CommonTable/types'

/**
 * CollapsibleCommonTable Component
 * 
 * Extends CommonTable to support row expansion.
 * Wraps the CommonTable but intercepts the rendering to inject the expansion logic.
 * 
 * Note: Since CommonTable controls the rendering of rows, we need to adapt it.
 * However, CommonTable as implemented doesn't easily support "injecting" rows between rows.
 * 
 * STRATEGY:
 * We will reimplement the table structure similar to CommonTable but with the expansion logic,
 * OR we can try to use CommonTable if it supported a "renderRow" prop or similar.
 * 
 * Looking at CommonTable source, it renders `tr` elements directly.
 * To support collapsible rows properly (which usually requires a separate `tr`),
 * we might need to duplicate some of the CommonTable logic or modify CommonTable to support it.
 * 
 * Given the requirement to be a "separate version", I will create a full implementation
 * that reuses the logic/hooks but renders the table with expansion support.
 * 
 * For simplicity and consistency, I'll base this heavily on CommonTable's implementation.
 */

import { useEffect, useMemo } from 'react'
import {
    FetchDataParams,
    SortState,
    TableState,
} from '../CommonTable/types'
import { useDebounce } from '@/hooks/use-debounce'
import { TableToolbar } from '../CommonTable/TableToolbar'
import { ColumnFilters } from '../CommonTable/ColumnFilters'

/**
 * Get cell value from row using accessor
 */
function getCellValue<T>(row: T, accessor: keyof T | ((row: T) => any)): any {
    if (typeof accessor === 'function') {
        return accessor(row)
    }
    return row[accessor]
}

/**
 * Get unique key for row
 */
function getRowKey<T>(
    row: T,
    rowIndex: number,
    keyAccessor?: keyof T | ((row: T) => string | number)
): string | number {
    if (!keyAccessor) {
        return rowIndex
    }
    if (typeof keyAccessor === 'function') {
        return keyAccessor(row)
    }
    return row[keyAccessor] as string | number
}

function LoadingState({ message }: { message?: string }) {
    return (
        <tr>
            <td colSpan={100} className="px-6 py-12 text-center">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-500">{message || 'Loading...'}</span>
                </div>
            </td>
        </tr>
    )
}

function ErrorState({ error, message }: { error: Error | null; message?: string }) {
    return (
        <tr>
            <td colSpan={100} className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading data</h3>
                <p className="mt-1 text-sm text-gray-500">{message || error?.message || 'An unexpected error occurred'}</p>
            </td>
        </tr>
    )
}

function EmptyState({ message }: { message?: string }) {
    return (
        <tr>
            <td colSpan={100} className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
                <p className="mt-1 text-sm text-gray-500">{message || 'No records to display'}</p>
            </td>
        </tr>
    )
}

export function CollapsibleCommonTable<T>({
    columns,
    fetchData,
    data: clientData,
    filters,
    onFiltersChange,
    toolbar,
    selection = false,
    rowActions,
    bulkActions,
    initialSort,
    pageSizeOptions = [25, 50, 100],
    defaultPageSize = 25,
    paginationMode = 'page',
    rowKey,
    emptyMessage,
    errorMessage,
    loadingMessage,
    className,
    stickyHeader = false,
    compact = false,
    onRowClick,
    rowClassName,
    renderExpandedRow,
    onRowExpand,
    expandedRowIds: controlledExpandedRowIds,
    allowMultipleExpansion = true,
}: CollapsibleCommonTableProps<T>) {

    // ============================================================================
    // State Management (Copied from CommonTable)
    // ============================================================================

    const [tableState, setTableState] = useState<TableState<T>>({
        data: clientData || [],
        isLoading: false,
        error: null,
        selectedRows: [],
        sort: initialSort || null,
        pagination:
            paginationMode === 'cursor'
                ? { mode: 'cursor', pageSize: defaultPageSize }
                : { mode: 'page', page: 1, pageSize: defaultPageSize },
        totalRows: clientData?.length,
    })

    // Toolbar-related state
    const [globalSearch, setGlobalSearch] = useState('')
    const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})
    const [showColumnFilters, setShowColumnFilters] = useState(false)
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
    const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact' | 'spacious'>(compact ? 'compact' : 'comfortable')
    const [isFullScreen, setIsFullScreen] = useState(false)

    // Expansion State
    const [internalExpandedRowIds, setInternalExpandedRowIds] = useState<(string | number)[]>([])
    const expandedRowIds = controlledExpandedRowIds || internalExpandedRowIds

    const debouncedFilters = useDebounce(filters, 300)
    const debouncedGlobalSearch = useDebounce(globalSearch, 300)
    const debouncedColumnFilters = useDebounce(columnFilters, 300)

    // ============================================================================
    // Data Fetching
    // ============================================================================

    const loadData = useCallback(async () => {
        if (!fetchData) return

        setTableState((prev) => ({ ...prev, isLoading: true, error: null }))

        try {
            const params: FetchDataParams = {
                filters: debouncedFilters,
                sort: tableState.sort || undefined,
                pageSize: tableState.pagination.pageSize,
            }

            if (tableState.pagination.mode === 'page') {
                params.page = tableState.pagination.page
            } else {
                params.cursor = tableState.pagination.cursor
            }

            const result = await fetchData(params)

            setTableState((prev) => ({
                ...prev,
                data: result.rows,
                totalRows: result.total,
                hasMore: result.hasMore,
                isLoading: false,
            }))
        } catch (error) {
            setTableState((prev) => ({
                ...prev,
                error: error as Error,
                isLoading: false,
            }))
        }
    }, [fetchData, debouncedFilters, tableState.sort, tableState.pagination])

    useEffect(() => {
        if (fetchData) {
            loadData()
        }
    }, [loadData])

    useEffect(() => {
        if (paginationMode === 'page') {
            setTableState((prev) => ({
                ...prev,
                pagination: { ...prev.pagination, page: 1 } as any,
            }))
        }
    }, [debouncedFilters, paginationMode])

    useEffect(() => {
        if (clientData) {
            setTableState((prev) => ({
                ...prev,
                data: clientData,
                totalRows: clientData.length,
            }))
        }
    }, [clientData])

    // ============================================================================
    // Event Handlers
    // ============================================================================

    const handleSort = useCallback((field: string) => {
        setTableState((prev) => {
            const newSort: SortState =
                prev.sort?.field === field && prev.sort.direction === 'asc'
                    ? { field, direction: 'desc' }
                    : { field, direction: 'asc' }

            return { ...prev, sort: newSort }
        })
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setTableState((prev) => ({
            ...prev,
            pagination: { ...prev.pagination, page: newPage } as any,
        }))
    }, [])

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setTableState((prev) => ({
            ...prev,
            pagination:
                prev.pagination.mode === 'page'
                    ? { mode: 'page', page: 1, pageSize: newPageSize }
                    : { mode: 'cursor', pageSize: newPageSize },
        }))
    }, [])

    const handleRowSelect = useCallback((row: T) => {
        setTableState((prev) => {
            const isSelected = prev.selectedRows.includes(row)
            return {
                ...prev,
                selectedRows: isSelected
                    ? prev.selectedRows.filter((r) => r !== row)
                    : [...prev.selectedRows, row],
            }
        })
    }, [])

    const handleSelectAll = useCallback((currentFilteredData: T[]) => {
        setTableState((prev) => ({
            ...prev,
            selectedRows: prev.selectedRows.length === currentFilteredData.length ? [] : [...currentFilteredData],
        }))
    }, [])

    const handleColumnFilterChange = useCallback((columnId: string, value: any) => {
        setColumnFilters((prev) => ({
            ...prev,
            [columnId]: value,
        }))
    }, [])

    const handleClearAllFilters = useCallback(() => {
        setGlobalSearch('')
        setColumnFilters({})
        onFiltersChange?.({})
    }, [onFiltersChange])

    const handleToggleColumn = useCallback((columnId: string) => {
        setHiddenColumns((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(columnId)) {
                newSet.delete(columnId)
            } else {
                newSet.add(columnId)
            }
            return newSet
        })
    }, [])

    const handleToggleExpand = useCallback((row: T, rowIndex: number) => {
        const key = getRowKey(row, rowIndex, rowKey)

        if (controlledExpandedRowIds) {
            onRowExpand?.(row, !expandedRowIds.includes(key))
            return
        }

        setInternalExpandedRowIds(prev => {
            const isExpanded = prev.includes(key)
            if (isExpanded) {
                onRowExpand?.(row, false)
                return prev.filter(id => id !== key)
            } else {
                onRowExpand?.(row, true)
                return allowMultipleExpansion ? [...prev, key] : [key]
            }
        })
    }, [rowKey, controlledExpandedRowIds, onRowExpand, allowMultipleExpansion, expandedRowIds])

    // ============================================================================
    // Computed Values
    // ============================================================================

    const hasActiveFilters = useMemo(() => {
        return globalSearch.length > 0 || Object.keys(columnFilters).some(key => {
            const value = columnFilters[key]
            return value !== '' && value !== null && value !== undefined && (Array.isArray(value) ? value.length > 0 : true)
        })
    }, [globalSearch, columnFilters])

    const visibleColumns = useMemo(() => {
        return columns.filter(col => !hiddenColumns.has(col.id))
    }, [columns, hiddenColumns])

    const paddingClass = useMemo(() => {
        switch (tableDensity) {
            case 'compact': return 'px-3 py-2'
            case 'spacious': return 'px-8 py-6'
            default: return 'px-6 py-4'
        }
    }, [tableDensity])

    const filteredData = useMemo(() => {
        let filtered = tableState.data

        if (debouncedGlobalSearch && debouncedGlobalSearch.trim().length > 0) {
            const searchLower = debouncedGlobalSearch.toLowerCase().trim()
            filtered = filtered.filter((row) => {
                return visibleColumns.some((col) => {
                    const cellValue = getCellValue(row, col.accessor)
                    if (cellValue == null) return false
                    const stringValue = String(cellValue).toLowerCase()
                    return stringValue.includes(searchLower)
                })
            })
        }

        if (Object.keys(debouncedColumnFilters).length > 0) {
            filtered = filtered.filter((row) => {
                return Object.entries(debouncedColumnFilters).every(([columnId, filterValue]) => {
                    if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true
                    const column = columns.find((col) => col.id === columnId)
                    if (!column) return true
                    const cellValue = getCellValue(row, column.accessor)
                    if (cellValue == null) return false
                    const cellString = String(cellValue).toLowerCase()

                    if (Array.isArray(filterValue)) {
                        return filterValue.some(val => cellString.includes(String(val).toLowerCase()))
                    } else if (typeof filterValue === 'string') {
                        return cellString.includes(filterValue.toLowerCase())
                    } else {
                        return cellValue === filterValue
                    }
                })
            })
        }

        return filtered
    }, [tableState.data, debouncedGlobalSearch, debouncedColumnFilters, visibleColumns, columns])

    const totalPages = useMemo(() => {
        if (paginationMode === 'cursor' || !tableState.totalRows) return 0
        return Math.ceil(tableState.totalRows / tableState.pagination.pageSize)
    }, [paginationMode, tableState.totalRows, tableState.pagination.pageSize])

    const currentPage = useMemo(() => {
        return tableState.pagination.mode === 'page' ? tableState.pagination.page : 1
    }, [tableState.pagination])

    const renderRowActions = useCallback((row: T, rowIndex: number) => {
        if (!rowActions) return null
        if (typeof rowActions === 'function') return rowActions(row, rowIndex)
        return (
            <div className="flex items-center justify-end space-x-2">
                {rowActions.map((action, idx) => {
                    const isHidden = action.hidden?.(row)
                    const isDisabled = action.disabled?.(row)
                    if (isHidden) return null
                    return (
                        <button
                            key={idx}
                            onClick={() => action.onClick(row)}
                            disabled={isDisabled}
                            className={`${action.variant === 'danger'
                                    ? 'text-red-600 hover:text-red-900'
                                    : action.variant === 'primary'
                                        ? 'text-blue-600 hover:text-blue-900'
                                        : 'text-gray-600 hover:text-gray-900'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={action.label}
                        >
                            {action.icon || action.label}
                        </button>
                    )
                })}
            </div>
        )
    }, [rowActions])

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
            {toolbar && (
                <TableToolbar
                    config={toolbar}
                    globalSearch={globalSearch}
                    onGlobalSearchChange={setGlobalSearch}
                    showColumnFilters={showColumnFilters}
                    onToggleColumnFilters={() => setShowColumnFilters(!showColumnFilters)}
                    onClearFilters={handleClearAllFilters}
                    density={tableDensity}
                    onDensityChange={setTableDensity}
                    hiddenColumns={hiddenColumns}
                    onToggleColumn={handleToggleColumn}
                    columns={columns}
                    isFullScreen={isFullScreen}
                    onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                    hasActiveFilters={hasActiveFilters}
                />
            )}

            {selection && bulkActions && tableState.selectedRows.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-blue-800">{tableState.selectedRows.length} selected</span>
                    <div className="flex items-center space-x-2">
                        {bulkActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => action.onClick(tableState.selectedRows)}
                                disabled={action.disabled}
                                className={`px-3 py-1 text-sm font-medium rounded-md ${action.variant === 'danger'
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : action.variant === 'primary'
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {action.icon && <span className="mr-1">{action.icon}</span>}
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`overflow-x-auto ${isFullScreen ? 'h-full' : ''}`}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        <tr>
                            {/* Expand Toggle Header */}
                            <th className="w-10 px-2 py-3"></th>

                            {selection && (
                                <th className={`px-${compact ? '4' : '6'} py-3 text-left`}>
                                    <input
                                        type="checkbox"
                                        checked={filteredData.length > 0 && tableState.selectedRows.length === filteredData.length}
                                        onChange={() => handleSelectAll(filteredData)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </th>
                            )}

                            {visibleColumns.map((column) => (
                                <th
                                    key={column.id}
                                    className={`${paddingClass} py-3 text-${column.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''} ${column.headerClassName || ''}`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.sortField || String(column.accessor))}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.header}</span>
                                        {column.sortable && tableState.sort?.field === (column.sortField || String(column.accessor)) && (
                                            <span>{tableState.sort.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                            ))}

                            {rowActions && (
                                <th className={`${paddingClass} py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                                    Actions
                                </th>
                            )}
                        </tr>

                        {showColumnFilters && (
                            <ColumnFilters
                                columns={visibleColumns}
                                columnFilters={columnFilters}
                                onFilterChange={handleColumnFilterChange}
                                hiddenColumns={hiddenColumns}
                            />
                        )}
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {tableState.isLoading && <LoadingState message={loadingMessage as string} />}

                        {!tableState.isLoading && tableState.error && (
                            <ErrorState error={tableState.error} message={errorMessage as string} />
                        )}

                        {!tableState.isLoading && !tableState.error && filteredData.length === 0 && (
                            <EmptyState message={emptyMessage as string} />
                        )}

                        {!tableState.isLoading && !tableState.error && filteredData.map((row, rowIndex) => {
                            const key = getRowKey(row, rowIndex, rowKey)
                            const isSelected = tableState.selectedRows.includes(row)
                            const isExpanded = expandedRowIds.includes(key)
                            const computedRowClassName = typeof rowClassName === 'function' ? rowClassName(row, rowIndex) : rowClassName

                            return (
                                <Fragment key={key}>
                                    <tr
                                        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${computedRowClassName || ''} ${onRowClick ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-gray-50' : ''}`}
                                        onClick={() => onRowClick?.(row, rowIndex)}
                                    >
                                        {/* Expand Toggle Cell */}
                                        <td className="px-2 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleToggleExpand(row, rowIndex)
                                                }}
                                                className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform duration-200"
                                            >
                                                <svg
                                                    className={`h-5 w-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </td>

                                        {selection && (
                                            <td className={paddingClass}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleRowSelect(row)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                            </td>
                                        )}

                                        {visibleColumns.map((column) => {
                                            const value = getCellValue(row, column.accessor)
                                            return (
                                                <td
                                                    key={column.id}
                                                    className={`${paddingClass} text-${column.align || 'left'} text-sm ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.cellClassName || ''}`}
                                                >
                                                    {column.cell ? column.cell(row, value, rowIndex) : value}
                                                </td>
                                            )
                                        })}

                                        {rowActions && (
                                            <td className={`${paddingClass} text-right text-sm font-medium`} onClick={(e) => e.stopPropagation()}>
                                                {renderRowActions(row, rowIndex)}
                                            </td>
                                        )}
                                    </tr>

                                    {/* Expanded Row Content */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={100} className="px-4 py-4 sm:px-6">
                                                <div className="pl-8">
                                                    {renderExpandedRow(row, rowIndex)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {paginationMode === 'page' && tableState.totalRows && tableState.totalRows > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Per page:</label>
                        <select
                            value={tableState.pagination.pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-700">
                            Showing {(currentPage - 1) * tableState.pagination.pageSize + 1} to{' '}
                            {Math.min(currentPage * tableState.pagination.pageSize, tableState.totalRows)} of{' '}
                            {tableState.totalRows}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CollapsibleCommonTable
