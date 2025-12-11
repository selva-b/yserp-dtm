import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - YSERP-DTM',
  description: 'Sign in or sign up to YSERP-DTM',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
