'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBid } from '@/hooks/useBids'
import { useDrawings } from '@/hooks/useDrawings'
import { useTickets } from '@/hooks/useTickets'
import { useTasks } from '@/hooks/use-tasks'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Checkbox } from 'primereact/checkbox'
import { Tag } from 'primereact/tag'
import StatusBadge from '@/components/ui/StatusBadge'
import PriorityBadge from '@/components/ui/PriorityBadge'

type TicketStatus = 'pending' | 'ongoing' | 'completed' | 'cancelled'

// Helper function to get ticket status badge severity
const getTicketStatusSeverity = (status: string): 'success' | 'info' | 'warning' | 'danger' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'ongoing':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'danger'
    default:
      return 'info'
  }
}

// Helper function to get drawing status badge severity
const getDrawingStatusSeverity = (status: string): 'success' | 'info' | 'warning' | 'danger' => {
  switch (status) {
    case 'Approved':
      return 'success'
    case 'Open':
    case 'Designing':
      return 'warning'
    case 'Internal review':
    case 'Internal revision':
    case 'Internal Approval':
      return 'info'
    case 'Submitted':
    case 'On review':
    case 'Revision ongoing':
      return 'info'
    default:
      return 'info'
  }
}

export default function BidReportViewPage() {
  const params = useParams()
  const router = useRouter()
  const bidId = params.id as string

  // Fetch bid data
  const { data: bid, isLoading: loadingBid, error: errorBid } = useBid(bidId)

  // State for filters - All ticket and drawing statuses
  const [ticketStatusFilters, setTicketStatusFilters] = useState<TicketStatus[]>([
    'pending',
    'ongoing',
    'completed',
    'cancelled',
  ])
  const [drawingStatusFilters, setDrawingStatusFilters] = useState<string[]>([
    'Open',
    'Designing',
    'Internal review',
    'Internal revision',
    'Internal Approval',
    'Submitted',
    'On review',
    'Revision ongoing',
    'Approved',
  ])
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([])

  // Fetch drawings for this bid
  const { data: drawingsData, isLoading: loadingDrawings } = useDrawings({
    entityType: 'bid',
    entityId: bidId,
    pageSize: 100,
  })

  // Fetch tickets for this bid
  const { data: ticketsData, isLoading: loadingTickets } = useTickets({
    relatedTo: 'bids',
    bidId: bidId,
    pageSize: 100,
  })

  // Get all ticket IDs for this bid
  const allTicketIds = useMemo(() => {
    return ticketsData?.data?.map(t => t.id) || []
  }, [ticketsData])

  // Fetch ALL tasks - we'll filter client-side since backend doesn't support multiple IDs
  // Note: Backend max pageSize is 100
  // Only fetch tasks after we have loaded tickets for this bid
  const { data: tasksData, isLoading: loadingTasks } = useTasks(
    {
      pageSize: 100, // Backend max limit is 100
    },
    {
      enabled: !loadingTickets,
    }
  )

  // Filter tickets by status
  const filteredTickets = useMemo(() => {
    if (!ticketsData?.data) return []
    return ticketsData.data.filter((ticket) => ticketStatusFilters.includes(ticket.status))
  }, [ticketsData, ticketStatusFilters])

  // Filter drawings by status
  const filteredDrawings = useMemo(() => {
    if (!drawingsData?.data) return []
    return drawingsData.data.filter((drawing) => drawingStatusFilters.includes(drawing.status))
  }, [drawingsData, drawingStatusFilters])

  // Filter tasks by bid tickets and selected tickets/drawings (client-side filter)
  const filteredTasks = useMemo(() => {
    if (!tasksData?.data) return []
    let tasks = tasksData.data

    // Debug logging
    console.log('🔍 Task Filtering Debug:')
    console.log('Total tasks from API:', tasks.length)
    console.log('All ticket IDs for bid:', allTicketIds)
    console.log('Selected ticket IDs:', selectedTicketIds)
    console.log('Selected drawing IDs:', selectedDrawingIds)

    // First, filter to only tasks belonging to this bid's tickets
    // If bid has no tickets, return empty array (not all tasks!)
    if (allTicketIds.length === 0) {
      console.log('No tickets for this bid, showing no tasks')
      return []
    }

    tasks = tasks.filter((task) => task.ticketId && allTicketIds.includes(task.ticketId))
    console.log('After bid ticket filter:', tasks.length)

    // Then, filter by selected tickets ONLY if some (but not all) are selected
    if (selectedTicketIds.length > 0 && selectedTicketIds.length < allTicketIds.length) {
      tasks = tasks.filter((task) => task.ticketId && selectedTicketIds.includes(task.ticketId))
      console.log('After selected ticket filter:', tasks.length)
    }

    // Finally, filter by selected drawings ONLY if some drawings are selected
    const allDrawingIds = drawingsData?.data?.map(d => d.id) || []
    if (selectedDrawingIds.length > 0 && selectedDrawingIds.length < allDrawingIds.length) {
      tasks = tasks.filter((task) => task.drawingId && selectedDrawingIds.includes(task.drawingId))
      console.log('After selected drawing filter:', tasks.length)
    }

    console.log('Final filtered tasks:', tasks.length)
    return tasks
  }, [tasksData, allTicketIds, selectedTicketIds, selectedDrawingIds, drawingsData])

  // Calculate metrics - only for tasks belonging to this bid
  const metrics = useMemo(() => {
    const allTasks = tasksData?.data || []
    // Filter to only tasks belonging to this bid's tickets
    const bidTasks = allTasks.filter((task) => task.ticketId && allTicketIds.includes(task.ticketId))

    return {
      totalTickets: ticketsData?.pagination?.total || 0,
      totalDrawings: drawingsData?.pagination?.total || 0,
      totalTasks: bidTasks.length,
      pendingTasks: bidTasks.filter((t) => t.status === 'pending').length,
      inProgressTasks: bidTasks.filter((t) => t.status === 'in_progress').length,
      completedTasks: bidTasks.filter((t) => t.status === 'completed').length,
      overdueTasks: bidTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length,
    }
  }, [tasksData, ticketsData, drawingsData, allTicketIds])

  // Count tickets by status - all statuses
  const ticketCounts = useMemo(() => {
    const tickets = ticketsData?.data || []
    return {
      pending: tickets.filter((t) => t.status === 'pending').length,
      ongoing: tickets.filter((t) => t.status === 'ongoing').length,
      completed: tickets.filter((t) => t.status === 'completed').length,
      cancelled: tickets.filter((t) => t.status === 'cancelled').length,
    }
  }, [ticketsData])

  // Count drawings by status - all statuses
  const drawingCounts = useMemo(() => {
    const drawings = drawingsData?.data || []
    return {
      Open: drawings.filter((d) => d.status === 'Open').length,
      Designing: drawings.filter((d) => d.status === 'Designing').length,
      'Internal review': drawings.filter((d) => d.status === 'Internal review').length,
      'Internal revision': drawings.filter((d) => d.status === 'Internal revision').length,
      'Internal Approval': drawings.filter((d) => d.status === 'Internal Approval').length,
      Submitted: drawings.filter((d) => d.status === 'Submitted').length,
      'On review': drawings.filter((d) => d.status === 'On review').length,
      'Revision ongoing': drawings.filter((d) => d.status === 'Revision ongoing').length,
      Approved: drawings.filter((d) => d.status === 'Approved').length,
    }
  }, [drawingsData])

  // Toggle ticket status filter
  const toggleTicketStatus = (status: TicketStatus) => {
    setTicketStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  // Toggle drawing status filter
  const toggleDrawingStatus = (status: string) => {
    setDrawingStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  // Toggle ticket selection
  const toggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    )
  }

  // Toggle drawing selection
  const toggleDrawing = (drawingId: string) => {
    setSelectedDrawingIds((prev) =>
      prev.includes(drawingId) ? prev.filter((id) => id !== drawingId) : [...prev, drawingId]
    )
  }

  // DataTable column renderers
  const taskTitleBody = (rowData: any) => {
    return (
      <Link
        href={`/tasks/${rowData.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        {rowData.title}
      </Link>
    )
  }

  const assigneeBody = (rowData: any) => {
    if (!rowData.assignee) return '—'
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
          {rowData.assignee.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm">{rowData.assignee.fullName}</span>
      </div>
    )
  }

  const statusBody = (rowData: any) => {
    return <StatusBadge status={rowData.status} />
  }

  const priorityBody = (rowData: any) => {
    if (!rowData.priority) return '—'
    return <PriorityBadge priority={rowData.priority} />
  }

  const ticketBody = (rowData: any) => {
    if (!rowData.ticket) return '—'
    return (
      <Link
        href={`/tickets/${rowData.ticket.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
      >
        {rowData.ticket.ticketNumber}
      </Link>
    )
  }

  const drawingBody = (rowData: any) => {
    if (!rowData.drawing) return '—'
    return (
      <Link
        href={`/bids/${bidId}/drawings/${rowData.drawing.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
      >
        {rowData.drawing.drawingNumber}
      </Link>
    )
  }

  const dueDateBody = (rowData: any) => {
    if (!rowData.dueDate) return '—'
    const date = new Date(rowData.dueDate)
    const isOverdue = date < new Date() && rowData.status !== 'completed'
    return (
      <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
        {date.toLocaleDateString()}
      </span>
    )
  }

  const actionsBody = (rowData: any) => {
    return (
      <button
        onClick={() => router.push(`/tasks/${rowData.id}`)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        View
      </button>
    )
  }

  if (errorBid) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error loading bid: {errorBid.message}</p>
            </div>
          </div>
        </div>
    )
  }

  if (loadingBid) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading bid report...</p>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-3">
            <nav className="flex items-center text-sm text-gray-500">
              <Link href="/reports/bids" className="hover:text-gray-700 hover:underline">
                Bids
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{bid?.bidNumber || '...'}</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Bid Report</span>
            </nav>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Bid Report</h1>
          </div>

          {/* Bid Basic Details Card */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bid Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                {/* Left Column */}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bid #</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/bids/${bidId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {bid?.bidNumber || '—'}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bid Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{bid?.bidName || '—'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Bid Manager</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {bid?.bidManager?.fullName || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Drafting Manager</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {bid?.draftingManager?.fullName || '—'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Closing Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {bid?.bidClosingDate
                      ? new Date(bid.bidClosingDate).toLocaleDateString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-sm text-gray-900">{bid?.industry || '—'}</dd>
                </div>

                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {[bid?.cityTown, bid?.state, bid?.country].filter(Boolean).join(', ') ||
                      '—'}
                  </dd>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                      {metrics.totalTickets}
                    </div>
                    <div className="text-sm text-purple-600">Tickets</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                      {metrics.totalDrawings}
                    </div>
                    <div className="text-sm text-purple-600">Drawings</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                      {metrics.totalTasks}
                    </div>
                    <div className="text-sm text-purple-600">Total Tasks</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {metrics.inProgressTasks}
                    </div>
                    <div className="text-sm text-blue-600">Task In-Progress</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">
                      {metrics.pendingTasks}
                    </div>
                    <div className="text-sm text-yellow-600">Task Pending</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-700">
                      {metrics.completedTasks}
                    </div>
                    <div className="text-sm text-amber-600">Task Completed</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="text-2xl font-bold text-red-700">{metrics.overdueTasks}</div>
                    <div className="text-sm text-red-600">Task Overdue Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets & Drawings Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Tickets Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets</h3>

                {/* Status Filters */}
                <div className="mb-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="ticket-pending"
                      checked={ticketStatusFilters.includes('pending')}
                      onChange={() => toggleTicketStatus('pending')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="ticket-pending" className="text-xs cursor-pointer select-none">
                      Pending ({ticketCounts.pending})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="ticket-ongoing"
                      checked={ticketStatusFilters.includes('ongoing')}
                      onChange={() => toggleTicketStatus('ongoing')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="ticket-ongoing" className="text-xs cursor-pointer select-none">
                      Ongoing ({ticketCounts.ongoing})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="ticket-completed"
                      checked={ticketStatusFilters.includes('completed')}
                      onChange={() => toggleTicketStatus('completed')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="ticket-completed" className="text-xs cursor-pointer select-none">
                      Completed ({ticketCounts.completed})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="ticket-cancelled"
                      checked={ticketStatusFilters.includes('cancelled')}
                      onChange={() => toggleTicketStatus('cancelled')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="ticket-cancelled" className="text-xs cursor-pointer select-none">
                      Cancelled ({ticketCounts.cancelled})
                    </label>
                  </div>
                </div>

                {/* Tickets List */}
                <div className="border-2 border-gray-300 rounded-lg max-h-80 overflow-y-auto bg-gray-50">
                  {loadingTickets ? (
                    <div className="p-4 text-center text-gray-500">Loading tickets...</div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No tickets found</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredTickets.map((ticket) => (
                        <div key={ticket.id} className="p-2.5 hover:bg-blue-50 bg-white transition-colors">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              inputId={`ticket-${ticket.id}`}
                              checked={selectedTicketIds.includes(ticket.id)}
                              onChange={() => toggleTicket(ticket.id)}
                              className="w-4 h-4 flex-shrink-0 border-2 border-gray-400"
                            />
                            <label
                              htmlFor={`ticket-${ticket.id}`}
                              className="text-sm cursor-pointer flex-1 select-none flex items-center gap-2"
                            >
                              <span className="font-medium text-blue-600">
                                {ticket.ticketNumber}
                              </span>
                              <span>- {ticket.ticketName}</span>
                            </label>
                            <Tag
                              value={ticket.status}
                              severity={getTicketStatusSeverity(ticket.status)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawings Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawings</h3>

                {/* Status Filters */}
                <div className="mb-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-open"
                      checked={drawingStatusFilters.includes('Open')}
                      onChange={() => toggleDrawingStatus('Open')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-open" className="text-xs cursor-pointer select-none">
                      Open ({drawingCounts.Open})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-designing"
                      checked={drawingStatusFilters.includes('Designing')}
                      onChange={() => toggleDrawingStatus('Designing')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-designing" className="text-xs cursor-pointer select-none">
                      Designing ({drawingCounts.Designing})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-review"
                      checked={drawingStatusFilters.includes('Internal review')}
                      onChange={() => toggleDrawingStatus('Internal review')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-review" className="text-xs cursor-pointer select-none">
                      Internal review ({drawingCounts['Internal review']})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-revision"
                      checked={drawingStatusFilters.includes('Internal revision')}
                      onChange={() => toggleDrawingStatus('Internal revision')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-revision" className="text-xs cursor-pointer select-none">
                      Internal revision ({drawingCounts['Internal revision']})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-approval"
                      checked={drawingStatusFilters.includes('Internal Approval')}
                      onChange={() => toggleDrawingStatus('Internal Approval')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-approval" className="text-xs cursor-pointer select-none">
                      Internal Approval ({drawingCounts['Internal Approval']})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-submitted"
                      checked={drawingStatusFilters.includes('Submitted')}
                      onChange={() => toggleDrawingStatus('Submitted')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-submitted" className="text-xs cursor-pointer select-none">
                      Submitted ({drawingCounts.Submitted})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-on-review"
                      checked={drawingStatusFilters.includes('On review')}
                      onChange={() => toggleDrawingStatus('On review')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-on-review" className="text-xs cursor-pointer select-none">
                      On review ({drawingCounts['On review']})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-revision-ongoing"
                      checked={drawingStatusFilters.includes('Revision ongoing')}
                      onChange={() => toggleDrawingStatus('Revision ongoing')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-revision-ongoing" className="text-xs cursor-pointer select-none">
                      Revision ongoing ({drawingCounts['Revision ongoing']})
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      inputId="drawing-approved"
                      checked={drawingStatusFilters.includes('Approved')}
                      onChange={() => toggleDrawingStatus('Approved')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="drawing-approved" className="text-xs cursor-pointer select-none">
                      Approved ({drawingCounts.Approved})
                    </label>
                  </div>
                </div>

                {/* Drawings List */}
                <div className="border-2 border-gray-300 rounded-lg max-h-80 overflow-y-auto bg-gray-50">
                  {loadingDrawings ? (
                    <div className="p-4 text-center text-gray-500">Loading drawings...</div>
                  ) : filteredDrawings.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No drawings found</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredDrawings.map((drawing) => (
                        <div key={drawing.id} className="p-2.5 hover:bg-blue-50 bg-white transition-colors">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              inputId={`drawing-${drawing.id}`}
                              checked={selectedDrawingIds.includes(drawing.id)}
                              onChange={() => toggleDrawing(drawing.id)}
                              className="w-4 h-4 flex-shrink-0 border-2 border-gray-400"
                            />
                            <label
                              htmlFor={`drawing-${drawing.id}`}
                              className="text-sm cursor-pointer flex-1 select-none flex items-center gap-2"
                            >
                              <span className="font-medium text-blue-600">
                                {drawing.drawingNumber}
                              </span>
                              <span>- {drawing.drawingName}</span>
                            </label>
                            <Tag
                              value={drawing.status}
                              severity={getDrawingStatusSeverity(drawing.status)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>

              <DataTable
                value={filteredTasks}
                loading={loadingTasks}
                emptyMessage="No tasks found"
                stripedRows
                showGridlines
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                className="text-sm"
              >
                <Column field="title" header="Task Title" sortable body={taskTitleBody} />
                <Column header="Assignee" body={assigneeBody} />
                <Column field="status" header="Status" sortable body={statusBody} />
                <Column field="priority" header="Priority" sortable body={priorityBody} />
                <Column header="Ticket" body={ticketBody} />
                <Column header="Drawing" body={drawingBody} />
                <Column field="dueDate" header="Due Date" sortable body={dueDateBody} />
                <Column header="Actions" body={actionsBody} style={{ width: '100px' }} />
              </DataTable>
            </div>
          </div>
        </div>
      </div>
  )
}
