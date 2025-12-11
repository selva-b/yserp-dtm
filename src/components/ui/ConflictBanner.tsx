/**
 * ConflictBanner Component
 *
 * Displays warning banner when optimistic locking detects version conflict
 * Provides refresh option to get latest data
 *
 * Accessibility:
 * - ARIA role="alert" for screen readers
 * - Clear action buttons
 * - Non-destructive warning state
 *
 * @module components/ui/ConflictBanner
 */

interface ConflictBannerProps {
  onRefresh: () => void
  onDismiss?: () => void
  className?: string
}

export default function ConflictBanner({
  onRefresh,
  onDismiss,
  className = '',
}: ConflictBannerProps) {
  return (
    <div
      className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Version Conflict Detected</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              This task has been modified by another user. Please refresh to see the latest
              changes before making updates.
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Refresh
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 hover:text-yellow-600"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
