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
  _id?: string
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

type MaintenanceRow = {
  _id: string
  issueDescription: string
  notes?: string
  startDate: string
  expectedEndDate?: string | null
  completedAt?: string | null
  status: string
  productUnit?: ProductUnitPopulated
}

type AppliedFilters = {
  status: string
  search: string
  from: string
  to: string
}

const defaultFilters: AppliedFilters = { status: '', search: '', from: '', to: '' }

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

function sortActiveMaintenance(a: MaintenanceRow, b: MaintenanceRow) {
  const ae = a.expectedEndDate ? new Date(a.expectedEndDate).getTime() : Number.POSITIVE_INFINITY
  const be = b.expectedEndDate ? new Date(b.expectedEndDate).getTime() : Number.POSITIVE_INFINITY
  if (ae !== be) return ae - be
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
}

function sortCompletedMaintenance(a: MaintenanceRow, b: MaintenanceRow) {
  const ac = a.completedAt ? new Date(a.completedAt).getTime() : 0
  const bc = b.completedAt ? new Date(b.completedAt).getTime() : 0
  return bc - ac
}

export default function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const productFromLink = searchParams.get('product')
  const unitFromLink = searchParams.get('unit')

  const [rows, setRows] = useState<MaintenanceRow[]>([])
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
    startDate: '',
    expectedEndDate: '',
    issueDescription: '',
    notes: '',
  })

  const [viewRow, setViewRow] = useState<MaintenanceRow | null>(null)
  const [editRow, setEditRow] = useState<MaintenanceRow | null>(null)
  const [editForm, setEditForm] = useState({
    startDate: '',
    issueDescription: '',
    expectedEndDate: '',
    notes: '',
  })
  const [editSaving, setEditSaving] = useState(false)

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
      setUnits(
        r.data.filter((u) => u.status !== 'RENTED' && !u.isRetired)
      )
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
    if (applied.search.trim()) params.search = applied.search.trim()
    if (applied.from) params.from = applied.from
    if (applied.to) params.to = applied.to

    setLoading(true)
    api
      .get<MaintenanceRow[]>('/inventory/maintenance', { params: Object.keys(params).length ? params : undefined })
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

  const activeRows = useMemo(() => {
    const f = rows.filter((r) => r.status !== 'COMPLETED')
    return [...f].sort(sortActiveMaintenance)
  }, [rows])

  const completedRows = useMemo(() => {
    const f = rows.filter((r) => r.status === 'COMPLETED')
    return [...f].sort(sortCompletedMaintenance)
  }, [rows])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productUnitId.trim()) {
      toast.error('Select a serial number')
      return
    }
    try {
      await api.post('/inventory/maintenance', {
        productUnitId: productUnitId.trim(),
        issueDescription: form.issueDescription.trim(),
        startDate: form.startDate.trim() || undefined,
        expectedEndDate: form.expectedEndDate.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      toast.success('Maintenance started')
      setForm({ startDate: '', expectedEndDate: '', issueDescription: '', notes: '' })
      setProductUnitId('')
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const makeActive = async (id: string) => {
    try {
      await api.patch(`/inventory/maintenance/${id}/complete`, {})
      toast.success('Unit is now available')
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const openEdit = (r: MaintenanceRow) => {
    setEditRow(r)
    setEditForm({
      startDate: format(new Date(r.startDate), "yyyy-MM-dd'T'HH:mm"),
      issueDescription: r.issueDescription,
      expectedEndDate: r.expectedEndDate
        ? format(new Date(r.expectedEndDate), "yyyy-MM-dd'T'HH:mm")
        : '',
      notes: r.notes || '',
    })
  }

  const saveEdit = async () => {
    if (!editRow) return
    setEditSaving(true)
    try {
      await api.patch(`/inventory/maintenance/${editRow._id}`, {
        startDate: editForm.startDate,
        issueDescription: editForm.issueDescription.trim(),
        expectedEndDate: editForm.expectedEndDate || null,
        notes: editForm.notes.trim(),
      })
      toast.success('Updated')
      setEditRow(null)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setEditSaving(false)
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

  return (
    <Layout>
      <PageHeader title="Maintenance" description="Schedule maintenance by category, product, and serial. Open work is listed first; history below." />

      <Card className="p-6 mb-8">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Start maintenance</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Pick a category (optional), then a product — details fill in automatically. Choose the serial to service (use the search box inside each dropdown to find items).
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
              placeholder={productId ? 'Select serial' : 'Select a product first'}
              disabled={!productId || units.length === 0}
            />
          </div>
          {selectedUnit && (
            <div className="md:col-span-2 text-sm text-[var(--text-secondary)]">
              Selected unit status: <Badge variant="pending">{selectedUnit.status}</Badge>
            </div>
          )}
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start date (optional)"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <Input
            label="Expected end (optional)"
            type="datetime-local"
            value={form.expectedEndDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedEndDate: e.target.value }))}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Issue</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)]"
              value={form.issueDescription}
              onChange={(e) => setForm((f) => ({ ...f, issueDescription: e.target.value }))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes (optional)</label>
            <textarea
              className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)]"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button type="submit">Schedule maintenance</Button>
        </form>
      </Card>

      <Card className="p-6 mb-6">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Search matches category, product name, model, local name, serial, issue, and notes. Click Search to apply filters to the history list.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="">All (open first, then completed)</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Search"
              placeholder="Any field…"
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
          <div>
            <Input
              label="Start from"
              type="date"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            />
          </div>
          <div>
            <Input
              label="Start to"
              type="date"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <Button type="button" onClick={applyFilters} isLoading={loading}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      {!applied.status ? (
        <>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 px-1">Open maintenance</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3 px-1">
            Sorted by expected end (soonest first). Use <strong>Make active</strong> to return the serial to available stock.
          </p>
          <MaintenanceListBlock
            rows={activeRows}
            loading={loading}
            onView={setViewRow}
            onEdit={openEdit}
            onMakeActive={makeActive}
            emptyMessage="No open maintenance records."
          />

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 mt-10 px-1">Completed maintenance</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3 px-1">
            Newest completions first. Completed rows are view-only for dates and notes.
          </p>
          <MaintenanceListBlock
            rows={completedRows}
            loading={loading}
            onView={setViewRow}
            onEdit={openEdit}
            onMakeActive={makeActive}
            emptyMessage="No completed records in this filter."
            hideActions
          />
        </>
      ) : (
        <MaintenanceListBlock
          rows={rows}
          loading={loading}
          onView={setViewRow}
          onEdit={openEdit}
          onMakeActive={makeActive}
          emptyMessage="No records match your filters."
          hideActions={applied.status === 'COMPLETED'}
        />
      )}

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="max-w-lg w-full p-6">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Maintenance details</h4>
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
                <dt className="text-[var(--text-secondary)]">Issue</dt>
                <dd className="text-[var(--text-primary)]">{viewRow.issueDescription}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Notes</dt>
                <dd className="text-[var(--text-primary)] whitespace-pre-wrap">{viewRow.notes || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Started</dt>
                <dd className="text-[var(--text-primary)]">{format(new Date(viewRow.startDate), 'PPp')}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Expected end</dt>
                <dd className="text-[var(--text-primary)]">
                  {viewRow.expectedEndDate ? format(new Date(viewRow.expectedEndDate), 'PPp') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Completed</dt>
                <dd className="text-[var(--text-primary)]">
                  {viewRow.completedAt ? format(new Date(viewRow.completedAt), 'PPp') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Status</dt>
                <dd>
                  <Badge variant={viewRow.status === 'COMPLETED' ? 'active' : 'pending'}>{viewRow.status}</Badge>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setViewRow(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editRow && editRow.status !== 'COMPLETED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="max-w-lg w-full p-6">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Edit maintenance</h4>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              {editRow.productUnit?.product?.name} · {editRow.productUnit?.serialNumber}
            </p>
            <div className="space-y-4">
              <Input
                label="Start date"
                type="datetime-local"
                value={editForm.startDate}
                onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Issue</label>
                <textarea
                  className="w-full min-h-[72px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  value={editForm.issueDescription}
                  onChange={(e) => setEditForm((f) => ({ ...f, issueDescription: e.target.value }))}
                />
              </div>
              <Input
                label="Expected end (optional)"
                type="datetime-local"
                value={editForm.expectedEndDate}
                onChange={(e) => setEditForm((f) => ({ ...f, expectedEndDate: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                <textarea
                  className="w-full min-h-[72px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveEdit()} isLoading={editSaving}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}

    </Layout>
  )
}

function MaintenanceListBlock({
  rows,
  loading,
  onView,
  onEdit,
  onMakeActive,
  emptyMessage,
  hideActions,
}: {
  rows: MaintenanceRow[]
  loading: boolean
  onView: (r: MaintenanceRow) => void
  onEdit: (r: MaintenanceRow) => void
  onMakeActive: (id: string) => void
  emptyMessage: string
  hideActions?: boolean
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
              <p className="text-[var(--text-primary)] mt-1">{r.issueDescription}</p>
              {r.notes ? (
                <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{r.notes}</p>
              ) : null}
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Started {format(new Date(r.startDate), 'PPp')}
                {r.expectedEndDate ? ` · Expected end ${format(new Date(r.expectedEndDate), 'PPp')}` : ''}
                {r.completedAt ? ` · Completed ${format(new Date(r.completedAt), 'PPp')}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={r.status === 'COMPLETED' ? 'active' : 'pending'}>{r.status}</Badge>
              <Button variant="outline" size="sm" type="button" onClick={() => onView(r)}>
                View
              </Button>
              {r.status !== 'COMPLETED' && (
                <Button variant="outline" size="sm" type="button" onClick={() => onEdit(r)}>
                  Edit
                </Button>
              )}
              {!hideActions && r.status !== 'COMPLETED' && (
                <Button size="sm" type="button" onClick={() => onMakeActive(r._id)}>
                  Make active
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}
