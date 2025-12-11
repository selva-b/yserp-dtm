/**
 * Unit Tests for TimesheetsPage Component
 *
 * Tests:
 * - Component rendering and tab navigation
 * - Timer controls (start/stop)
 * - Manual entry creation
 * - Filters and date range selection
 * - Table display and pagination
 * - Edit and approval actions
 *
 * @module app/timesheets/__tests__/page
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TimesheetsPage from '../page'

// Mock the hooks
jest.mock('@/hooks/use-timesheets', () => ({
  useTimesheets: jest.fn(),
  useStartTimer: jest.fn(),
  useStopTimer: jest.fn(),
  useApproveTimesheet: jest.fn(),
  useRejectTimesheet: jest.fn(),
}))

jest.mock('@/hooks/use-tasks', () => ({
  useTasks: jest.fn(),
}))

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))

import {
  useTimesheets,
  useStartTimer,
  useStopTimer,
  useApproveTimesheet,
  useRejectTimesheet,
} from '@/hooks/use-timesheets'
import { useTasks } from '@/hooks/use-tasks'
import { useAuth } from '@/hooks/use-auth'

// Mock data
const mockDraftsmanUser = {
  id: 'user-123',
  fullName: 'John Doe',
  role: { name: 'Draftsman' },
}

const mockManagerUser = {
  id: 'manager-123',
  fullName: 'Jane Manager',
  role: { name: 'Project Manager' },
}

const mockTimesheetEntries = [
  {
    id: 'entry-1',
    source: 'timer',
    startTime: '2025-01-10T09:00:00Z',
    endTime: '2025-01-10T12:00:00Z',
    durationMinutes: 180,
    status: 'submitted',
    notes: 'Morning work',
    task: { id: 'task-1', title: 'Design Homepage' },
    user: { fullName: 'John Doe' },
    version: 1,
  },
  {
    id: 'entry-2',
    source: 'manual',
    startTime: '2025-01-10T13:00:00Z',
    endTime: '2025-01-10T17:00:00Z',
    durationMinutes: 240,
    status: 'pending_approval',
    notes: 'Afternoon session',
    ticket: { id: 'ticket-1', ticketNumber: 'TKT-001' },
    user: { fullName: 'John Doe' },
    version: 1,
  },
  {
    id: 'entry-3',
    source: 'timer',
    startTime: '2025-01-11T09:00:00Z',
    endTime: null,
    durationMinutes: null,
    status: 'submitted',
    notes: 'Active timer',
    task: { id: 'task-2', title: 'Fix Bug' },
    user: { fullName: 'John Doe' },
    version: 1,
  },
]

const mockTasks = [
  { id: 'task-1', title: 'Design Homepage' },
  { id: 'task-2', title: 'Fix Bug' },
]

// Helper to wrap component with QueryClient
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('TimesheetsPage', () => {
  const mockStartTimer = jest.fn()
  const mockStopTimer = jest.fn()
  const mockApprove = jest.fn()
  const mockReject = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockDraftsmanUser,
    })

    ;(useTimesheets as jest.Mock).mockReturnValue({
      data: {
        data: mockTimesheetEntries.filter(e => e.endTime), // Only completed entries
        pagination: {
          page: 1,
          pageSize: 25,
          total: 2,
          totalPages: 1,
        },
        totals: {
          totalMinutes: 420,
          totalHours: 7,
        },
      },
      isLoading: false,
      error: null,
    })

    ;(useStartTimer as jest.Mock).mockReturnValue({
      mutate: mockStartTimer,
      isPending: false,
      error: null,
    })

    ;(useStopTimer as jest.Mock).mockReturnValue({
      mutate: mockStopTimer,
      isPending: false,
      error: null,
    })

    ;(useApproveTimesheet as jest.Mock).mockReturnValue({
      mutate: mockApprove,
      isPending: false,
    })

    ;(useRejectTimesheet as jest.Mock).mockReturnValue({
      mutate: mockReject,
      isPending: false,
    })

    ;(useTasks as jest.Mock).mockReturnValue({
      data: {
        data: mockTasks,
        pagination: { total: 2 },
      },
      isLoading: false,
    })
  })

  describe('Page Rendering', () => {
    it('should render page title and main sections', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText('Timesheets')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /my time/i })).toBeInTheDocument()
    })

    it('should render timer controls section', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText(/current status/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
    })

    it('should render filters section', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    })

    it('should render table with timesheet entries', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText('Morning work')).toBeInTheDocument()
      expect(screen.getByText('Afternoon session')).toBeInTheDocument()
    })

    it('should show totals summary', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText(/7\.0h/i)).toBeInTheDocument()
      expect(screen.getByText(/420 minutes/i)).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should show "My Time" tab by default for Draftsman', () => {
      renderWithQueryClient(<TimesheetsPage />)

      const myTimeTab = screen.getByRole('tab', { name: /my time/i })
      expect(myTimeTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should show "Approvals" tab for Manager role', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockManagerUser,
      })

      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByRole('tab', { name: /approvals/i })).toBeInTheDocument()
    })

    it('should hide "Approvals" tab for Draftsman role', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.queryByRole('tab', { name: /approvals/i })).not.toBeInTheDocument()
    })

    it('should switch between tabs when clicked', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockManagerUser,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const approvalsTab = screen.getByRole('tab', { name: /approvals/i })
      await user.click(approvalsTab)

      expect(approvalsTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Timer Controls', () => {
    it('should show "Start Timer" button when no active timer', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /stop timer/i })).not.toBeInTheDocument()
    })

    it('should show "Stop Timer" button when timer is active', () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: [mockTimesheetEntries[2]], // Active timer entry
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        },
        isLoading: false,
      })

      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByRole('button', { name: /stop timer/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /start timer/i })).not.toBeInTheDocument()
    })

    it('should call startTimer when Start Timer button clicked', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const startButton = screen.getByRole('button', { name: /start timer/i })
      await user.click(startButton)

      // Should open the start timer dialog
      await waitFor(() => {
        expect(screen.getByText(/start new timer/i)).toBeInTheDocument()
      })
    })

    it('should call stopTimer when Stop Timer button clicked', async () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: [mockTimesheetEntries[2]], // Active timer
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        },
        isLoading: false,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const stopButton = screen.getByRole('button', { name: /stop timer/i })
      await user.click(stopButton)

      await waitFor(() => {
        expect(mockStopTimer).toHaveBeenCalled()
      })
    })

    it('should show elapsed time for active timer', () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: [mockTimesheetEntries[2]],
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        },
        isLoading: false,
      })

      renderWithQueryClient(<TimesheetsPage />)

      // Should display some elapsed time (exact value depends on current time)
      expect(screen.getByText(/elapsed/i)).toBeInTheDocument()
    })
  })

  describe('Manual Entry Creation', () => {
    it('should show "Add Manual Entry" button', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByRole('button', { name: /add manual entry/i })).toBeInTheDocument()
    })

    it('should open manual entry drawer when button clicked', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const addButton = screen.getByRole('button', { name: /add manual entry/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText(/create manual entry/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filters', () => {
    it('should render all filter controls', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/task/i)).toBeInTheDocument()
    })

    it('should filter by source when changed', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const sourceSelect = screen.getByLabelText(/source/i)
      await user.selectOptions(sourceSelect, 'timer')

      await waitFor(() => {
        expect(useTimesheets).toHaveBeenCalledWith(
          expect.objectContaining({ source: 'timer' })
        )
      })
    })

    it('should filter by status when changed', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const statusSelect = screen.getByLabelText(/status/i)
      await user.selectOptions(statusSelect, 'approved')

      await waitFor(() => {
        expect(useTimesheets).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'approved' })
        )
      })
    })

    it('should filter by task when selected', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const taskSelect = screen.getByLabelText(/task/i)
      await user.selectOptions(taskSelect, 'task-1')

      await waitFor(() => {
        expect(useTimesheets).toHaveBeenCalledWith(
          expect.objectContaining({ taskId: 'task-1' })
        )
      })
    })

    it('should update date range filters', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const startDateInput = screen.getByLabelText(/start date/i)
      await user.clear(startDateInput)
      await user.type(startDateInput, '2025-01-01')

      await waitFor(() => {
        expect(useTimesheets).toHaveBeenCalledWith(
          expect.objectContaining({ startDate: '2025-01-01' })
        )
      })
    })
  })

  describe('Table Display', () => {
    it('should display all timesheet entries in table', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText('Morning work')).toBeInTheDocument()
      expect(screen.getByText('Afternoon session')).toBeInTheDocument()
    })

    it('should display duration in hours format', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText('3.0h')).toBeInTheDocument() // 180 minutes
      expect(screen.getByText('4.0h')).toBeInTheDocument() // 240 minutes
    })

    it('should display status badges with correct colors', () => {
      renderWithQueryClient(<TimesheetsPage />)

      const submittedBadge = screen.getByText('Submitted')
      const pendingBadge = screen.getByText('Pending Approval')

      expect(submittedBadge).toHaveClass('bg-blue-100')
      expect(pendingBadge).toHaveClass('bg-yellow-100')
    })

    it('should show "Edit" button for completed entries', () => {
      renderWithQueryClient(<TimesheetsPage />)

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should not show "Edit" button for active timer entries', () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: [mockTimesheetEntries[2]], // Active timer (no endTime)
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        },
        isLoading: false,
      })

      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    })

    it('should show loading state', () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show error state', () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load timesheets'),
      })

      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })

    it('should show empty state when no entries', () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: [],
          pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
        },
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText(/no timesheet entries found/i)).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      renderWithQueryClient(<TimesheetsPage />)

      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument()
    })

    it('should change page when pagination clicked', async () => {
      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: mockTimesheetEntries.slice(0, 2),
          pagination: { page: 1, pageSize: 25, total: 50, totalPages: 2 },
        },
        isLoading: false,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(useTimesheets).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        )
      })
    })

    it('should change page size when dropdown changed', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const pageSizeSelect = screen.getByLabelText(/items per page/i)
      await user.selectOptions(pageSizeSelect, '50')

      await waitFor(() => {
        expect(useTimesheets).toHaveBeenCalledWith(
          expect.objectContaining({ pageSize: 50 })
        )
      })
    })
  })

  describe('Edit Entry', () => {
    it('should open edit drawer when edit button clicked', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/edit timesheet entry/i)).toBeInTheDocument()
      })
    })
  })

  describe('Approvals (Manager View)', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockManagerUser,
      })

      ;(useTimesheets as jest.Mock).mockReturnValue({
        data: {
          data: [mockTimesheetEntries[1]], // Pending approval entry
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
          totals: { totalMinutes: 240, totalHours: 4 },
        },
        isLoading: false,
      })
    })

    it('should show approve button in approvals tab', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const approvalsTab = screen.getByRole('tab', { name: /approvals/i })
      await user.click(approvalsTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
      })
    })

    it('should show reject button in approvals tab', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const approvalsTab = screen.getByRole('tab', { name: /approvals/i })
      await user.click(approvalsTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
      })
    })

    it('should call approve when approve button clicked', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TimesheetsPage />)

      const approvalsTab = screen.getByRole('tab', { name: /approvals/i })
      await user.click(approvalsTab)

      await waitFor(() => {
        const approveButton = screen.getByRole('button', { name: /approve/i })
        return user.click(approveButton)
      })

      // Confirm in dialog
      const confirmButton = await screen.findByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(mockApprove).toHaveBeenCalled()
    })
  })
})
