'use client'

import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import StatsGrid from '@/components/dashboard/StatsGrid'
import RecentActivities from '@/components/dashboard/RecentActivities'
import { useDashboardStats, useDashboardActivities } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useDashboardActivities()

  const userRole = user?.role

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="py-6 px-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {user?.fullName || 'User'}!
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {userRole || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6 px-6">
          <div>
            {/* Error States */}
            {statsError && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Please try refreshing the page or contact support if the problem persists.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {statsLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            )}

            {/* Stats Grid */}
            {!statsLoading && !statsError && stats && (
              <>
                <StatsGrid stats={stats} userRole={userRole} />

                {/* Recent Activities Section */}
                {!activitiesLoading && !activitiesError && activities && (
                  <RecentActivities activities={activities} userRole={userRole} />
                )}

                {/* Activities Loading State */}
                {activitiesLoading && (
                  <div className="mt-8 text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 text-sm">Loading recent activities...</p>
                  </div>
                )}

                {/* Activities Error State */}
                {activitiesError && (
                  <div className="mt-8 rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Unable to load recent activities
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Some information may not be available at this time.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State - No Activities */}
                {!activitiesLoading &&
                  !activitiesError &&
                  activities &&
                  activities.recentBids.length === 0 &&
                  activities.recentProjects.length === 0 &&
                  activities.recentTasks.length === 0 &&
                  activities.recentTickets.length === 0 && (
                    <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activities</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating bids, projects, or tasks.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
