/**
 * PriorityBadge Component
 *
 * Displays task priority with color-coded badge
 * Follows WCAG 2.1 AA accessibility guidelines
 *
 * @module components/ui/PriorityBadge
 */

import type { TaskPriority } from '@/services/tasks.service'
import { formatPriority, getPriorityColor } from '@/services/tasks.service'

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  urgent: 'bg-red-100 text-red-800 border-red-300',
}

const priorityIcons: Record<TaskPriority, string> = {
  low: '⬇️',
  medium: '➡️',
  high: '⬆️',
  urgent: '🔥',
}

export default function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border'

  return (
    <span
      className={`${baseStyles} ${priorityStyles[priority]} ${className}`}
      role="status"
      aria-label={`Priority: ${formatPriority(priority)}`}
    >
      <span aria-hidden="true">{priorityIcons[priority]}</span>
      <span>{formatPriority(priority)}</span>
    </span>
  )
}
