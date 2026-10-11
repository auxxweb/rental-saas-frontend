import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { isMongoObjectIdString } from '@/lib/mongoId'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { format } from 'date-fns'

type Category = { _id: string; name: string }

type ProductRow = {
  _id: string
  name: string
  localName?: string
  modelNumber?: string
  categoryId?: { name?: string } | string
}

type UnitRow = {
  _id: string
  serialNumber: string
  status: string
  isRetired?: boolean
}

type PopulatedProduct = {
  name?: string
  localName?: string
  modelNumber?: string
  categoryId?: { name?: string } | null
}

type ProductUnitPopulated = {
  _id: string
  serialNumber: string
  status: string
  product?: PopulatedProduct
}

type DamageRow = {
  _id: string
  damageType: string
  severity: string
  description: string
  status: string
  reportedAt?: string
  resolvedAt?: string | null
  resolutionAction?: string | null
  resolutionNotes?: string
  productUnit?: ProductUnitPopulated
}

type AppliedFilters = {
  status: string
  severity: string
  search: string
}

const defaultFilters: AppliedFilters = { status: '', severity: '', search: '' }

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  getLabel,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  options: { id: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  getLabel?: (id: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selectedLabel = value ? getLabel?.(value) || options.find((o) => o.id === value)?.label || '' : ''

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    const always = options.filter((o) => o.id === '')
    const rest = options.filter((o) => o.id !== '')
    if (!s) return options
    const matched = rest.filter((o) => o.label.toLowerCase().includes(s))
    return always.length ? [...always, ...matched] : matched
  }, [options, q])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-left text-sm text-[var(--text-primary)] flex justify-between items-center disabled:opacity-50"
      >
        <span className="truncate">{selectedLabel || placeholder || 'Select…'}</span>
        <span className="text-[var(--text-secondary)] text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg max-h-72 flex flex-col">
          <input
            autoFocus
            className="m-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--text-primary)]"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="overflow-y-auto flex-1 px-1 pb-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">No matches</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] text-[var(--text-primary)]"
                  onClick={() => {
                    onChange(o.id)
                    setOpen(false)
                    setQ('')
                  }}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-20 cursor-default"
          aria-label="Close"
          onClick={() => {
            setOpen(false)
            setQ('')
          }}
        />
      )}
    </div>
  )
}

function sortOpenDamage(a: DamageRow, b: DamageRow) {
  return new Date(b.reportedAt || 0).getTime() - new Date(a.reportedAt || 0).getTime()
}

function sortResolvedDamage(a: DamageRow, b: DamageRow) {
  const ar = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0
  const br = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0
  return br - ar
}

