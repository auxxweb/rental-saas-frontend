import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { parseFilledSerials, validateSerialList } from '@/lib/serialRowsValidation'
import { useAppLocale } from '@/lib/useAppLocale'

interface Category {
  _id: string
  name: string
}

type SerialRow = {
  id: string
  serialNumber: string
  note: string
  imageUrl: string
}

function newRow(): SerialRow {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `r-${Date.now()}-${Math.random()}`
  return { id, serialNumber: '', note: '', imageUrl: '' }
}

function toastApiError(error: { response?: { data?: { message?: string; errors?: { msg: string }[] } } }) {
  const d = error.response?.data
  if (d?.errors?.length) {
    toast.error(d.errors.map((e) => e.msg).join('. '))
  } else {
    toast.error(d?.message || 'Request failed')
  }
}

export default function NewProductPage() {
  const { currencySymbol } = useAppLocale()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    localName: '',
    categoryId: '',
    modelNumber: '',
    description: '',
    pricing: {
      hourly: '',
      daily: '',
      monthly: '',
      yearly: '',
    },
    requireAdvancePayment: false,
    advanceAmount: '',
  })
  const [serialRows, setSerialRows] = useState<SerialRow[]>([newRow(), newRow()])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Category[]>('/shop-categories')
        setCategories(res.data)
      } catch {
        toast.error('Could not load categories')
      } finally {
        setCategoriesLoading(false)
      }
    }
    load()
  }, [])

  const addSerialRow = () => setSerialRows((rows) => [...rows, newRow()])
  const removeSerialRow = (id: string) =>
    setSerialRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)))
  const updateSerialRow = (id: string, patch: Partial<SerialRow>) =>
    setSerialRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))

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

    const filled = parseFilledSerials(serialRows)
    const serialErr = validateSerialList(filled)
    if (serialErr) {
      toast.error(serialErr)
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
      const submitData = {
        name: formData.name.trim(),
        localName: formData.localName.trim() || undefined,
        categoryId: formData.categoryId,
        modelNumber: formData.modelNumber.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        stock: 0,
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
      }

      const createRes = await api.post<{ _id: string }>('/products', submitData)
      const productId = createRes.data._id

      await api.post(`/products/${productId}/serials`, {
        items: filled,
      })

      toast.success('Product saved successfully')
      navigate('/shop/products')
    } catch (error: unknown) {
      toastApiError(error as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <PageHeader title="Add New Product" description="Add a new product to your inventory" />

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
                    disabled={categoriesLoading}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories…' : 'Select a category'}
                    </option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="mt-1 text-sm text-amber-700">
                      No categories yet. Create one under your shop categories first.
                    </p>
                  )}
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

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Serial numbers</h3>
              <p className="text-sm text-gray-500 mb-4">
                At least one serial is required. Each serial must be unique in your shop. Inventory
                count will match how many serials you save (it only changes when serials are added or
                removed).
              </p>

              <div className="space-y-4">
                {serialRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                  >
                    <div className="md:col-span-4">
                      <Input
                        label={`Serial #${idx + 1}`}
                        value={row.serialNumber}
                        onChange={(e) => updateSerialRow(row.id, { serialNumber: e.target.value })}
                        placeholder="e.g. DRLTR-001"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Input
                        label="Note"
                        value={row.note}
                        onChange={(e) => updateSerialRow(row.id, { note: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        label="Image URL"
                        value={row.imageUrl}
                        onChange={(e) => updateSerialRow(row.id, { imageUrl: e.target.value })}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSerialRow(row.id)}
                        disabled={serialRows.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button type="button" variant="outline" onClick={addSerialRow}>
                  Add row
                </Button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} fullWidth>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} fullWidth>
                Create Product
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
