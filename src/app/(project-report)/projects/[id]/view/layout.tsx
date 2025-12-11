'use client'

import AppLayout from '@/components/layout/AppLayout'

/**
 * Layout for Project Report View Page
 *
 * This route group "(project-report)" bypasses the Reports layout
 * to provide a clean full-page view with only AppLayout.
 */
export default function ProjectReportViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}
