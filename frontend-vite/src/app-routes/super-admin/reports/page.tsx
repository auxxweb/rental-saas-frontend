import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'
import { useAppLocale } from '@/lib/useAppLocale'

type PlatformReports = {
  generatedAt: string
  shops: { total: number; active: number; pending: number; suspended: number }
  users: { businessOwners: number; subAdmins: number }
  platform: { jobs: number; customers: number; products: number; invoices: number }
  revenue: { total: number }
  subscriptions: { activePlans: number; expiredOrLapsed: number }
  upgradeRequests: { pending: number; approved: number; rejected: number }
  topShopsByRevenue: Array<{
    shopId: string
    name: string
    email: string
    status: string
    revenue: number
    invoiceCount: number
  }>
}

export default function SuperAdminReportsPage() {
  const navigate = useNavigate()
  const { formatMoney } = useAppLocale()
  const [data, setData] = useState<PlatformReports | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: payload } = await api.get<PlatformReports>('/admin/reports')
      setData(payload)
    } catch {
      toast.error('Failed to load platform reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <PageHeader title="Reports" description="Platform-wide metrics" />
          <p className="text-[var(--text-secondary)]">No data</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <PageHeader
            title="Reports"
            description="Cross-tenant revenue, shops, subscriptions, and upgrade requests. Same totals as the dashboard, with breakdowns and top shops by invoice revenue."
          />
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {data.generatedAt && (
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Generated {format(new Date(data.generatedAt), 'PPpp')}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total shops" value={data.shops.total} />
          <StatCard title="Active shops" value={data.shops.active} />
          <StatCard title="Pending shops" value={data.shops.pending} />
          <StatCard title="Suspended" value={data.shops.suspended} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Platform revenue (invoices)" value={formatMoney(data.revenue.total)} />
          <StatCard title="Total invoices" value={data.platform.invoices} />
          <StatCard title="Jobs (all shops)" value={data.platform.jobs} />
          <StatCard title="Customers (all shops)" value={data.platform.customers} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Products (all shops)" value={data.platform.products} />
          <StatCard title="Business owners" value={data.users.businessOwners} />
          <StatCard title="Sub-admins" value={data.users.subAdmins} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="alert-board">
            <h2 className="px-2 pb-3">Subscriptions</h2>
            <div className="alert-row">
              <span className="alert-mark">AP</span>
              <div className="alert-copy">
                <strong>Shops with active plan window</strong>
              </div>
              <span className="alert-value">{data.subscriptions.activePlans}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">EL</span>
              <div className="alert-copy">
                <strong>Expired / lapsed</strong>
              </div>
              <span className="alert-value">{data.subscriptions.expiredOrLapsed}</span>
            </div>
          </section>
          <section className="alert-board">
            <h2 className="px-2 pb-3">Plan upgrade requests</h2>
            <div className="alert-row">
              <span className="alert-mark">PE</span>
              <div className="alert-copy">
                <strong>Pending</strong>
              </div>
              <span className="alert-value">{data.upgradeRequests.pending}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">AP</span>
              <div className="alert-copy">
                <strong>Approved</strong>
              </div>
              <span className="alert-value">{data.upgradeRequests.approved}</span>
            </div>
            <div className="alert-row">
              <span className="alert-mark">RE</span>
              <div className="alert-copy">
                <strong>Rejected</strong>
              </div>
              <span className="alert-value">{data.upgradeRequests.rejected}</span>
            </div>
          </section>
        </div>

        <Card className="p-0 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Top shops by invoice revenue</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Ranked by sum of invoice totals across all time. Click a row to open the shop.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <ResponsiveTable
              columns={[
                { key: 'name', label: 'Shop' },
                { key: 'email', label: 'Email', mobileHidden: true },
                {
                  key: 'status',
                  label: 'Status',
                  render: (v: string) => (
                    <Badge
                      variant={
                        v === 'active' ? 'active' : v === 'pending' ? 'pending' : v === 'suspended' ? 'suspended' : 'default'
                      }
                    >
                      {v}
                    </Badge>
                  ),
                },
                {
                  key: 'revenue',
                  label: 'Revenue',
                  render: (v: number) => formatMoney(v),
                },
                { key: 'invoiceCount', label: 'Invoices' },
              ]}
              data={data.topShopsByRevenue}
              emptyMessage="No invoice data yet"
              onRowClick={(row) => navigate(`/super-admin/shops/${row.shopId}`)}
            />
          </div>
        </Card>
      </div>
    </Layout>
  )
}
