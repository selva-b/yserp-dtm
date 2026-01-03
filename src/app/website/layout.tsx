'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Reset scroll position on route change
    window.scrollTo(0, 0)
  }, [pathname])

  return <>{children}</>
}

