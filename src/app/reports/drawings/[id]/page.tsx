'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useDrawingsReport } from '@/hooks/use-reports'
import { useTasks } from '@/hooks/use-tasks'
import { useTimesheets } from '@/hooks/use-timesheets'
import { useMemo, useState } from 'react'
import 'primeicons/primeicons.css';
import type { TimesheetEntry } from '@/services/timesheets.service'
import { getApiUrl } from '@/lib/config'
import { apiClientBlob } from '@/lib/api-client'
import { toast } from 'sonner'

export default function DrawingReportDetailPage() {
    const params = useParams()
    const drawingId = params.id as string
    const [isExporting, setIsExporting] = useState(false)

    // Fetch drawing details (without user stats from backend service)
    const { data: reportData, isLoading: isLoadingReport, error: reportError } = useDrawingsReport({
        ids: [drawingId],
        includeUserStats: false,
    })

    const drawing = reportData?.data?.[0]

    // Fetch tasks linked to this drawing
    const { data: tasksData, isLoading: isLoadingTasks } = useTasks({
        drawingId: drawingId,
        pageSize: 100,
    })

    // Fetch timesheets for this drawing to calculate user stats locally
    // This ensures we include all relevant work (including pending) and match the main table logic
    const { data: timesheetsData, isLoading: isLoadingTimesheets } = useTimesheets({
        drawingIds: drawingId,
        pageSize: 1000,
    })

    // Aggregate user stats locally
    const { userStats, totalDuration, totalDays } = useMemo(() => {
        if (!timesheetsData?.data) return { userStats: [], totalDuration: 0, totalDays: 0 }

        const statsMap = new Map<string, {
            name: string
            email: string
            durationMinutes: number
            dates: Set<string>
        }>()

        timesheetsData.data.forEach((entry: TimesheetEntry) => {
            if (!entry.user) return

            const userId = entry.user.id
            const date = entry.startTime.split('T')[0]
            const duration = entry.durationMinutes || 0

            if (!statsMap.has(userId)) {
                statsMap.set(userId, {
                    name: entry.user.fullName,
                    email: entry.user.email,
                    durationMinutes: 0,
                    dates: new Set(),
                })
            }

            const stat = statsMap.get(userId)!
            stat.durationMinutes += duration
            stat.dates.add(date)
        })

        const stats = Array.from(statsMap.entries()).map(([userId, stat]) => ({
            userId,
            name: stat.name,
            email: stat.email,
            total_hours: stat.durationMinutes / 60,
            total_days: stat.dates.size,
        }))

        // Calculate grand totals
        const totalDuration = stats.reduce((sum, stat) => sum + stat.total_hours, 0)

        // For total days, we count unique dates across ALL entries
        const allDates = new Set<string>()
        timesheetsData.data.forEach((entry: TimesheetEntry) => {
            allDates.add(entry.startTime.split('T')[0])
        })
        const totalDays = allDates.size

        return { userStats: stats, totalDuration, totalDays }
    }, [timesheetsData])

    // Export handler
    const handleExport = async (format: 'csv' | 'xlsx') => {
        try {
            setIsExporting(true)
            const url = getApiUrl(`v1/reports/drawings/${drawingId}/export?format=${format}`)

            // Use apiClientBlob which automatically handles authentication via cookies
            const { blob, filename } = await apiClientBlob(url, {
                method: 'GET',
            })

            // Download the file
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            // Use filename from server or fallback to generated name
            link.download = filename || `drawing-${drawing?.drawing_number || drawingId}-${new Date().toISOString().split('T')[0]}.${format}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(downloadUrl)

            toast.success(`Export successful`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Export failed. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    if (isLoadingReport) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading drawing details...</p>
                </div>
            </div>
        )
    }

    if (reportError || !drawing) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Drawing not found</h3>
                    <p className="mt-2 text-gray-500">The drawing you are looking for could not be found or you do not have permission to view it.</p>
                    <div className="mt-6">
                        <Link href="/reports/drawings" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <i className="pi pi-arrow-left mr-2"></i>
                            Back to Report
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Breadcrumb */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <nav className="flex items-center text-sm font-medium text-gray-500 mb-4">
                            <Link href="/reports/drawings" className="hover:text-gray-700 transition-colors">
                                Drawings Report
                            </Link>
                            <svg className="flex-shrink-0 mx-2 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-900">{drawing.drawing_number}</span>
                        </nav>
                        <div className="md:flex md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                    {drawing.drawing_number}
                                </h1>
                                <p className="mt-1 text-lg text-gray-500">{drawing.drawing_name}</p>
                            </div>
                            <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
                                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${drawing.drawing_status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    drawing.drawing_status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {drawing.drawing_status}
                                </span>

                                {/* Export Buttons */}
                                <button
                                    onClick={() => handleExport('csv')}
                                    disabled={isExporting}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="pi pi-file mr-2"></i>
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => handleExport('xlsx')}
                                    disabled={isExporting}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="pi pi-file-excel mr-2"></i>
                                    Export Excel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

                {/* Metadata Grid */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Drawing Details</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Comprehensive metadata and status information.</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Entity</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold capitalize">
                                    {drawing.entity_type} {drawing.entity_display_number}
                                </dd>
                                <dd className="text-xs text-gray-500">{drawing.entity_name}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">System</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.main_system_name || '—'}</dd>
                                <dd className="text-xs text-gray-500">{drawing.sub_system_name}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Type</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.drawing_type_name || '—'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Revision</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.revision_status || 'Rev 0'}</dd>
                            </div>

                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Progress</dt>
                                <dd className="mt-1 flex items-center">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, drawing.progress_percentage || 0))}%` }}></div>
                                    </div>
                                    <span className="text-sm text-gray-900">{Math.round(drawing.progress_percentage || 0)}%</span>
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Planned Submission</dt>
                                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                    <i className="pi pi-calendar mr-1.5 text-gray-400"></i>
                                    {drawing.planned_submission_date ? new Date(drawing.planned_submission_date).toLocaleDateString() : '—'}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.created_by_name || '—'}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Reviewed By</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.reviewed_by_name || '—'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* User Stats Section */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                <i className="pi pi-users mr-2 text-gray-500"></i>
                                User Work Log
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Detailed breakdown of time spent by each user.</p>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                                <i className="pi pi-clock mr-1"></i>
                                <span>Total: <span className="font-semibold text-gray-900">{Number(totalDuration || 0).toFixed(2)}h</span></span>
                            </div>
                            <div className="flex items-center">
                                <i className="pi pi-calendar mr-1"></i>
                                <span>Days: <span className="font-semibold text-gray-900">{totalDays || 0}</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        {isLoadingTimesheets ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : userStats && userStats.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userStats.map((stat: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{Number(stat.total_hours).toFixed(2)}h</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{stat.total_days}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No work logged for this drawing yet.</p>
                        )}
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <i className="pi pi-list mr-2 text-gray-500"></i>
                            Linked Tasks
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Tasks associated with this drawing.</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        {isLoadingTasks ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : tasksData?.data && tasksData.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Title</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tasksData.data.map((task) => (
                                            <tr key={task.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                                                    {task.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignee?.fullName || 'Unassigned'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No tasks found for this drawing.</p>
                        )}
                    </div>
                </div>

            </main>
        </div>
    )
}
