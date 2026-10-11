import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'

type RentalType = 'hourly' | 'daily' | 'monthly' | 'yearly'

/** API may send categoryId as an id string or populated { _id, name } */
function normalizeProductCategoryId(categoryId: unknown): string {
  if (categoryId == null || categoryId === '') return ''
  if (typeof categoryId === 'string') return categoryId
  if (typeof categoryId === 'object' && categoryId !== null && '_id' in categoryId) {
    return String((categoryId as { _id: string })._id)
  }
  return String(categoryId)
}

interface Product {
  _id: string
  name: string
  stock: number
  availableCount?: number
  categoryId?: string | { _id: string; name?: string } | null
  /** Legacy string category when categoryId unset */
  category?: string
  pricing: {
    hourly: number
    daily: number
    monthly: number
    yearly: number
  }
}

interface Category {
  _id: string
  name: string
}

interface UnitRow {
  _id: string
  serialNumber: string
  status: string
}

interface JobLineDraft {
  productId: string
  categoryFilter: string
  productItemId: string
  rentalType: RentalType
  serialFilter: string
  units: UnitRow[]
}

export default function NewJobPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  type CustomerRow = { _id: string; name: string; phone: string; email?: string | null }
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [customerSearchDraft, setCustomerSearchDraft] = useState('')
  const [customersLoading, setCustomersLoading] = useState(false)
  /** Keeps the chosen row visible if the current search list no longer includes them */
  const [lastPickedCustomer, setLastPickedCustomer] = useState<CustomerRow | null>(null)
  /** Only true after user runs Search or Show all — no results list on first paint */
  const [customerResultsShown, setCustomerResultsShown] = useState(false)
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new')
  const [formData, setFormData] = useState({
    customer: '',
    startDate: '',
    expectedReturnDate: '',
    notes: '',
    advanceEnabled: false,
    advanceAmount: '0',
  })
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  })
  const [items, setItems] = useState<JobLineDraft[]>([])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/shop-categories')
      setCategories(Array.isArray(response.data) ? response.data : [])
    } catch {
      toast.error('Error fetching categories')
    }
  }

  /** Load full shop catalog once; category is filtered client-side per row. */
  const fetchProducts = useCallback(async () => {
    try {
      const params: Record<string, string> = { includeAvailability: 'true' }
      const response = await api.get('/products', { params })
      const raw = response.data
      const list: Product[] = Array.isArray(raw) ? raw : (raw as { items?: Product[] })?.items || []
      setProducts(
        list.filter((p: Product) => (p.availableCount != null ? p.availableCount > 0 : p.stock > 0))
      )
    } catch {
      toast.error('Error fetching products')
    }
  }, [])

  const fetchCustomers = useCallback(async (search?: string) => {
    setCustomersLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search != null && String(search).trim()) {
        params.search = String(search).trim()
      }
      const response = await api.get('/customers', Object.keys(params).length ? { params } : undefined)
      const raw = Array.isArray(response.data) ? response.data : []
      const list: CustomerRow[] = raw.map((c: CustomerRow & { _id: unknown }) => ({
        ...c,
        _id: String(c._id),
        name: c.name ?? '',
        phone: c.phone ?? '',
      }))
      setCustomers(list)
    } catch {
      toast.error('Error fetching customers')
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  const applyCustomerSearch = () => {
    setCustomerResultsShown(true)
    fetchCustomers(customerSearchDraft)
  }

  useEffect(() => {
    if (customerMode === 'new') {
      setFormData((fd) => ({ ...fd, customer: '' }))
      setLastPickedCustomer(null)
    } else {
      setCustomerSearchDraft('')
      setCustomerResultsShown(false)
      setCustomers([])
    }
  }, [customerMode])

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [fetchProducts])

  const customersForDropdown = useMemo(() => {
    const id = formData.customer
    if (!id || !lastPickedCustomer || String(lastPickedCustomer._id) !== String(id)) {
      return customers
    }
    if (customers.some((c) => String(c._id) === String(id))) {
      return customers
    }
    return [lastPickedCustomer, ...customers]
  }, [customers, formData.customer, lastPickedCustomer])

  const loadUnits = async (index: number, productId: string) => {
    if (!productId) return
    try {
      const response = await api.get(`/products/${productId}/units`, {
        params: { forBooking: '1' },
      })
      const units = (response.data.units || []) as UnitRow[]
      setItems((prev) => {
        const next = [...prev]
        if (!next[index]) return prev
        next[index] = { ...next[index], units }
        return next
      })
    } catch {
      toast.error('Error loading serial numbers')
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        categoryFilter: '',
        productItemId: '',
        rentalType: 'daily' as RentalType,
        serialFilter: '',
        units: [],
      },
    ])
  }

  const updateItem = async (index: number, field: keyof JobLineDraft, value: string) => {
    const newItems = [...items]
    const row = { ...newItems[index] }
    if (field === 'categoryFilter') {
      row.categoryFilter = value
      row.productId = ''
      row.productItemId = ''
      row.units = []
      newItems[index] = row
      setItems(newItems)
      return
    }
    if (field === 'productId') {
      row.productId = value
      row.productItemId = ''
      row.units = []
      newItems[index] = row
      setItems(newItems)
      if (value) void loadUnits(index, value)
      return
    }
    if (field === 'rentalType') {
      row.rentalType = value as RentalType
    } else if (field === 'productItemId') {
      row.productItemId = value
    } else if (field === 'serialFilter') {
      row.serialFilter = value
    }
    newItems[index] = row
    setItems(newItems)
  }

  const filteredUnits = (row: JobLineDraft) => {
    const f = row.serialFilter.trim().toLowerCase()
    if (!f) return row.units
    return row.units.filter((u) => u.serialNumber.toLowerCase().includes(f))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (customerMode === 'existing') {
      const cid = String(formData.customer || '').trim()
      if (!cid) {
        toast.error('Select a customer')
        return
      }
      const looksLikeMongoId = /^[a-f\d]{24}$/i.test(cid)
      if (!looksLikeMongoId) {
        toast.error('Invalid customer selection')
        return
      }
    }
    if (customerMode === 'new') {
      if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
        toast.error('New customer name and phone are required')
        return
      }
    }
    if (!formData.startDate || !formData.expectedReturnDate) {
      toast.error('Start and expected return date and time are required')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const row = items[i]
      if (!row.productId) {
        toast.error(`Select a product for line ${i + 1}`)
        return
      }
      if (row.units.length > 0 && !row.productItemId) {
        toast.error(`Select a serial for line ${i + 1}`)
        return
      }
    }

    setLoading(true)
    try {
      const payloadItems = items.map((row) => {
        const body: Record<string, unknown> = {
          product: row.productId,
          rentalType: row.rentalType,
        }
        if (row.productItemId) body.productItemId = row.productItemId
        else body.quantity = 1
        return body
      })

      const firstLineType = (items[0]?.rentalType || 'daily') as RentalType
      const body: Record<string, unknown> = {
        workflowVersion: 2,
        startDate: formData.startDate,
        expectedReturnDate: formData.expectedReturnDate,
        notes: formData.notes,
        rentalType: firstLineType,
        advanceEnabled: formData.advanceEnabled,
        advanceAmount: parseFloat(formData.advanceAmount) || 0,
        items: payloadItems,
      }
      if (customerMode === 'existing') {
        body.customer = String(formData.customer).trim()
      } else {
        body.newCustomer = {
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          ...(newCustomer.email.trim() ? { email: newCustomer.email.trim() } : {}),
          address: {
            street: newCustomer.street.trim(),
            city: newCustomer.city.trim(),
            state: newCustomer.state.trim(),
            zipCode: newCustomer.zipCode.trim(),
            country: newCustomer.country.trim(),
          },
        }
      }

      const response = await api.post('/jobs', body)

      toast.success('Job created successfully')
      navigate(`/shop/jobs/${response.data._id}`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; suggestedSerials?: { serialNumber: string }[] } } }
      const msg = err.response?.data?.message || 'Error creating job'
      toast.error(msg)
      const sug = err.response?.data?.suggestedSerials
      if (sug?.length) {
        toast.info(`Try serials: ${sug.map((s) => s.serialNumber).join(', ')}`)
      }
    } finally {
      setLoading(false)
    }
  }

  /** Filter by categoryId (string or populated object), else match legacy `category` string to selected category name */
  const getProductsForLine = useMemo(() => {
    return (categoryId: string) => {
      if (!categoryId) return products
      const want = String(categoryId)
      const byId = products.filter((p) => normalizeProductCategoryId(p.categoryId) === want)
      if (byId.length > 0) return byId
      const cat = categories.find((c) => c._id === categoryId)
      const name = cat?.name?.trim().toLowerCase()
      if (!name) return []
      return products.filter(
        (p) => p.category && String(p.category).trim().toLowerCase() === name
      )
    }
  }, [products, categories])

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Job</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">1. Customer & schedule</h2>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <div className="flex flex-wrap gap-4 mb-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="customerMode"
                    checked={customerMode === 'new'}
                    onChange={() => {
                      setCustomerMode('new')
                    }}
                  />
                  <span className="text-sm text-gray-800">New customer</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="customerMode"
                    checked={customerMode === 'existing'}
                    onChange={() => {
                      setCustomerMode('existing')
                    }}
                  />
                  <span className="text-sm text-gray-800">Existing customer</span>
                </label>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Search by name, email, or phone, then click <strong>Search</strong> or <strong>Show all</strong>.
                    Matching customers appear below — use <strong>Select</strong> on a row for this job.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <input
                      type="text"
                      placeholder="Search customers…"
                      value={customerSearchDraft}
                      onChange={(e) => setCustomerSearchDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          applyCustomerSearch()
                        }
                      }}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={applyCustomerSearch}
                        disabled={customersLoading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 text-sm"
                      >
                        {customersLoading ? 'Searching…' : 'Search'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearchDraft('')
                          setCustomerResultsShown(true)
                          fetchCustomers()
                        }}
                        disabled={customersLoading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Show all
                      </button>
                    </div>
                  </div>

                  {formData.customer && lastPickedCustomer && String(formData.customer) === String(lastPickedCustomer._id) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-gray-800">
                      <span>
                        <span className="font-medium">Selected:</span> {lastPickedCustomer.name} — {lastPickedCustomer.phone}
                        {lastPickedCustomer.email ? ` (${lastPickedCustomer.email})` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLastPickedCustomer(null)
                          setFormData({ ...formData, customer: '' })
                        }}
                        className="text-red-700 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {!customerResultsShown ? (
                    <p className="text-sm text-gray-500 py-2">
                      Results will appear here after you click Search or Show all.
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Results</p>
                      <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-200 bg-white">
                        {customersLoading && customersForDropdown.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">Loading…</div>
                        ) : customersForDropdown.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">No matching customers.</div>
                        ) : (
                          customersForDropdown.map((c) => {
                            const vid = String(c._id)
                            const selected = String(formData.customer) === vid
                            return (
                              <div
                                key={vid}
                                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 ${
                                  selected ? 'bg-sky-50' : ''
                                }`}
                              >
                                <div className="min-w-0 text-sm">
                                  <span className="font-medium text-gray-900">{c.name}</span>
                                  <span className="text-gray-600"> — {c.phone}</span>
                                  {c.email ? (
                                    <span className="block text-gray-500 truncate break-all">{c.email}</span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLastPickedCustomer(c)
                                    setFormData({ ...formData, customer: vid })
                                  }}
                                  disabled={selected}
                                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
                                    selected
                                      ? 'bg-gray-200 text-gray-600 cursor-default'
                                      : 'bg-primary-600 text-white hover:bg-primary-700'
                                  }`}
                                >
                                  {selected ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-3">
                      Details are saved to your customer list when the job is created.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      required
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      required
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <input
                      value={newCustomer.street}
                      onChange={(e) => setNewCustomer({ ...newCustomer, street: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State / region</label>
                    <input
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / postal</label>
                    <input
                      value={newCustomer.zipCode}
                      onChange={(e) => setNewCustomer({ ...newCustomer, zipCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      value={newCustomer.country}
                      onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated return *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Booking buffer between serials is set automatically on the server (2 minutes). Set rental type per
              line under Products & serials.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">2. Products & serials</h2>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">At least one line. Serial-tracked products require a serial.</p>
              <button
                type="button"
                onClick={addItem}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Add product
              </button>
            </div>

            {items.map((row, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={row.categoryFilter}
                      onChange={(e) => updateItem(index, 'categoryFilter', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                    <select
                      required
                      value={row.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select</option>
                      {(row.categoryFilter ? getProductsForLine(row.categoryFilter) : products).map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rental type</label>
                    <select
                      value={row.rentalType}
                      onChange={(e) => updateItem(index, 'rentalType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Serial (search)</label>
                    <input
                      type="text"
                      placeholder="Filter serials..."
                      value={row.serialFilter}
                      onChange={(e) => updateItem(index, 'serialFilter', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                    />
                    <select
                      value={row.productItemId}
                      onChange={(e) => updateItem(index, 'productItemId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">
                        {row.units.length === 0 && row.productId ? 'Loading…' : 'Select serial'}
                      </option>
                      {filteredUnits(row).map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.serialNumber} ({u.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove line
                  </button>
                </div>
              </div>
            ))}

            {items.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Tip: pick a category to narrow products. Invoice totals are computed when items are returned.
              </p>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">3. Advance payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end max-w-2xl">
              <div className="flex items-center gap-2">
                <input
                  id="adv"
                  type="checkbox"
                  checked={formData.advanceEnabled}
                  onChange={(e) => setFormData({ ...formData, advanceEnabled: e.target.checked })}
                />
                <label htmlFor="adv" className="text-sm text-gray-700">
                  Advance payment
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advance amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={!formData.advanceEnabled}
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create job'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
