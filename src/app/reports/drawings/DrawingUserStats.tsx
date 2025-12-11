'use client'

import { useMemo } from 'react'
import { useTimesheets } from '@/hooks/use-timesheets'
import type { TimesheetEntry } from '@/services/timesheets.service'

interface DrawingUserStatsProps {
    drawingId: string
}

interface UserStat {
    userId: string
    name: string
    email: string
    durationMinutes: number
    totalDays: number
}

export function DrawingUserStats({ drawingId }: DrawingUserStatsProps) {
    // Fetch timesheets for this drawing
    // We fetch all records to ensure accurate totals
    const { data, isLoading, error } = useTimesheets({
        drawingIds: drawingId,
        pageSize: 1000, // Fetch enough to cover most cases
    })

    // Aggregate data
    const userStats = useMemo(() => {
        if (!data?.data) return []

        const statsMap = new Map<string, {
            name: string
            email: string
            durationMinutes: number
            dates: Set<string>
        }>()

        data.data.forEach((entry: TimesheetEntry) => {
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

        return Array.from(statsMap.entries()).map(([userId, stat]) => ({
            userId,
            name: stat.name,
            email: stat.email,
            durationMinutes: stat.durationMinutes,
            totalDays: stat.dates.size,
        }))
    }, [data])

    if (isLoading) {
        return (
            <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-500">Loading user statistics...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-4 px-6 text-sm text-red-600 bg-red-50 rounded-md">
                Error loading user statistics. Please try again.
            </div>
        )
    }

    if (userStats.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-md">
                No work logged for this drawing yet.
            </div>
        )
    }

    return (
        <div className="py-2">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
                Users worked on this drawing ({userStats.length})
            </h4>
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {userStats.map((stat) => (
                            <tr key={stat.userId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                                            {getInitials(stat.name)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                                            <div className="text-xs text-gray-500">{stat.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(stat.durationMinutes / 60).toFixed(2)}h
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {stat.totalDays} days
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}
