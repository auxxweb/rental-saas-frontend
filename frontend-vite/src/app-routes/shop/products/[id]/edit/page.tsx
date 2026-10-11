import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { isMongoObjectIdString } from '@/lib/mongoId'
import { parseFilledSerials, validateSerialList } from '@/lib/serialRowsValidation'
import { useAppLocale } from '@/lib/useAppLocale'

type Category = { _id: string; name: string }

type InventoryItem = {
  _id: string
  serialNumber: string
  status: string
  note?: string
  imageUrl?: string
}

type ProductPayload = {
  name: string
  localName?: string
  modelNumber?: string
  description?: string
  categoryId?: { _id?: string; name?: string } | string | null
  stock: number
  pricing: { hourly: number; daily: number; monthly: number; yearly?: number }
  requireAdvancePayment?: boolean
  advanceAmount?: number
  isActive?: boolean
  items?: InventoryItem[]
}

type SerialRow = { id: string; serialNumber: string; note: string; imageUrl: string }

function newSerialRow(): SerialRow {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `r-${Date.now()}-${Math.random()}`
  return { id, serialNumber: '', note: '', imageUrl: '' }
}

function badgeVariant(
  s: string
): 'active' | 'pending' | 'overdue' | 'cancelled' {
  if (s === 'ACTIVE') return 'active'
  if (s === 'RENTED') return 'pending'
  if (s === 'MAINTENANCE') return 'overdue'
  return 'cancelled'
}

