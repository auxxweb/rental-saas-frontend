'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { logout, getCurrentUser, getRole } from '@/lib/auth'
import Link from 'next/link'
import ThemeToggle from '@/components/theme/ThemeToggle'

interface LayoutProps {
  children: React.ReactNode
}

// Icon components for modern look
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const ShopsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const SubscriptionsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const ProductsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const CustomersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const JobsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const ReturnsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const role = getRole()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
    }
  }, [router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = () => {
    logout()
  }

  const isSuperAdmin = role === 'super_admin'
  const isShopAdmin = role === 'shop_admin'

  const superAdminNav = [
    { name: 'Dashboard', href: '/super-admin/dashboard', icon: DashboardIcon },
    { name: 'Shops', href: '/super-admin/shops', icon: ShopsIcon },
    { name: 'Chat Support', href: '/super-admin/chat', icon: ChatIcon },
    { name: 'Subscriptions', href: '/super-admin/subscriptions', icon: SubscriptionsIcon },
    { name: 'Reports', href: '/super-admin/reports', icon: ReportsIcon },
  ]

  const shopAdminNav = [
    { name: 'Dashboard', href: '/shop/dashboard', icon: DashboardIcon },
    { name: 'Products', href: '/shop/products', icon: ProductsIcon },
    { name: 'Customers', href: '/shop/customers', icon: CustomersIcon },
    { name: 'Jobs', href: '/shop/jobs', icon: JobsIcon },
    { name: 'Returns', href: '/shop/returns', icon: ReturnsIcon },
    { name: 'Reports', href: '/shop/reports', icon: ReportsIcon },
    { name: 'Settings', href: '/shop/settings/password', icon: SettingsIcon },
  ]

  const navItems = isSuperAdmin ? superAdminNav : shopAdminNav

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Fixed Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0 fixed left-0 top-0 bottom-0 z-30">
        <div className="flex flex-col w-[260px] bg-[var(--sidebar-bg)]">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center">
                <span className="text-[var(--accent-ink)] font-bold text-lg">R</span>
              </div>
              <h1 className="text-xl font-semibold text-[var(--sidebar-text)]">Rental SaaS</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(154,230,110,0.18)] text-[var(--accent)] shadow-lg shadow-[rgba(154,230,110,0.10)]'
                      : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] hover:text-[var(--sidebar-text)]'
                  }`}
                >
                  <IconComponent />
                  <span className="ml-3">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center">
                  <span className="text-[var(--accent-ink)] font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--sidebar-text)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--sidebar-muted)] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] rounded-xl transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[var(--sidebar-bg)] transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center">
                <span className="text-[var(--accent-ink)] font-bold text-lg">R</span>
              </div>
              <h1 className="text-xl font-semibold text-[var(--sidebar-text)]">Rental SaaS</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(154,230,110,0.18)] text-[var(--accent)] shadow-lg shadow-[rgba(154,230,110,0.10)]'
                      : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] hover:text-[var(--sidebar-text)]'
                  }`}
                >
                  <IconComponent />
                  <span className="ml-3">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center">
                <span className="text-[var(--accent-ink)] font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--sidebar-text)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--sidebar-muted)] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] rounded-xl transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-[260px]">
        {/* Top Header */}
        <header className="bg-[var(--surface)] border-b border-[var(--border)] h-20 flex items-center px-6 lg:px-8 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] mr-4"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {navItems.find(item => item.href === pathname || pathname.startsWith(item.href + '/'))?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {/* Profile Avatar */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center ring-2 ring-[var(--surface)]">
                  <span className="text-[var(--accent-ink)] font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
