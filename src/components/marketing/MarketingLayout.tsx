import Link from 'next/link'
import { ReactNode } from 'react'
import HoverFooter from '@/components/website/HoverFooter'

type NavLink = {
  href: string
  label: string
}

const navLinks: NavLink[] = [
  { href: '/website', label: 'Home' },
  { href: '/website/features', label: 'Features' },
  { href: '/website/pricing', label: 'Pricing' },
  { href: '/website/integrations', label: 'Integrations' },
  { href: '/website/support', label: 'Support' },
]

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(10_14_27)] text-white">
      {/* Futuristic Navbar with Border Outline */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            {/* Animated Border Outline */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-[32px] opacity-75 blur-sm animate-pulse" />

            {/* Navbar Container */}
            <nav className="relative bg-gradient-to-br from-gray-900/95 via-gray-950/95 to-black/95 backdrop-blur-xl rounded-[30px] border border-gray-800/50 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link href="/website" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold shadow-lg">
                      V
                    </div>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                    VARAI
                  </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden items-center gap-1 md:flex">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5 group"
                    >
                      <span className="relative z-10">{link.label}</span>
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </Link>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signin"
                    className="hidden md:inline-block px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="relative group overflow-hidden rounded-lg"
                  >
                    <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-70 blur-sm group-hover:opacity-100 transition-opacity" />
                    <div className="relative px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all">
                      Book a demo
                    </div>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Content with top padding to account for fixed navbar */}
      <main className="pt-24">{children}</main>

      <HoverFooter />
    </div>
  )
}

export default MarketingLayout

