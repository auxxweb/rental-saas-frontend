import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'

/**
 * /tenant index redirects to unified shop dashboard.
 * Sub-routes (/tenant/bookings, /tenant/calendar, …) render children for v2 tenant UIs.
 */
export default function TenantSectionLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true })
      return
    }
    if (pathname === '/tenant' || pathname === '/tenant/dashboard') {
      navigate('/shop/dashboard', { replace: true })
      return
    }
    setOk(true)
  }, [navigate, pathname])

  if (pathname === '/tenant' || pathname === '/tenant/dashboard') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Redirecting…
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    )
  }

  return <Outlet />
}
