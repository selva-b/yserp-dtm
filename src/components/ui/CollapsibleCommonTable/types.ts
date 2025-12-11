import { ReactNode } from 'react'
import { CommonTableProps } from '../CommonTable/types'

export interface CollapsibleCommonTableProps<T> extends CommonTableProps<T> {
    /**
     * Render function for the expanded row content
     */
    renderExpandedRow: (row: T, rowIndex: number) => ReactNode

    /**
     * Optional callback when a row is expanded/collapsed
     */
    onRowExpand?: (row: T, isExpanded: boolean) => void

    /**
     * Initially expanded row IDs (if controlled)
     */
    expandedRowIds?: (string | number)[]

    /**
     * Allow multiple rows to be expanded at once (default: true)
     */
    allowMultipleExpansion?: boolean
}
