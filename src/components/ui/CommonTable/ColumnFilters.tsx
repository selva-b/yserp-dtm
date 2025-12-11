/**
 * ColumnFilters Component
 *
 * Renders filter inputs for each filterable column
 */

'use client'

import { ColumnDef, ColumnFilter } from './types'

interface ColumnFiltersProps<T> {
  columns: ColumnDef<T>[]
  columnFilters: Record<string, any>
  onFilterChange: (columnId: string, value: any) => void
  hiddenColumns?: Set<string>
}

export function ColumnFilters<T>({
  columns,
  columnFilters,
  onFilterChange,
  hiddenColumns,
}: ColumnFiltersProps<T>) {
  const renderFilter = (column: ColumnDef<T>, filter: ColumnFilter) => {
    const value = columnFilters[column.id] || ''

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onFilterChange(column.id, e.target.value)}
            placeholder={filter.placeholder || `Filter by ${typeof column.header === 'string' ? column.header : column.id}...`}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onFilterChange(column.id, e.target.value)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        // For multiselect, we'll use a simple text input for now (can be enhanced later)
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value)
              onFilterChange(column.id, selected)
            }}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            size={3}
          >
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onFilterChange(column.id, e.target.value)}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'daterange':
        const [from, to] = Array.isArray(value) ? value : ['', '']
        return (
          <div className="flex gap-1">
            <input
              type="date"
              value={from}
              onChange={(e) => onFilterChange(column.id, [e.target.value, to])}
              placeholder="From"
              className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => onFilterChange(column.id, [from, e.target.value])}
              placeholder="To"
              className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onFilterChange(column.id, e.target.value)}
            placeholder={filter.placeholder}
            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'numberrange':
        const [min, max] = Array.isArray(value) ? value : ['', '']
        return (
          <div className="flex gap-1">
            <input
              type="number"
              value={min}
              onChange={(e) => onFilterChange(column.id, [e.target.value, max])}
              placeholder="Min"
              className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              value={max}
              onChange={(e) => onFilterChange(column.id, [min, e.target.value])}
              placeholder="Max"
              className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <tr className="bg-gray-50">
      {columns.map((column) => {
        // Skip hidden columns
        if (hiddenColumns?.has(column.id)) {
          return null
        }

        // Skip columns without filters
        if (!column.filterable || !column.filter) {
          return (
            <th
              key={column.id}
              className={`px-3 py-2 ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
            />
          )
        }

        return (
          <th
            key={column.id}
            className={`px-3 py-2 ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
            style={{ width: column.width }}
          >
            {renderFilter(column, column.filter)}
          </th>
        )
      })}
      {/* Actions column placeholder */}
      <th className="px-3 py-2" />
    </tr>
  )
}