export default function EditProductPage() {
  const { currencySymbol } = useAppLocale()
  const navigate = useNavigate()
  const params = useParams()
  const productId = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [formData, setFormData] = useState({
    name: '',
    localName: '',
    categoryId: '',
    modelNumber: '',
    description: '',
    stock: '',
    pricing: {
      hourly: '',
      daily: '',
      monthly: '',
      yearly: '',
    },
    requireAdvancePayment: false,
    advanceAmount: '',
    isActive: true,
  })

  /** Per-serial note/image only (status changes use Maintenance / Damage / Units flows) */
  const [serialEdits, setSerialEdits] = useState<
    Record<string, { note: string; imageUrl: string; saving: boolean }>
  >({})

  const [newSerialRows, setNewSerialRows] = useState<SerialRow[]>([newSerialRow()])
  const [addingSerials, setAddingSerials] = useState(false)

  const loadProduct = useCallback(async () => {
    if (!productId || !isMongoObjectIdString(productId)) {
      toast.error('Invalid product')
      navigate('/shop/products')
      return
    }
    try {
      const response = await api.get<ProductPayload>(`/products/${productId}`)
      const p = response.data
      const catId =
        p.categoryId && typeof p.categoryId === 'object' && '_id' in p.categoryId
          ? String((p.categoryId as { _id: string })._id)
          : p.categoryId
            ? String(p.categoryId)
            : ''

      setFormData({
        name: p.name,
        localName: p.localName || '',
        categoryId: catId,
        modelNumber: p.modelNumber || '',
        description: p.description || '',
        stock: String(p.stock ?? 0),
        pricing: {
          hourly: String(p.pricing?.hourly ?? 0),
          daily: String(p.pricing?.daily ?? 0),
          monthly: String(p.pricing?.monthly ?? 0),
          yearly: String(p.pricing?.yearly ?? 0),
        },
        requireAdvancePayment: !!p.requireAdvancePayment,
        advanceAmount: String(p.advanceAmount ?? 0),
        isActive: p.isActive !== false,
      })

      const list = p.items || []
      setItems(list)
      const edits: Record<string, { note: string; imageUrl: string; saving: boolean }> = {}
      for (const it of list) {
        edits[it._id] = {
          note: it.note || '',
          imageUrl: it.imageUrl || '',
          saving: false,
        }
      }
      setSerialEdits(edits)
    } catch {
      toast.error('Error fetching product')
      navigate('/shop/products')
    } finally {
      setFetching(false)
    }
  }, [productId, navigate])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  useEffect(() => {
    api
      .get<Category[]>('/shop-categories')
      .then((r) => setCategories(r.data))
      .catch(() => toast.error('Could not load categories'))
  }, [])

  const updateSerialEdit = (
    serialId: string,
    patch: Partial<(typeof serialEdits)[string]>
  ) => {
    setSerialEdits((d) => ({
      ...d,
      [serialId]: { ...d[serialId], ...patch },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId) {
      toast.error('Please select a category')
      return
    }
    if (!formData.modelNumber.trim()) {
      toast.error('Model number is required')
      return
    }
    if (formData.requireAdvancePayment) {
      const pct = parseFloat(formData.advanceAmount.toString())
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        toast.error('Advance payment must be between 0% and 100%')
        return
      }
    }
    setLoading(true)

    try {
      const hasSerialItems = items.length > 0
      const submitData: Record<string, unknown> = {
        name: formData.name.trim(),
        localName: formData.localName.trim() || undefined,
        categoryId: formData.categoryId,
        modelNumber: formData.modelNumber.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        pricing: {
          hourly: parseFloat(formData.pricing.hourly.toString()) || 0,
          daily: parseFloat(formData.pricing.daily.toString()) || 0,
          monthly: parseFloat(formData.pricing.monthly.toString()) || 0,
          yearly: parseFloat(formData.pricing.yearly.toString()) || 0,
        },
        requireAdvancePayment: formData.requireAdvancePayment,
        advanceAmount: formData.requireAdvancePayment
          ? Math.min(100, Math.max(0, parseFloat(formData.advanceAmount.toString()) || 0))
          : 0,
        isActive: formData.isActive,
      }
      if (!hasSerialItems) {
        submitData.stock = parseInt(formData.stock.toString(), 10) || 0
      }
      await api.patch(`/products/${productId}`, submitData)
      toast.success('Product updated successfully')
      await loadProduct()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Error updating product')
    } finally {
      setLoading(false)
    }
  }

  const saveSerialMeta = async (serialId: string) => {
    const ed = serialEdits[serialId]
    if (!ed) return

    updateSerialEdit(serialId, { saving: true })
    try {
      await api.patch(`/products/serial/${serialId}`, {
        note: ed.note.trim(),
        imageUrl: ed.imageUrl.trim(),
      })
      toast.success('Serial details saved')
      await loadProduct()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to update serial')
      updateSerialEdit(serialId, { saving: false })
    }
  }

  const addNewSerialRow = () => setNewSerialRows((r) => [...r, newSerialRow()])
  const removeNewSerialRow = (id: string) =>
    setNewSerialRows((r) => (r.length <= 1 ? r : r.filter((x) => x.id !== id)))
  const patchNewRow = (id: string, patch: Partial<SerialRow>) =>
    setNewSerialRows((rows) => rows.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const submitNewSerials = async () => {
    const filled = parseFilledSerials(newSerialRows)
    const err = validateSerialList(filled)
    if (err) {
      toast.error(err)
      return
    }
    setAddingSerials(true)
    try {
      await api.post(`/products/${productId}/serials`, { items: filled })
      toast.success('Serials added')
      setNewSerialRows([newSerialRow()])
      await loadProduct()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to add serials')
    } finally {
      setAddingSerials(false)
    }
  }

  if (fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  const hasSerialItems = items.length > 0

  return (
    <Layout>
      <div>
        <PageHeader title="Edit Product" description="Update product information and serials" />

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" type="button" onClick={() => navigate('/shop/products')}>
            Back to list
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => navigate(`/shop/products/${productId}`)}>
            View product
          </Button>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Product Name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
                <Input
                  label="Local Name"
                  type="text"
                  value={formData.localName}
                  onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                  placeholder="Optional local language name"
                />
                <Input
                  label="Model Number"
                  type="text"
                  required
                  value={formData.modelNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, modelNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. DRLTR"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Product description (optional)"
                />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Product active (listed for rental)
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
              {hasSerialItems ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inventory count (serial-tracked)</p>
                  <p className="text-lg font-semibold text-gray-900">{items.length}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This total is the number of serial rows. It only changes when you add or remove
                    serials below—not when a unit is rented or under maintenance.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    No serials yet—set bulk stock here, or add serials below to track each unit.
                  </p>
                  <div className="max-w-xs">
                    <Input
                      label="Stock quantity (bulk)"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.stock}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || /^\d+$/.test(value)) {
                          setFormData({ ...formData, stock: value })
                        }
                      }}
                      onBlur={(e) => {
                        const numValue = parseInt(e.target.value, 10) || 0
                        setFormData({ ...formData, stock: numValue.toString() })
                      }}
                      placeholder="0"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              <p className="text-sm text-gray-500 mb-4">Set rental rates for different time periods</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['hourly', 'daily', 'monthly', 'yearly'] as const).map((key) => (
                  <Input
                    key={key}
                    label={`${key.charAt(0).toUpperCase() + key.slice(1)} (${currencySymbol})`}
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.pricing[key]}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, [key]: value },
                        })
                      }
                    }}
                    onBlur={(e) => {
                      const numValue = parseFloat(e.target.value) || 0
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, [key]: numValue.toString() },
                      })
                    }}
                    placeholder="0.00"
                  />
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advance payment</h3>
              <p className="text-sm text-gray-500 mb-4">
                When enabled, charge this percentage of the rental total as an advance deposit.
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.requireAdvancePayment}
                  onChange={(e) =>
                    setFormData({ ...formData, requireAdvancePayment: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                Require advance payment
              </label>
              {formData.requireAdvancePayment && (
                <div className="mt-4 max-w-xs">
                  <Input
                    label="Advance (%)"
                    type="text"
                    inputMode="decimal"
                    value={formData.advanceAmount}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                        setFormData({ ...formData, advanceAmount: v })
                      }
                    }}
                    onBlur={(e) => {
                      const n = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                      setFormData({ ...formData, advanceAmount: n.toString() })
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} fullWidth>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} fullWidth>
                Save product
              </Button>
            </div>
          </form>
        </Card>

        <Card padding="lg" className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Serial items</h3>
          <p className="text-sm text-gray-500 mb-4">
            Edit <strong>note</strong> and <strong>image URL</strong> only. Status is read-only here — use{' '}
            <button
              type="button"
              className="text-[var(--accent)] underline font-medium"
              onClick={() => navigate(`/shop/products/${productId}/units`)}
            >
              Units
            </button>{' '}
            (Maintenance / Damage) or inventory workflows to change availability.
          </p>
          {!items.length ? (
            <p className="text-sm text-gray-500">No serials yet. Add some below.</p>
          ) : (
            <div className="space-y-6">
              {items.map((it) => {
                const d = serialEdits[it._id]
                if (!d) return null
                return (
                  <div
                    key={it._id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <span className="font-mono font-medium text-gray-900">{it.serialNumber}</span>
                        <Badge variant={badgeVariant(it.status)} className="ml-2">
                          {it.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Note"
                        value={d.note}
                        onChange={(e) => updateSerialEdit(it._id, { note: e.target.value })}
                        placeholder="Optional note"
                      />
                      <Input
                        label="Image URL"
                        value={d.imageUrl}
                        onChange={(e) => updateSerialEdit(it._id, { imageUrl: e.target.value })}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        isLoading={d.saving}
                        onClick={() => void saveSerialMeta(it._id)}
                      >
                        Save serial details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card padding="lg" className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add serials</h3>
          <p className="text-sm text-gray-500 mb-4">Append new units to this product. Serials must be unique shop-wide.</p>
          <div className="space-y-4">
            {newSerialRows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="md:col-span-4">
                  <Input
                    label={`Serial #${idx + 1}`}
                    value={row.serialNumber}
                    onChange={(e) => patchNewRow(row.id, { serialNumber: e.target.value })}
                    placeholder="e.g. DRLTR-004"
                  />
                </div>
                <div className="md:col-span-4">
                  <Input
                    label="Note"
                    value={row.note}
                    onChange={(e) => patchNewRow(row.id, { note: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    label="Image URL"
                    value={row.imageUrl}
                    onChange={(e) => patchNewRow(row.id, { imageUrl: e.target.value })}
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeNewSerialRow(row.id)}
                    disabled={newSerialRows.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addNewSerialRow}>
              Add row
            </Button>
            <Button type="button" onClick={() => void submitNewSerials()} isLoading={addingSerials}>
              Add serials to product
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
