/**
 * StatusBadge Component
 *
 * Displays task/ticket status with color-coded badge
 * Follows WCAG 2.1 AA accessibility guidelines
 *
 * Supports both task statuses (pending, in_progress, completed, cancelled)
 * and ticket statuses (pending, ongoing, completed, cancelled)
 *
 * @module components/ui/StatusBadge
 */

import type { TaskStatus } from '@/services/tasks.service'
import { formatStatus } from '@/services/tasks.service'

// Union type to support both task and ticket statuses
type Status = TaskStatus | 'ongoing'

interface StatusBadgeProps {
  status: Status | string
  className?: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  ongoing: 'bg-blue-100 text-blue-800 border-blue-300', // Same as in_progress
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const statusIcons: Record<string, string> = {
  pending: '⏳',
  in_progress: '🔄',
  ongoing: '🔄', // Same as in_progress
  completed: '✅',
  cancelled: '❌',
}

const formatStatusLabel = (status: string): string => {
  // Try to use the task service formatter if it's a task status
  if (['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return formatStatus(status as TaskStatus)
  }

  // Otherwise, format manually
  if (status === 'ongoing') return 'Ongoing'

  // Fallback: capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border'

  // Handle null/undefined status
  if (!status) {
    return (
      <span
        className={`${baseStyles} bg-gray-100 text-gray-800 border-gray-300 ${className}`}
        role="status"
        aria-label="Status: Unknown"
      >
        <span aria-hidden="true">•</span>
        <span>Unknown</span>
      </span>
    )
  }

  const statusKey = status.toLowerCase()
  const style = statusStyles[statusKey] || 'bg-gray-100 text-gray-800 border-gray-300'
  const icon = statusIcons[statusKey] || '•'

  return (
    <span
      className={`${baseStyles} ${style} ${className}`}
      role="status"
      aria-label={`Status: ${formatStatusLabel(statusKey)}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{formatStatusLabel(statusKey)}</span>
    </span>
  )
}
