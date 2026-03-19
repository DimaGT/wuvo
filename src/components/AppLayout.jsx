'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './AppLayout.css'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/progress', label: 'Progress' },
  { path: '/gym-scan', label: 'Gym Scan' },
  { path: '/pantry-scan', label: 'Pantry Scan' },
  { path: '/integrations', label: 'Integrations' },
  { path: '/book', label: 'Book' },
  { path: '/labs', label: 'Labs' },
  { path: '/coach', label: 'Coach' },
  { path: '/profile', label: 'Profile' },
  { path: '/auth', label: 'Auth' },
  { path: '/assessment', label: 'Assessment' },
  { path: '/pricing', label: 'Pricing' },
]

export function AppLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="app-logo">
            Wuvo
          </Link>
          <nav className="app-nav">
            {NAV_ITEMS.map(({ path, label }) => (
              <Link
                key={path}
                href={path}
                className={`app-nav-link ${pathname === path || (path === '/dashboard' && pathname === '/') ? 'active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
    </div>
  )
}
