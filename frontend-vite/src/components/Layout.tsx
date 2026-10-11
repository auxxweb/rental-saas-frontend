import { useEffect, useState, type FC } from 'react'
import Cookies from 'js-cookie'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { logout, getCurrentUser, getRole, ensureSession, type User } from '@/lib/auth'
import { useAppLocaleStore } from '@/store/appLocaleStore'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { getBusinessOwnerTitleKey, getSuperAdminTitleKey } from '@/lib/shopTitle'
import { useAppLocale } from '@/lib/useAppLocale'

interface LayoutProps {
  children: React.ReactNode
}

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

const ShopsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
)

const SubscriptionsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
)

const PlansIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
)

const PlanRequestsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
)

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
)

const ProductsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
)

const InventoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
)

const CategoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
)

const CustomersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

const JobsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
)

const InvoicesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const SupportHelpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

type NavItem = { href: string; icon: FC; key: string }

const superAdminNav: NavItem[] = [
  { key: 'dashboard', href: '/super-admin/dashboard', icon: DashboardIcon },
  { key: 'shops', href: '/super-admin/shops', icon: ShopsIcon },
  { key: 'chatSupport', href: '/super-admin/chat', icon: ChatIcon },
  { key: 'subscriptions', href: '/super-admin/subscriptions', icon: SubscriptionsIcon },
  { key: 'plans', href: '/super-admin/plans', icon: PlansIcon },
  { key: 'planRequests', href: '/super-admin/plan-requests', icon: PlanRequestsIcon },
  { key: 'reports', href: '/super-admin/reports', icon: ReportsIcon },
  { key: 'support', href: '/super-admin/support', icon: SupportHelpIcon },
  { key: 'globalSettings', href: '/super-admin/global-settings', icon: SettingsIcon },
]

const businessOwnerNav: NavItem[] = [
  { key: 'dashboard', href: '/shop/dashboard', icon: DashboardIcon },
  { key: 'products', href: '/shop/products', icon: ProductsIcon },
  { key: 'inventory', href: '/shop/inventory', icon: InventoryIcon },
  { key: 'categories', href: '/shop/categories', icon: CategoryIcon },
  { key: 'customers', href: '/shop/customers', icon: CustomersIcon },
  { key: 'jobs', href: '/shop/jobs', icon: JobsIcon },
  { key: 'invoices', href: '/shop/invoices', icon: InvoicesIcon },
  { key: 'reports', href: '/shop/reports', icon: ReportsIcon },
  { key: 'supportHelp', href: '/shop/support', icon: SupportHelpIcon },
  { key: 'myPlan', href: '/shop/my-plan', icon: SubscriptionsIcon },
  { key: 'settings', href: '/shop/settings', icon: SettingsIcon },
]

