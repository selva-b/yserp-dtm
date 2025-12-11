'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'

/**
 * Reports Layout Component
 *
 * Provides tabbed navigation for different report types:
 * - Drawings
 * - Projects
 * - Bids
 * - Tickets
 * - Tasks
 * - Users (Workload)
 */
export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Drawings', href: '/reports/drawings', current: pathname === '/reports/drawings' },
    { name: 'Projects', href: '/reports/projects', current: pathname === '/reports/projects' },
    { name: 'Bids', href: '/reports/bids', current: pathname === '/reports/bids' },
    { name: 'Tickets', href: '/reports/tickets', current: pathname === '/reports/tickets' },
    { name: 'Tasks', href: '/reports/tasks', current: pathname === '/reports/tasks' },
    { name: 'Users', href: '/reports/users', current: pathname === '/reports/users' },
  ]

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="py-6 px-6">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and analyze data across your organization
            </p>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="px-6 mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors duration-200
                    ${
                      tab.current
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-6 py-8">
          {children}
        </main>
      </div>
    </AppLayout>
  )
}
