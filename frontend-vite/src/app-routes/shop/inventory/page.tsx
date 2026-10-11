import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'

type Alerts = {
  overdueMaintenanceCount: number
  openDamageCount: number
  lowAvailabilityProducts: { productId: string; name: string; active: number; total: number }[]
  highDamageRatio: { damagedUnits: number; totalUnits: number; ratio: number } | null
}

export default function InventoryHubPage() {
  const [alerts, setAlerts] = useState<Alerts | null>(null)

  useEffect(() => {
    api
      .get('/inventory/alerts')
      .then((r) => setAlerts(r.data))
      .catch(() => setAlerts(null))
  }, [])

  return (
    <Layout>
      <PageHeader
        title="Inventory & units"
        description="Maintenance, damage, availability, and booking calendar for serial-tracked units."
      />

      {alerts && (
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Overdue maintenance" value={alerts.overdueMaintenanceCount} />
            <StatCard title="Open damage reports" value={alerts.openDamageCount} />
          </div>
          {(alerts.lowAvailabilityProducts.length > 0 || alerts.highDamageRatio) && (
            <section className="alert-board">
              <h2 className="px-2 pb-3">Alerts</h2>
              {alerts.lowAvailabilityProducts.map((p) => (
                <div key={p.productId} className="alert-row">
                  <span className="alert-mark">
                    {p.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part.charAt(0).toUpperCase())
                      .join('') || 'LA'}
                  </span>
                  <div className="alert-copy">
                    <strong>{p.name}</strong>
                    <span>Low availability (&lt; 15% active)</span>
                  </div>
                  <span className="alert-value">
                    {p.active} / {p.total}
                  </span>
                </div>
              ))}
              {alerts.highDamageRatio && (
                <div className="alert-row">
                  <span className="alert-mark">HD</span>
                  <div className="alert-copy">
                    <strong>High damage ratio</strong>
                    <span>
                      {alerts.highDamageRatio.damagedUnits}/{alerts.highDamageRatio.totalUnits} units damaged
                    </span>
                  </div>
                  <span className="alert-value">{(alerts.highDamageRatio.ratio * 100).toFixed(0)}%</span>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/shop/inventory/maintenance', label: 'Maintenance', desc: 'Schedule & complete' },
          { href: '/shop/inventory/damage', label: 'Damage', desc: 'Report & resolve' },
          { href: '/shop/inventory/calendar', label: 'Calendar', desc: 'Jobs & maintenance' },
          { href: '/shop/products', label: 'Products', desc: 'Unit breakdown' },
        ].map((l) => (
          <Link key={l.href} to={l.href}>
            <Card className="p-5 h-full hover:border-[var(--accent)] transition-colors">
              <h3 className="font-semibold text-[var(--text-primary)]">{l.label}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
