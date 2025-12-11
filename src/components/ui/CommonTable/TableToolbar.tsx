/**
 * TableToolbar Component
 *
 * Toolbar for CommonTable with:
 * - Global search input
 * - Filter toggle
 * - Clear filters button
 * - Density toggle
 * - Column visibility
 * - Full-screen toggle
 * - Custom actions
 */

'use client'

import { useState } from 'react'
import { TableToolbarConfig } from './types'

interface TableToolbarProps {
  config: TableToolbarConfig
  globalSearch?: string
  onGlobalSearchChange?: (value: string) => void
  showColumnFilters?: boolean
  onToggleColumnFilters?: () => void
  onClearFilters?: () => void
  density?: 'comfortable' | 'compact' | 'spacious'
  onDensityChange?: (density: 'comfortable' | 'compact' | 'spacious') => void
  hiddenColumns?: Set<string>
  onToggleColumn?: (columnId: string) => void
  columns?: Array<{ id: string; header: string | React.ReactNode }>
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  hasActiveFilters?: boolean
}

export function TableToolbar({
  config,
  globalSearch,
  onGlobalSearchChange,
  showColumnFilters,
  onToggleColumnFilters,
  onClearFilters,
  density,
  onDensityChange,
  hiddenColumns,
  onToggleColumn,
  columns,
  isFullScreen,
  onToggleFullScreen,
  hasActiveFilters,
}: TableToolbarProps) {
  const [showDensityMenu, setShowDensityMenu] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)

  if (!config || (!config.globalSearch && !config.filterToggle && !config.clearFilters && !config.densityToggle && !config.columnVisibility && !config.fullScreen && !config.customActions)) {
    return null
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-md">
          {config.globalSearch && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={globalSearch || ''}
                onChange={(e) => onGlobalSearchChange?.(e.target.value)}
                placeholder={config.globalSearchPlaceholder || 'Search...'}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}
        </div>

        {/* Right Section - Action Icons */}
        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          {/* {config.filterToggle && (
            <button
              onClick={onToggleColumnFilters}
              className={`group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden ${showColumnFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title="Toggle Filters"
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                Filter
              </span>
            </button>
          )} */}

          {/* Clear Filters */}
          {/* {config.clearFilters && hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600"
              title="Clear All Filters"
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                Clear Filters
              </span>
            </button>
          )} */}

          {/* Density Toggle */}
          {config.densityToggle && (
            <div className="relative">
              <button
                onClick={() => setShowDensityMenu(!showDensityMenu)}
                className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600"
                title="Table Density"
              >
                <svg
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                  Density
                </span>
              </button>
              {showDensityMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          onDensityChange?.(d)
                          setShowDensityMenu(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          density === d
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Column Visibility */}
          {config.columnVisibility && columns && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600"
                title="Column Visibility"
              >
                <svg
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                  Columns
                </span>
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 max-h-96 overflow-y-auto">
                  <div className="py-1">
                    {columns.map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenColumns?.has(column.id)}
                          onChange={() => onToggleColumn?.(column.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                        <span className="flex-1">
                          {typeof column.header === 'string' ? column.header : column.id}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Screen Toggle */}
          {config.fullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 overflow-hidden text-gray-600"
              title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullScreen ? (
                <svg
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
              <span className="text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
                {isFullScreen ? 'Exit' : 'Full Screen'}
              </span>
            </button>
          )}

          {/* Custom Actions */}
          {config.customActions && <div className="flex items-center gap-2">{config.customActions}</div>}
        </div>
      </div>
    </div>
  )
}
