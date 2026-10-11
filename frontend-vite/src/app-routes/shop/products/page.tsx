import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import ProductAvailabilityPie from '@/components/inventory/ProductAvailabilityPie'
import { useAppLocale } from '@/lib/useAppLocale'

interface AvailabilitySummary {
  usesSerialTracking: boolean
  totalUnits: number
  available: number
  rented: number
  maintenance: number
  damaged: number
  stockField?: number
}

interface Product {
  _id: string
  name: string
  localName?: string
  modelNumber?: string
  category: string
  categoryId?: { name: string } | string
  stock: number
  pricing: {
    hourly: number
    daily: number
    monthly: number
    yearly?: number
  }
  isActive: boolean
  availability?: AvailabilitySummary | null
  totalCount?: number
  availableCount?: number
}

interface ShopCategoryOption {
  _id: string
  name: string
}

type UnitStatusFilter = '' | 'ACTIVE' | 'RENTED' | 'MAINTENANCE' | 'DAMAGED'

async function fetchProductsList(params: {
  search: string
  categoryId: string
  isActive: '' | 'true' | 'false'
  unitStatus: UnitStatusFilter
  page: number
  limit: number
}) {
  const q: Record<string, string> = {
    includeAvailability: '1',
    page: String(params.page),
    limit: String(params.limit),
  }
  if (params.search.trim()) q.search = params.search.trim()
  if (params.categoryId) q.categoryId = params.categoryId
  if (params.isActive === 'true' || params.isActive === 'false') q.isActive = params.isActive
  if (params.unitStatus) q.unitStatus = params.unitStatus

  const response = await api.get('/products', { params: q })
  const data = response.data
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items as Product[],
      total: data.total as number,
      page: data.page as number,
      limit: data.limit as number,
    }
  }
  const arr = (Array.isArray(data) ? data : []) as Product[]
  return { items: arr, total: arr.length, page: 1, limit: arr.length || 20 }
}

export default function ProductsPage() {
  const { formatMoney } = useAppLocale()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<ShopCategoryOption[]>([])
  const [draft, setDraft] = useState({
    search: '',
    categoryId: '',
    isActive: '' as '' | 'true' | 'false',
    unitStatus: '' as UnitStatusFilter,
  })
  const [applied, setApplied] = useState({
    search: '',
    categoryId: '',
    isActive: '' as '' | 'true' | 'false',
    unitStatus: '' as UnitStatusFilter,
  })
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['shop-products', applied, page, limit],
    queryFn: () => fetchProductsList({ ...applied, page, limit }),
  })

  useEffect(() => {
    api
      .get<ShopCategoryOption[]>('/shop-categories')
      .then((r) => setCategories(r.data))
      .catch(() => toast.error('Error loading categories'))
  }, [])

  const applyFilters = () => {
    setPage(1)
    setApplied({ ...draft })
  }

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const loading = isLoading && !data

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted successfully')
      void refetch()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Error deleting product')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (value: string, row: Product) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{value}</p>
          {row.modelNumber && (
            <p className="text-xs text-[var(--text-secondary)]">Model: {row.modelNumber}</p>
          )}
          {(typeof row.categoryId === 'object' && row.categoryId?.name) || row.category ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {typeof row.categoryId === 'object' && row.categoryId?.name
                ? row.categoryId.name
                : row.category}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'modelNumber',
      label: 'Model #',
      render: (_: unknown, row: Product) => (
        <span className="text-sm font-mono text-[var(--text-primary)]">{row.modelNumber || '—'}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'stock',
      label: 'Total / Available',
      render: (_: number, row: Product) => {
        const a = row.availability
        const tc = row.totalCount ?? a?.totalUnits ?? row.stock
        const ac = row.availableCount ?? a?.available ?? row.stock
        if (a?.usesSerialTracking) {
          return (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <ProductAvailabilityPie
                active={a.available}
                rented={a.rented}
                maintenance={a.maintenance}
                damaged={a.damaged}
              />
              <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                <p>
                  Total: {tc} · Avail: {ac}
                </p>
                <p>
                  R:{a.rented} M:{a.maintenance} D:{a.damaged}
                </p>
              </div>
            </div>
          )
        }
        return (
          <span className={`font-medium ${row.stock > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
            {tc} / {ac}
          </span>
        )
      },
    },
    {
      key: 'pricing',
      label: 'Pricing',
      render: (value: Product['pricing']) => (
        <div className="text-sm">
          <p className="text-[var(--text-primary)]">{formatMoney(Number(value.hourly))}/hr</p>
          <p className="text-[var(--text-secondary)]">{formatMoney(Number(value.daily))}/day</p>
          <p className="text-[var(--text-secondary)]">{formatMoney(Number(value.monthly))}/mo</p>
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'active' : 'cancelled'}>{value ? 'Active' : 'Inactive'}</Badge>
      ),
    },
  ]

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
      <div>
        <PageHeader
          title="Products"
          description="Manage your rental product inventory"
          action={{
            label: 'Add Product',
            onClick: () => navigate('/shop/products/new'),
          }}
        />

        <Card className="mb-6" padding="md">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Set filters and click Search (filters apply only when you click Search).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2 lg:col-span-2">
              <Input
                type="text"
                placeholder="Search by name, model, category..."
                value={draft.search}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyFilters()
                  }
                }}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={draft.categoryId}
                onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Product status</label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={draft.isActive}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, isActive: e.target.value as '' | 'true' | 'false' }))
                }
              >
                <option value="">Active and inactive</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Unit status
              </label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={draft.unitStatus}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, unitStatus: e.target.value as UnitStatusFilter }))
                }
              >
                <option value="">Any unit status</option>
                <option value="ACTIVE">Has available unit</option>
                <option value="RENTED">Has rented unit</option>
                <option value="MAINTENANCE">Has maintenance</option>
                <option value="DAMAGED">Has damaged</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <Button type="button" onClick={applyFilters} isLoading={isFetching}>
                Search
              </Button>
            </div>
          </div>
        </Card>

        <ResponsiveTable
          columns={columns}
          data={products}
          emptyMessage="No products found. Create your first product to get started."
          actions={(row) => (
            <div className="flex items-center gap-2 flex-wrap">
              {row.availability?.usesSerialTracking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/shop/products/${row._id}/units`)
                  }}
                  className="text-xs"
                >
                  Units
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/shop/products/${row._id}`)
                }}
                className="text-xs"
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/shop/products/${row._id}/edit`)
                }}
                className="text-xs"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(row._id, row.name)
                }}
                className="text-xs"
              >
                Delete
              </Button>
            </div>
          )}
          onRowClick={(row) => navigate(`/shop/products/${row._id}`)}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Page {page} of {totalPages} ({total} products)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => navigate('/shop/products/new')}
            className="h-14 w-14 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-lg hover:bg-[var(--accent-dark)] flex items-center justify-center transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </Layout>
  )
}
