'use client'

import AppLayout from '@/components/layout/AppLayout'

/**
 * Layout for Bid Report View Page
 *
 * This route group "(bid-report)" bypasses the Reports layout
 * to provide a clean full-page view with only AppLayout.
 */
export default function BidReportViewLayout({
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
