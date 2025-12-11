'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Reports Index Page
 *
 * Redirects to the default report (Drawings)
 */
export default function ReportsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/reports/drawings')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    </div>
  )
}
