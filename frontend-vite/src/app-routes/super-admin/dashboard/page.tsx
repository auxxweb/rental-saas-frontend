import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { ensureSession } from '@/lib/auth'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'
import ShopStatusDonut from '@/components/charts/ShopStatusDonut'
import { useAppLocale } from '@/lib/useAppLocale'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { formatMoney } = useAppLocale()
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const u = await ensureSession()
      if (cancelled) return
      if (!u) {
        setLoading(false)
        return
      }
      try {
        const response = await api.get('/shops/stats/overview')
        if (!cancelled) setStats(response.data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  const activePercentage = stats.totalShops > 0 ? Math.round((stats.activeShops / stats.totalShops) * 100) : 0
  const inactiveShops = Math.max(stats.totalShops - stats.activeShops - stats.pendingShops, 0)
  const donutData = [
    { name: 'Active', value: stats.activeShops, color: 'var(--accent)' },
    { name: 'Pending', value: stats.pendingShops, color: '#F59E0B' },
    { name: 'Inactive', value: inactiveShops, color: 'rgba(148,163,184,0.9)' },
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[1.85rem] sm:text-4xl font-semibold tracking-[-0.045em] text-[var(--text-primary)] mb-2">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Overview of your rental SaaS platform</p>
        </div>

        {/* Stats Grid - 12 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            variant="due"
            title="Total Shops"
            value={stats.totalShops}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            }
          />
          <StatCard
            variant="due"
            title="Active Shops"
            value={stats.activeShops}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--success)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
            trend={{
              value: `${activePercentage}% of total`,
              isPositive: true
            }}
          />
          <StatCard
            variant="due"
            title="Pending Shops"
            value={stats.pendingShops}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
          <StatCard
            variant="due"
            title="Total Revenue"
            value={formatMoney(stats.revenue)}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
        </div>

        {/* Quick Actions & Status Summary - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/super-admin/shops/new')}
                className="w-full text-left px-5 py-4 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-2xl transition-all duration-200 border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--accent-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Create New Shop</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Onboard a new rental shop</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/super-admin/shops')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Manage Shops</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">View and manage all shops</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/super-admin/reports')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">View Reports</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Analytics and insights</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <section className="alert-board">
            <h2 className="px-2 pb-3">Status Summary</h2>
            <div className="alert-row">
              <span className="alert-mark">AS</span>
              <div className="alert-copy">
                <strong>Active Shops</strong>
              </div>
              <span className="alert-value">{stats.activeShops}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">PA</span>
              <div className="alert-copy">
                <strong>Pending Approval</strong>
              </div>
              <span className="alert-value">{stats.pendingShops}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">TR</span>
              <div className="alert-copy">
                <strong>Total Revenue</strong>
              </div>
              <span className="alert-value">{formatMoney(stats.revenue)}</span>
            </div>
          </section>
        </div>

        {/* Analytics */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="graph-card xl:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4 px-1">
              <div>
                <h2>Shop Status Breakdown</h2>
                <p className="mt-1 text-sm">Active vs pending vs inactive</p>
              </div>
            </div>
            <ShopStatusDonut data={donutData} />
          </section>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Platform Snapshot</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Key health metrics</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total shops</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.totalShops}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Active shops</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.activeShops}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Pending shops</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.pendingShops}</span>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{formatMoney(stats.revenue)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
