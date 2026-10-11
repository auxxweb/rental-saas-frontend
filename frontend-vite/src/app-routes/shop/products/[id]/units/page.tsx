import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Link } from 'react-router-dom'

type Unit = {
  _id: string
  serialNumber: string
  uniqueCode?: string
  status: string
  isRetired?: boolean
}

type Counts = {
  totalUnits: number
  available: number
  rented: number
  maintenance: number
  damaged: number
}

const statusVariant = (s: string): 'active' | 'pending' | 'overdue' | 'cancelled' => {
  if (s === 'ACTIVE') return 'active'
  if (s === 'RENTED') return 'pending'
  if (s === 'MAINTENANCE') return 'overdue'
  return 'cancelled'
}

export default function ProductUnitsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const id = params.id as string
  const [units, setUnits] = useState<Unit[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    api
      .get(`/products/${id}/units`)
      .then((r) => {
        setUnits(r.data.units)
        setCounts(r.data.counts)
      })
      .catch(() => toast.error('Failed to load units'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  return (
    <Layout>
      <PageHeader
        title="Product units"
        description="Per-serial status. Only ACTIVE units can be assigned to new jobs."
        action={{
          label: 'Back to product',
          onClick: () => navigate(`/shop/products/${id}/edit`),
        }}
      />

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ['Total', counts.totalUnits, 'default'],
            ['Active', counts.available, 'active'],
            ['Rented', counts.rented, 'pending'],
            ['Maintenance', counts.maintenance, 'overdue'],
            ['Damaged', counts.damaged, 'cancelled'],
          ].map(([label, n]) => (
            <StatCard key={String(label)} title={String(label)} value={n as number} />
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
            <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-left text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-3">Serial / code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {units.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 font-mono">
                    {u.serialNumber}
                    {u.isRetired && <span className="ml-2 text-xs text-[var(--text-tertiary)]">(retired)</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(u.status)}>{u.status}</Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right align-top">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-end items-stretch sm:items-center">
                    <Link to={`/shop/jobs/new?unit=${u._id}`} className="sm:inline-flex">
                      <Button size="sm" variant="outline" disabled={u.status !== 'ACTIVE' || u.isRetired} className="w-full sm:w-auto">
                        Rent
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      disabled={u.status !== 'ACTIVE' || u.isRetired}
                      onClick={() =>
                        navigate(`/shop/inventory/maintenance?product=${id}&unit=${u._id}`)
                      }
                    >
                      Maintenance
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="w-full sm:w-auto"
                      disabled={u.status === 'RENTED' || u.isRetired}
                      onClick={() => navigate(`/shop/inventory/damage?product=${id}&unit=${u._id}`)}
                    >
                      Damage
                    </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          {units.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">
              No serial units — add serials on the product edit flow.
            </div>
          )}
        </Card>
      )}
    </Layout>
  )
}
