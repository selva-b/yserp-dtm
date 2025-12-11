'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// import { Header } from './Header'
import { useAuth } from '@/contexts/AuthContext'
// import GlobalUploadModals from '@/components/common/GlobalUploadModals'

interface NavigationItem {
  name: string
  href: string
  icon: JSX.Element
  children?: NavigationItem[]
  permission?: string // Optional permission key for RBAC
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: 'Bids',
    href: '/bids',
    permission: 'bids.view:list',
    icon: (
      <svg
        className="h-5 w-5"
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
    ),
  },
  {
    name: 'Projects',
    href: '/projects',
    permission: 'projects.view:list',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    name: 'Tickets',
    href: '/tickets',
    permission: 'tickets.view:list',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
      </svg>
    ),
  },
  {
    name: 'Tasks',
    href: '/tasks',
    permission: 'tasks.view:list',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    name: 'Timesheets',
    href: '/timesheets',
    permission: 'timesheets.view:list',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    name: 'Customer',
    href: '/contacts',
    permission: 'contacts.end_users.view:list',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    children: [
      {
        name: 'End Users',
        href: '/contacts/end-users',
        permission: 'contacts.end_users.view:list',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
      },
      {
        name: 'Contractors',
        href: '/contacts/contractors',
        permission: 'contacts.contractors.view:list',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
      },
      {
        name: 'Consultants',
        href: '/contacts/consultants',
        permission: 'contacts.consultants.view:list',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    permission: 'audit_logs.view:list',
    icon: (
      <svg
        className="h-5 w-5"
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
    ),
  },
  {
    name: 'Reports',
    href: '/reports',
    permission: 'reports.drawings.view:list',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    name: 'User Management',
    href: '/user-management/users',
    permission: 'user_mgmt.menu:access',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    children: [
      {
        name: 'Users',
        href: '/user-management/users',
        permission: 'user_mgmt.users.view:list',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ),
      },
      {
        name: 'Roles & Permissions',
        href: '/user-management/roles',
        permission: 'user_mgmt.roles.view:list',
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
      },
    ],
  },
  // {
  //   name: 'Settings',
  //   href: '/settings/profile',
  //   permission: 'settings.profile.view',
  //   icon: (
  //     <svg
  //       className="h-5 w-5"
  //       fill="none"
  //       stroke="currentColor"
  //       viewBox="0 0 24 24"
  //       xmlns="http://www.w3.org/2000/svg"
  //     >
  //       <path
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //         strokeWidth={2}
  //         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
  //       />
  //       <path
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //         strokeWidth={2}
  //         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  //       />
  //     </svg>
  //   ),
  //   children: [
  //     {
  //       name: 'Profile',
  //       href: '/settings/profile',
  //       permission: 'settings.profile.view',
  //       icon: (
  //         <svg
  //           className="h-4 w-4"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //           xmlns="http://www.w3.org/2000/svg"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
  //           />
  //         </svg>
  //       ),
  //     },
  //     {
  //       name: 'Organization',
  //       href: '/settings/organization',
  //       permission: 'settings.organization.view',
  //       icon: (
  //         <svg
  //           className="h-4 w-4"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //           xmlns="http://www.w3.org/2000/svg"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  //           />
  //         </svg>
  //       ),
  //     },
  //     {
  //       name: 'Systems',
  //       href: '/settings/systems',
  //       permission: 'settings.systems.view:list',
  //       icon: (
  //         <svg
  //           className="h-4 w-4"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //           xmlns="http://www.w3.org/2000/svg"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
  //           />
  //         </svg>
  //       ),
  //     },
  //     {
  //       name: 'Naming Conventions',
  //       href: '/settings/naming-conventions',
  //       permission: 'settings.naming.view',
  //       icon: (
  //         <svg
  //           className="h-4 w-4"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //           xmlns="http://www.w3.org/2000/svg"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
  //           />
  //         </svg>
  //       ),
  //     },
  //   ],
  // },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, hasPermission } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [manuallyToggled, setManuallyToggled] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['User Management', 'Customer', 'Settings'])
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hoverZoneRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Redirect to sign-in if not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      console.log('[AppLayout] User not authenticated, redirecting to sign-in')
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // Handle hover detection for auto-open/close on desktop only
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only apply hover behavior on desktop (lg breakpoint and above)
      if (window.innerWidth < 1024) return

      // Skip auto behavior if user manually toggled
      if (manuallyToggled) return

      // Determine sidebar width based on collapsed state
      const sidebarWidth = sidebarCollapsed ? 64 : 256
      const hoverTriggerZone = 60 // px from left edge to trigger opening

      const isInHoverZone = e.clientX <= hoverTriggerZone
      const isOverSidebar = e.clientX <= sidebarWidth

      // Clear any existing timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }

      // Auto-open when mouse enters hover zone and sidebar is collapsed
      if (isInHoverZone && sidebarCollapsed && !isHovering) {
        hoverTimeoutRef.current = setTimeout(() => {
          setSidebarCollapsed(false)
          setIsHovering(true)
        }, 50) // 50ms delay before opening (faster)
      }

      // Auto-close when mouse moves away from expanded sidebar
      if (!isOverSidebar && !sidebarCollapsed && isHovering) {
        closeTimeoutRef.current = setTimeout(() => {
          setSidebarCollapsed(true)
          setIsHovering(false)
        }, 200) // 200ms delay before closing (faster)
      }

      // Keep sidebar open while hovering over it
      if (isOverSidebar) {
        if (!sidebarCollapsed) {
          setIsHovering(true)
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [sidebarCollapsed, isHovering, manuallyToggled])

  // Handle manual toggle from header
  const handleManualToggle = () => {
    const newCollapsedState = !sidebarCollapsed
    setSidebarCollapsed(newCollapsedState)
    setIsHovering(false)
    setManuallyToggled(true)

    // Clear any pending hover timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // Re-enable auto behavior after 3 seconds
    setTimeout(() => {
      setManuallyToggled(false)
    }, 3000)
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    // TODO: Implement proper sign out with API call
    router.push('/auth/signin')
  }

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName) ? prev.filter((m) => m !== menuName) : [...prev, menuName]
    )
  }

  const isActive = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isMenuExpanded = (menuName: string): boolean => {
    return expandedMenus.includes(menuName)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Left vertical navigation */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Logo/Header - matches Header height */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 overflow-hidden">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <h1 className={`text-lg font-bold text-gray-900 whitespace-nowrap transition-opacity duration-300 ${
                sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100'
              }`}>YSERP</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation
                .filter((item) => {
                  // Hide Tickets menu for Draftsman role
                  if (item.name === 'Tickets' && user?.role === 'Draftsman') {
                    return false
                  }
                  if (!item.permission) return true
                  return hasPermission(item.permission)
                })
                .map((item) => (
                <div key={item.name}>
                  {/* Main menu item */}
                  {item.children ? (
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors overflow-hidden ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0">{item.icon}</div>
                        <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${
                          sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100'
                        }`}>{item.name}</span>
                      </div>
                      <svg
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                          isMenuExpanded(item.name) ? 'rotate-90' : ''
                        } ${
                          sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors overflow-hidden ${
                        isActive(item.href)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <div className="flex-shrink-0">{item.icon}</div>
                      <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${
                        sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100'
                      }`}>{item.name}</span>
                    </button>
                  )}

                  {/* Submenu items - hidden when collapsed */}
                  {item.children && isMenuExpanded(item.name) && !sidebarCollapsed && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children
                        .filter((child) => {
                          if (!child.permission) return true
                          return hasPermission(child.permission)
                        })
                        .map((child) => (
                        <button
                          key={child.name}
                          onClick={() => router.push(child.href)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors overflow-hidden ${
                            isActive(child.href)
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex-shrink-0">{child.icon}</div>
                          <span className="ml-3 whitespace-nowrap">{child.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content area - with Header at top */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Header - Top horizontal bar with search and profile */}
        {/* <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onToggleSidebar={handleManualToggle}
          sidebarCollapsed={sidebarCollapsed}
        /> */}

        {/* Page content */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>

      {/* Global Upload Modals (includes auto-resume after page refresh) */}
      {/* <GlobalUploadModals /> */}
    </div>
  )
}

