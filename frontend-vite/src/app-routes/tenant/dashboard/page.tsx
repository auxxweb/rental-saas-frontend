import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'
import { useAppLocale } from '@/lib/useAppLocale'

export default function TenantDashboardPage() {
  const { formatMoney } = useAppLocale()
  const ready = useTenantReady()
  const role = Cookies.get('role')

  const { data, isLoading, error } = useQuery({
    queryKey: ['v2-analytics', Cookies.get('tenantId')],
    queryFn: async () => (await api.get('/v2/analytics/overview')).data,
    enabled: ready,
  })

  if (role === 'super_admin' && !Cookies.get('tenantId')) {
    return (
      <Layout>
        <Card padding="lg">
          <p className="text-[var(--text-secondary)]">
            Select a <strong>tenant</strong> in the header to load serial-rental analytics.
          </p>
        </Card>
      </Layout>
    )
  }

  if (!ready) {
    return (
      <Layout>
        <Card padding="lg">Loading…</Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader title="Rental dashboard" description="Serial-based inventory, bookings, and revenue (v2 API)." />
      {isLoading && <p className="text-[var(--text-secondary)]">Loading…</p>}
      {error && <p className="text-red-600">Could not load analytics.</p>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Revenue (invoiced)" value={formatMoney(Number(data.revenue ?? 0))} />
          <StatCard title="Bookings" value={data.bookingCount ?? 0} />
          <StatCard
            title="Asset utilization"
            value={`${(Number(data.assetUtilization?.utilizationRate ?? 0) * 100).toFixed(1)}%`}
          />
        </div>
      )}
    </Layout>
  )
}
