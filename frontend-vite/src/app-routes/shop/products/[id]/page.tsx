import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { isMongoObjectIdString } from '@/lib/mongoId'
import { useAppLocale } from '@/lib/useAppLocale'

type Item = {
  _id: string
  serialNumber: string
  status: string
  note?: string
  imageUrl?: string
  conditionNotes?: string
}

type ProductDetail = {
  _id: string
  name: string
  localName?: string
  modelNumber?: string
  description?: string
  categoryId?: { name?: string } | null
  stock: number
  pricing: { hourly: number; daily: number; monthly: number; yearly?: number }
  requireAdvancePayment?: boolean
  advanceAmount?: number
  isActive: boolean
  items?: Item[]
  availability?: {
    totalUnits: number
    available: number
    rented: number
    maintenance: number
    damaged: number
  }
}

const statusBadge = (s: string): 'active' | 'pending' | 'overdue' | 'cancelled' => {
  if (s === 'ACTIVE') return 'active'
  if (s === 'RENTED') return 'pending'
  if (s === 'MAINTENANCE') return 'overdue'
  return 'cancelled'
}

export default function ProductViewPage() {
  const { formatMoney } = useAppLocale()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<ProductDetail | null>(null)

  useEffect(() => {
    if (!id || !isMongoObjectIdString(id)) {
      toast.error('Invalid product')
      navigate('/shop/products')
      return
    }
    api
      .get<ProductDetail>(`/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => {
        toast.error('Could not load product')
        navigate('/shop/products')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading || !product) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  const catName =
    product.categoryId && typeof product.categoryId === 'object' && product.categoryId.name
      ? product.categoryId.name
      : '—'

  return (
    <Layout>
      <div>
        <PageHeader
          title={product.name}
          description={`Model ${product.modelNumber || '—'} · ${catName}`}
          action={{
            label: 'Edit',
            onClick: () => navigate(`/shop/products/${product._id}/edit`),
          }}
        />

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" type="button" onClick={() => navigate('/shop/products')}>
            Back to list
          </Button>
          <Link to={`/shop/products/${product._id}/edit`}>
            <Button size="sm" type="button">
              Edit product
            </Button>
          </Link>
        </div>

        {product.availability && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              ['Total units', product.availability.totalUnits],
              ['Available', product.availability.available],
              ['Rented', product.availability.rented],
              ['Maintenance', product.availability.maintenance],
              ['Damaged', product.availability.damaged],
            ].map(([label, n]) => (
              <StatCard key={String(label)} title={String(label)} value={n as number} />
            ))}
          </div>
        )}

        <Card padding="lg" className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--text-secondary)]">Local name</dt>
              <dd className="text-[var(--text-primary)]">{product.localName || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Category</dt>
              <dd className="text-[var(--text-primary)]">{catName}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--text-secondary)]">Description</dt>
              <dd className="text-[var(--text-primary)] whitespace-pre-wrap">{product.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Status</dt>
              <dd>
                <Badge variant={product.isActive ? 'active' : 'cancelled'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Inventory count</dt>
              <dd className="text-[var(--text-primary)]">
                {product.items?.length
                  ? `${product.items.length} (matches number of serials)`
                  : product.stock}
              </dd>
            </div>
          </dl>
        </Card>

        <Card padding="lg" className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-secondary)]">Hourly</p>
              <p className="font-medium text-[var(--text-primary)]">{formatMoney(Number(product.pricing.hourly))}</p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Daily</p>
              <p className="font-medium text-[var(--text-primary)]">{formatMoney(Number(product.pricing.daily))}</p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Monthly</p>
              <p className="font-medium text-[var(--text-primary)]">{formatMoney(Number(product.pricing.monthly))}</p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Yearly</p>
              <p className="font-medium text-[var(--text-primary)]">{formatMoney(Number(product.pricing.yearly ?? 0))}</p>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <p className="text-[var(--text-secondary)]">Advance payment</p>
            <p className="text-[var(--text-primary)]">
              {product.requireAdvancePayment
                ? `Required — ${product.advanceAmount ?? 0}% of rental total`
                : 'Not required'}
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Serial items</h3>
          {!product.items?.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No serials yet.</p>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <th className="pb-2 pr-4">Serial</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Note</th>
                    <th className="pb-2">Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {product.items.map((it) => (
                    <tr key={it._id}>
                      <td className="py-2 pr-4 font-mono">{it.serialNumber}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={statusBadge(it.status)}>{it.status}</Badge>
                      </td>
                      <td className="py-2 pr-4 max-w-xs truncate">
                        {it.note || it.conditionNotes || '—'}
                      </td>
                      <td className="py-2">
                        {it.imageUrl ? (
                          <a
                            href={it.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] underline text-xs"
                          >
                            Link
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
