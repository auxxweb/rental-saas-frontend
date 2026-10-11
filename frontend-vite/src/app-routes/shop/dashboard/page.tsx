import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'
import RevenueTrendChart, { type RevenuePoint } from '@/components/charts/RevenueTrendChart'
import { format, subDays } from 'date-fns'

export default function ShopDashboard() {
  const { t } = useTranslation('shop')
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingReturns: 0,
    returnedJobs: 0
  })
  const [inventoryCount, setInventoryCount] = useState(0)
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([])
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchInventoryCount()
    fetchRevenueTrend()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/jobs/stats/overview')
      setStats(response.data)
    } catch {
      // keep dashboard responsive; errors surface as empty stats
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryCount = async () => {
    try {
      const response = await api.get('/products')
      const totalStock = response.data.reduce((sum: number, product: any) => sum + product.stock, 0)
      setInventoryCount(totalStock)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const fetchRevenueTrend = async () => {
    setRevenueLoading(true)
    try {
      const end = new Date()
      const start = subDays(end, 13)

      const response = await api.get('/reports/payments', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      })

      const invoices = response.data?.invoices || []
      const map = new Map<string, number>()

      for (const inv of invoices) {
        const dayKey = format(new Date(inv.createdAt), 'yyyy-MM-dd')
        map.set(dayKey, (map.get(dayKey) || 0) + Number(inv.total || 0))
      }

      const series: RevenuePoint[] = []
      for (let i = 13; i >= 0; i--) {
        const d = subDays(end, i)
        const key = format(d, 'yyyy-MM-dd')
        series.push({
          label: format(d, 'MMM d'),
          revenue: Number((map.get(key) || 0).toFixed(2)),
        })
      }

      setRevenueSeries(series)
    } catch {
      setRevenueSeries([])
    } finally {
      setRevenueLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)] mb-2 break-words">
            {t('dashboard.heading')}
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            variant="due"
            title={t('dashboard.activeJobs')}
            value={stats.activeJobs}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            }
          />
          <StatCard
            variant="due"
            title={t('dashboard.pendingReturns')}
            value={stats.pendingReturns}
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
            title={t('dashboard.returnedJobs')}
            value={stats.returnedJobs}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
          <StatCard
            variant="due"
            title={t('dashboard.inventoryUnits')}
            value={inventoryCount}
            icon={
              <div className="h-12 w-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            }
          />
        </div>

        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 min-w-0">
          <section className="graph-card xl:col-span-2 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-4 px-1">
              <div>
                <h2>{t('dashboard.revenueTrend')}</h2>
                <p className="mt-1 text-sm">{t('dashboard.revenueSubtitle')}</p>
              </div>
            </div>
            {revenueLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
              </div>
            ) : (
              <RevenueTrendChart data={revenueSeries} />
            )}
          </section>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('dashboard.operationalSnapshot')}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('dashboard.snapshotHealth')}</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{t('dashboard.activeJobsLower')}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.activeJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{t('dashboard.pendingReturnsLower')}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.pendingReturns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{t('dashboard.returnedJobsLower')}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.returnedJobs}</span>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{t('dashboard.inventoryLower')}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{inventoryCount}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">{t('dashboard.quickActions')}</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/shop/jobs/new')}
                className="w-full text-left px-5 py-4 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] rounded-2xl transition-all duration-200 border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--accent-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{t('dashboard.createNewJob')}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{t('dashboard.createNewJobDesc')}</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/shop/products/new')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-2xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{t('dashboard.addProduct')}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{t('dashboard.addProductDesc')}</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <section className="alert-board">
            <h2 className="px-2 pb-3">{t('dashboard.statusSummary')}</h2>
            <div className="alert-row">
              <span className="alert-mark">AJ</span>
              <div className="alert-copy">
                <strong>{t('dashboard.activeJobs')}</strong>
              </div>
              <span className="alert-value">{stats.activeJobs}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">PR</span>
              <div className="alert-copy">
                <strong>{t('dashboard.pendingReturns')}</strong>
              </div>
              <span className="alert-value">{stats.pendingReturns}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">CR</span>
              <div className="alert-copy">
                <strong>{t('dashboard.completedReturns')}</strong>
              </div>
              <span className="alert-value">{stats.returnedJobs}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">TI</span>
              <div className="alert-copy">
                <strong>{t('dashboard.totalInventory')}</strong>
              </div>
              <span className="alert-value">
                {inventoryCount} {t('dashboard.itemsSuffix')}
              </span>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
}
