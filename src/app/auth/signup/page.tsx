'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to signin page which now handles both signin and signup
    router.replace('/auth/signin')
  }, [router])

  return null
}