function useRtlLayout() {
  const { i18n } = useTranslation('shop')
  const [rtl, setRtl] = useState(false)
  useEffect(() => {
    const sync = () => setRtl(typeof document !== 'undefined' && document.documentElement.dir === 'rtl')
    sync()
    const onI18n = () => sync()
    i18n.on('languageChanged', onI18n)
    const mo = typeof document !== 'undefined' ? new MutationObserver(sync) : null
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] })
    return () => {
      i18n.off('languageChanged', onI18n)
      mo?.disconnect()
    }
  }, [i18n])
  return rtl
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation('shop')
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const [subscriptionExpired, setSubscriptionExpired] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const role = getRole()
  const isSuperAdmin = role === 'super_admin'
  const isShopStaff = role === 'business_owner' || role === 'sub_admin'
  const rtl = useRtlLayout()
  const { countryName, timezone, dialCode, currencySymbol } = useAppLocale()
  const localeNavReady = useAppLocaleStore((s) => s.localeNavReady)

  const titleKey = isShopStaff ? getBusinessOwnerTitleKey(pathname) : getSuperAdminTitleKey(pathname)
  const pageTitle = t(`title.${titleKey}`)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!Cookies.get('token')) {
        navigate('/login', { replace: true })
        return
      }
      const sessionUser = await ensureSession()
      if (cancelled) return
      if (!sessionUser) {
        navigate('/login', { replace: true })
        return
      }
      setUser((prev: User | null) => (prev?._id === sessionUser._id ? prev : sessionUser))
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isShopStaff || !Cookies.get('token')) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get<{ subscriptionStatus?: string }>('/shop/subscription/status')
        if (cancelled) return
        setSubscriptionExpired(data.subscriptionStatus === 'expired')
      } catch {
        if (!cancelled) setSubscriptionExpired(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isShopStaff, pathname])

  const handleLogout = () => {
    logout()
  }

  const linkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return `flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
      isActive
        ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
        : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] hover:text-[var(--sidebar-text)]'
    }`
  }

  const renderNav = (items: NavItem[], onNavigate?: () => void) =>
    items.map((item) => {
      const IconComponent = item.icon
      return (
        <Link
          key={item.href + item.key}
          to={item.href}
          onClick={onNavigate}
          className={linkClass(item.href)}
        >
          <IconComponent />
          <span className={rtl ? 'mr-3 ml-0' : 'ml-3'}>{t(`nav.${item.key}`)}</span>
        </Link>
      )
    })

  if (!user) {
    return (
      <div
        className="admin-shell min-h-screen flex items-center justify-center"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="admin-shell min-h-screen flex min-w-0 overflow-x-hidden">
      <aside
        className={`hidden lg:flex lg:flex-shrink-0 fixed top-0 bottom-0 z-30 ${rtl ? 'right-0 left-auto' : 'left-0'}`}
      >
        <div className="flex flex-col h-full w-[260px] bg-[var(--sidebar-bg)] border-e border-[var(--border)]">
          <div className="flex items-center h-20 px-6 border-b border-white/10">
            <div className={`flex items-center ${rtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="h-10 w-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
                <span className="text-[var(--accent-ink)] font-bold text-lg">R</span>
              </div>
              <h1 className="text-xl font-semibold tracking-[-0.03em] text-[var(--sidebar-text)]">{t('layout.brand')}</h1>
            </div>
          </div>

          <nav className="flex-1 min-h-0 px-4 py-6 space-y-1 overflow-y-auto sidebar-nav-no-scrollbar">
            {isShopStaff && renderNav(businessOwnerNav)}
            {isSuperAdmin && renderNav(superAdminNav)}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <span className="text-[var(--accent-ink)] font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className={rtl ? 'mr-3 ml-0 min-w-0 flex-1' : 'ml-3 min-w-0 flex-1'}>
                <p className="text-sm font-medium text-[var(--sidebar-text)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--sidebar-muted)] truncate">{user.email}</p>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--sidebar-muted)] px-1 mb-2">
              {isSuperAdmin
                ? t('layout.roleSuperAdmin')
                : role === 'sub_admin'
                  ? t('layout.roleSubAdmin')
                  : t('layout.roleBusinessOwner')}
            </p>
            <button
              onClick={handleLogout}
              className="w-full text-start px-4 py-2.5 text-sm text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] rounded-2xl transition-colors"
            >
              {t('layout.signOut')}
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 w-[260px] bg-[var(--sidebar-bg)] transform transition-transform duration-300 ease-in-out lg:hidden ${rtl ? 'right-0 left-auto' : 'left-0'} ${
          sidebarOpen ? 'translate-x-0' : rtl ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <div className={`flex items-center ${rtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="h-10 w-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
                <span className="text-[var(--accent-ink)] font-bold text-lg">R</span>
              </div>
              <h1 className="text-xl font-semibold tracking-[-0.03em] text-[var(--sidebar-text)]">{t('layout.brand')}</h1>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-2xl text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] hover:bg-white/5 touch-manipulation"
            >
              <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 min-h-0 px-4 py-6 space-y-1 overflow-y-auto sidebar-nav-no-scrollbar">
            {isShopStaff && renderNav(businessOwnerNav, () => setSidebarOpen(false))}
            {isSuperAdmin && renderNav(superAdminNav, () => setSidebarOpen(false))}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <span className="text-[var(--accent-ink)] font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={rtl ? 'mr-3 ml-0 min-w-0 flex-1' : 'ml-3 min-w-0 flex-1'}>
                <p className="text-sm font-medium text-[var(--sidebar-text)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--sidebar-muted)] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-start px-4 py-2.5 text-sm text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)] rounded-2xl transition-colors"
            >
              {t('layout.signOut')}
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 ${rtl ? 'lg:pr-[260px] lg:pl-0' : 'lg:pl-[260px]'}`}>
        <header className="bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] min-h-[4.5rem] sm:h-20 flex items-center px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] -ms-1 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] touch-manipulation ${rtl ? 'ml-2 sm:ml-4' : 'mr-2 sm:mr-4'}`}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] truncate">{pageTitle}</h2>
            </div>
            <div
              className={`flex items-center sm:space-x-4 flex-wrap justify-end gap-y-2 ${rtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}
            >
              {localeNavReady && (
                <div
                  className={`hidden sm:flex flex-col items-end text-[11px] leading-tight text-[var(--text-secondary)] max-w-[min(280px,36vw)] ${rtl ? 'text-left' : 'text-right'}`}
                  title={`${countryName || '—'} · ${timezone} · ${dialCode}`}
                >
                  {countryName ? <span className="truncate font-medium text-[var(--text-primary)]">{countryName}</span> : null}
                  <span className="truncate">
                    {timezone} · {dialCode}
                    {currencySymbol ? ` · ${currencySymbol}` : ''}
                  </span>
                </div>
              )}
              <ThemeToggle />
              <div className={`flex items-center ${rtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                <div className={`hidden sm:block ${rtl ? 'text-left' : 'text-right'}`}>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center ring-2 ring-[var(--surface)]">
                  <span className="text-[var(--accent-ink)] font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {isShopStaff && subscriptionExpired && (
            <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              <div className="rounded-2xl border border-[#E8A23A]/40 bg-[#E8A23A]/10 px-4 py-3 text-sm text-[var(--text-primary)] flex flex-wrap items-center justify-between gap-3">
                <span>{t('layout.expiredBanner')}</span>
                <Link
                  to="/shop/my-plan"
                  className="font-medium text-[var(--accent)] hover:underline whitespace-nowrap"
                >
                  {t('layout.expiredCta')}
                </Link>
              </div>
            </div>
          )}
          <div className="p-4 sm:p-6 lg:p-8 max-w-[100vw] min-w-0">{children}</div>
        </main>
      </div>
    </div>
  )
}