export default function DamagePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const productFromLink = searchParams.get('product')
  const unitFromLink = searchParams.get('unit')

  const [rows, setRows] = useState<DamageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<AppliedFilters>(defaultFilters)
  const [applied, setApplied] = useState<AppliedFilters>(defaultFilters)

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [units, setUnits] = useState<UnitRow[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [productId, setProductId] = useState('')
  const [productUnitId, setProductUnitId] = useState('')

  const [form, setForm] = useState({
    description: '',
    severity: 'MEDIUM',
    damageType: 'general',
  })

  const [viewRow, setViewRow] = useState<DamageRow | null>(null)

  const [resolveModal, setResolveModal] = useState<{
    id: string
    mode: 'FIXED_ACTIVE' | 'REPAIR_TO_MAINTENANCE' | 'SCRAPPED'
  } | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [maintenanceExpectedEnd, setMaintenanceExpectedEnd] = useState('')
  const [resolveSaving, setResolveSaving] = useState(false)

  useEffect(() => {
    api
      .get<Category[]>('/shop-categories')
      .then((r) => setCategories(r.data))
      .catch(() => toast.error('Failed to load categories'))
  }, [])

  /** Deep link from product Units page: ?product=&unit= */
  useEffect(() => {
    if (!productFromLink || !isMongoObjectIdString(productFromLink)) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get<{
          categoryId?: { _id?: string; name?: string } | string | null
        }>(`/products/${productFromLink}`)
        if (cancelled) return
        const cat = res.data.categoryId
        const cid =
          cat && typeof cat === 'object' && cat !== null && '_id' in cat && cat._id
            ? String(cat._id)
            : cat
              ? String(cat)
              : ''
        setCategoryId(cid)
        setProductId(productFromLink)
        if (unitFromLink && isMongoObjectIdString(unitFromLink)) {
          setProductUnitId(unitFromLink)
        }
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('product')
            next.delete('unit')
            return next
          },
          { replace: true }
        )
      } catch {
        toast.error('Could not load product from link')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [productFromLink, unitFromLink, setSearchParams])

  const loadProducts = useCallback(async () => {
    try {
      const params: Record<string, string> = { page: '1', limit: '200' }
      if (categoryId) params.categoryId = categoryId
      const r = await api.get<{ items?: ProductRow[] } | ProductRow[]>('/products', { params })
      const data = r.data
      const list = Array.isArray(data) ? data : data.items ?? []
      setProducts(list)
    } catch {
      toast.error('Failed to load products')
      setProducts([])
    }
  }, [categoryId])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const loadUnits = useCallback(async () => {
    if (!productId) {
      setUnits([])
      return
    }
    try {
      const r = await api.get<UnitRow[]>('/shop-inventory-items', { params: { productId } })
      setUnits(r.data.filter((u) => u.status !== 'RENTED' && !u.isRetired))
    } catch {
      toast.error('Failed to load serials')
      setUnits([])
    }
  }, [productId])

  useEffect(() => {
    void loadUnits()
  }, [loadUnits])

  const selectedProduct = useMemo(
    () => products.find((p) => p._id === productId),
    [products, productId]
  )
  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === categoryId),
    [categories, categoryId]
  )

  const productCategoryLabel = useMemo(() => {
    if (!selectedProduct) return '—'
    const cid = selectedProduct.categoryId
    if (cid && typeof cid === 'object' && 'name' in cid && cid.name) return cid.name
    return selectedCategory?.name || '—'
  }, [selectedProduct, selectedCategory])

  const selectedUnit = useMemo(() => units.find((u) => u._id === productUnitId), [units, productUnitId])

  const load = useCallback(() => {
    const params: Record<string, string> = {}
    if (applied.status) params.status = applied.status
    if (applied.severity) params.severity = applied.severity
    if (applied.search.trim()) params.search = applied.search.trim()

    setLoading(true)
    api
      .get<DamageRow[]>('/inventory/damage', { params: Object.keys(params).length ? params : undefined })
      .then((r) => setRows(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [applied])

  useEffect(() => {
    load()
  }, [load])

  const applyFilters = () => {
    setApplied({ ...draft })
  }

  const openRows = useMemo(() => {
    const f = rows.filter((r) => r.status !== 'RESOLVED')
    return [...f].sort(sortOpenDamage)
  }, [rows])

  const resolvedRows = useMemo(() => {
    const f = rows.filter((r) => r.status === 'RESOLVED')
    return [...f].sort(sortResolvedDamage)
  }, [rows])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productUnitId.trim()) {
      toast.error('Select a serial number')
      return
    }
    try {
      await api.post('/inventory/damage', {
        productUnitId: productUnitId.trim(),
        description: form.description.trim(),
        severity: form.severity,
        damageType: form.damageType,
      })
      toast.success('Damage reported')
      setForm({ description: '', severity: 'MEDIUM', damageType: 'general' })
      setProductUnitId('')
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const confirmResolve = async () => {
    if (!resolveModal) return
    setResolveSaving(true)
    try {
      await api.patch(`/inventory/damage/${resolveModal.id}/resolve`, {
        action: resolveModal.mode,
        resolutionNotes: resolveNote.trim(),
        ...(resolveModal.mode === 'REPAIR_TO_MAINTENANCE' && maintenanceExpectedEnd.trim()
          ? { maintenanceExpectedEnd }
          : {}),
      })
      toast.success(
        resolveModal.mode === 'FIXED_ACTIVE'
          ? 'Unit is available again'
          : resolveModal.mode === 'REPAIR_TO_MAINTENANCE'
            ? 'Unit sent to maintenance'
            : 'Unit retired'
      )
      setResolveModal(null)
      setResolveNote('')
      setMaintenanceExpectedEnd('')
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setResolveSaving(false)
    }
  }

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c._id, label: c.name })),
    [categories]
  )
  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        id: p._id,
        label: `${p.name}${p.modelNumber ? ` · ${p.modelNumber}` : ''}${p.localName ? ` (${p.localName})` : ''}`,
      })),
    [products]
  )
  const unitOptions = useMemo(
    () => units.map((u) => ({ id: u._id, label: `${u.serialNumber} · ${u.status}` })),
    [units]
  )

  if (loading && rows.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  const resolveTitle =
    resolveModal?.mode === 'FIXED_ACTIVE'
      ? 'Mark repaired — make active'
      : resolveModal?.mode === 'REPAIR_TO_MAINTENANCE'
        ? 'Send to repair (maintenance)'
        : 'Retire unit (scrap)'

  return (
    <Layout>
      <PageHeader
        title="Damage"
        description="Report damage by product and serial. Repair or return units to active stock when resolved."
      />

      <Card className="p-6 mb-8">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Report damage</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Choose category (optional), product, and an <strong>available</strong> serial. Use the search box inside each dropdown to find items.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <SearchableSelect
              label="Category"
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id)
                setProductId('')
                setProductUnitId('')
              }}
              options={[{ id: '', label: '— All categories —' }, ...categoryOptions]}
              placeholder="Filter products by category"
              getLabel={(id) =>
                id === '' ? '— All categories —' : categories.find((c) => c._id === id)?.name || ''
              }
            />
          </div>
          <div className="md:col-span-2">
            <SearchableSelect
              label="Product"
              value={productId}
              onChange={(id) => {
                setProductId(id)
                setProductUnitId('')
              }}
              options={productOptions}
              placeholder="Select product"
              disabled={products.length === 0}
            />
          </div>
          {selectedProduct && (
            <div className="md:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
              <p className="text-[var(--text-secondary)]">Product details</p>
              <p className="text-[var(--text-primary)] font-medium mt-1">{selectedProduct.name}</p>
              {selectedProduct.localName ? (
                <p className="text-[var(--text-primary)]">Local: {selectedProduct.localName}</p>
              ) : null}
              <p className="text-[var(--text-primary)]">Model: {selectedProduct.modelNumber || '—'}</p>
              <p className="text-[var(--text-primary)]">Category: {productCategoryLabel}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <SearchableSelect
              label="Serial number"
              value={productUnitId}
              onChange={setProductUnitId}
              options={unitOptions}
              placeholder={productId ? 'Select serial (available units only)' : 'Select a product first'}
              disabled={!productId || units.length === 0}
            />
          </div>
          {productId && units.length === 0 && (
            <p className="md:col-span-2 text-sm text-amber-700">
              No eligible serials for this product. Rented and retired units cannot be reported here.
            </p>
          )}
          {selectedUnit && (
            <div className="md:col-span-2 text-sm text-[var(--text-secondary)]">
              Selected unit status: <Badge variant="active">{selectedUnit.status}</Badge>
            </div>
          )}
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Damage type</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={form.damageType}
              onChange={(e) => setForm((f) => ({ ...f, damageType: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="cosmetic">Cosmetic</option>
              <option value="functional">Functional</option>
              <option value="structural">Structural</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Severity</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <Button type="submit">Report damage</Button>
        </form>
      </Card>

      <Card className="p-6 mb-6">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Filter by status, severity, or search (description, serial, product, category, resolution notes). Click Search to apply.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="">All (open first, then resolved)</option>
              <option value="REPORTED">REPORTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Severity</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={draft.severity}
              onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value }))}
            >
              <option value="">All</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Search"
              placeholder="Description, serial, product, category…"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyFilters()
                }
              }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <Button type="button" onClick={applyFilters} isLoading={loading}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      {!applied.status ? (
        <>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 px-1">Open damage</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3 px-1">
            Use <strong>Make active</strong> when repaired and ready to rent, or <strong>Send to repair</strong> to move the unit into maintenance.
          </p>
          <DamageListBlock
            rows={openRows}
            loading={loading}
            onView={setViewRow}
            onResolve={setResolveModal}
            emptyMessage="No open damage reports."
            resolved={false}
          />

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 mt-10 px-1">Resolved</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3 px-1">Newest resolutions first.</p>
          <DamageListBlock
            rows={resolvedRows}
            loading={loading}
            onView={setViewRow}
            onResolve={setResolveModal}
            emptyMessage="No resolved records in this view."
            resolved
          />
        </>
      ) : (
        <DamageListBlock
          rows={rows}
          loading={loading}
          onView={setViewRow}
          onResolve={setResolveModal}
          emptyMessage="No damage reports match your filters."
          resolved={applied.status === 'RESOLVED'}
        />
      )}

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="max-w-lg w-full p-6">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Damage report</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--text-secondary)]">Category</dt>
                <dd className="text-[var(--text-primary)]">
                  {viewRow.productUnit?.product?.categoryId?.name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Product</dt>
                <dd className="text-[var(--text-primary)]">{viewRow.productUnit?.product?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Model</dt>
                <dd className="text-[var(--text-primary)]">{viewRow.productUnit?.product?.modelNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Serial</dt>
                <dd className="font-mono text-[var(--text-primary)]">{viewRow.productUnit?.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Type / severity</dt>
                <dd className="text-[var(--text-primary)]">
                  {viewRow.damageType} · {viewRow.severity}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Description</dt>
                <dd className="text-[var(--text-primary)] whitespace-pre-wrap">{viewRow.description}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Reported</dt>
                <dd className="text-[var(--text-primary)]">
                  {viewRow.reportedAt ? format(new Date(viewRow.reportedAt), 'PPp') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Status</dt>
                <dd>
                  <Badge variant={viewRow.status === 'RESOLVED' ? 'active' : 'overdue'}>{viewRow.status}</Badge>
                </dd>
              </div>
              {viewRow.status === 'RESOLVED' && (
                <>
                  <div>
                    <dt className="text-[var(--text-secondary)]">Resolution</dt>
                    <dd className="text-[var(--text-primary)]">{viewRow.resolutionAction || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-secondary)]">Resolved at</dt>
                    <dd className="text-[var(--text-primary)]">
                      {viewRow.resolvedAt ? format(new Date(viewRow.resolvedAt), 'PPp') : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-secondary)]">Resolution notes</dt>
                    <dd className="text-[var(--text-primary)] whitespace-pre-wrap">
                      {viewRow.resolutionNotes || '—'}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" type="button" onClick={() => setViewRow(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {resolveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">{resolveTitle}</h3>
            {resolveModal.mode === 'SCRAPPED' && (
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                The serial will be retired and stay out of the rental pool.
              </p>
            )}
            {resolveModal.mode === 'REPAIR_TO_MAINTENANCE' && (
              <div className="mb-4">
                <Input
                  label="Expected maintenance end (optional)"
                  type="datetime-local"
                  value={maintenanceExpectedEnd}
                  onChange={(e) => setMaintenanceExpectedEnd(e.target.value)}
                />
              </div>
            )}
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Resolution notes (optional)
            </label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] mb-4"
              placeholder="What was done?"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setResolveModal(null)
                  setResolveNote('')
                  setMaintenanceExpectedEnd('')
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => void confirmResolve()} isLoading={resolveSaving}>
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}

function DamageListBlock({
  rows,
  loading,
  onView,
  onResolve,
  emptyMessage,
  resolved,
}: {
  rows: DamageRow[]
  loading: boolean
  onView: (r: DamageRow) => void
  onResolve: (v: { id: string; mode: 'FIXED_ACTIVE' | 'REPAIR_TO_MAINTENANCE' | 'SCRAPPED' }) => void
  emptyMessage: string
  resolved: boolean
}) {
  if (!loading && rows.length === 0) {
    return (
      <Card className="p-8 mb-6 text-center text-[var(--text-secondary)]">
        {emptyMessage}
      </Card>
    )
  }

  return (
    <Card className="p-0 divide-y divide-[var(--border)] mb-6">
      {rows.map((r) => {
        const p = r.productUnit?.product
        const cat = p?.categoryId?.name
        return (
          <div key={r._id} className="px-6 py-4 flex flex-wrap justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                {cat && <span>Category: {cat}</span>}
                {p?.name && <span>Product: {p.name}</span>}
                {p?.modelNumber && <span>Model: {p.modelNumber}</span>}
              </div>
              <p className="font-mono text-sm text-[var(--text-primary)] mt-1">{r.productUnit?.serialNumber}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={r.severity === 'CRITICAL' ? 'cancelled' : 'pending'}>{r.severity}</Badge>
                <Badge variant={r.status === 'RESOLVED' ? 'active' : 'overdue'}>{r.status}</Badge>
              </div>
              <p className="text-[var(--text-primary)] mt-2">{r.description}</p>
              {r.resolvedAt && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Resolved {format(new Date(r.resolvedAt), 'PPp')} · {r.resolutionAction || '—'}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => onView(r)}>
                View
              </Button>
              {!resolved && r.status !== 'RESOLVED' && (
                <>
                  <Button size="sm" type="button" onClick={() => onResolve({ id: r._id, mode: 'FIXED_ACTIVE' })}>
                    Make active
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={() => onResolve({ id: r._id, mode: 'REPAIR_TO_MAINTENANCE' })}>
                    Send to repair
                  </Button>
                  <Button variant="danger" size="sm" type="button" onClick={() => onResolve({ id: r._id, mode: 'SCRAPPED' })}>
                    Scrap
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}
