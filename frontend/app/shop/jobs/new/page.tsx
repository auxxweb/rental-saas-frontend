'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'

interface Product {
  _id: string
  name: string
  stock: number
  pricing: {
    hourly: number
    daily: number
    monthly: number
  }
}

interface Customer {
  _id: string
  name: string
  phone: string
}

interface JobItem {
  product: string
  quantity: number
  pricingMode: 'hourly' | 'daily' | 'monthly'
  duration: {
    value: number
    unit: string
  }
  rate: number
  subtotal: number
}

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customer: '',
    startDate: '',
    expectedReturnDate: '',
    notes: ''
  })
  const [items, setItems] = useState<JobItem[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data.filter((p: Product) => p.stock > 0))
    } catch (error) {
      toast.error('Error fetching products')
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers')
      setCustomers(response.data)
    } catch (error) {
      toast.error('Error fetching customers')
    }
  }

  const addItem = () => {
    setItems([...items, {
      product: '',
      quantity: 1,
      pricingMode: 'daily',
      duration: { value: 1, unit: 'days' },
      rate: 0,
      subtotal: 0
    }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    const item = newItems[index]

    if (field === 'product') {
      const product = products.find(p => p._id === value)
      if (product) {
        item.product = value
        item.rate = product.pricing[item.pricingMode] || 0
        item.subtotal = calculateSubtotal(item.rate, item.duration.value, item.pricingMode) * item.quantity
      }
    } else if (field === 'pricingMode') {
      const pricingMode = value as 'hourly' | 'daily' | 'monthly'
      item.pricingMode = pricingMode
      const product = products.find(p => p._id === item.product)
      if (product && (pricingMode === 'hourly' || pricingMode === 'daily' || pricingMode === 'monthly')) {
        item.rate = product.pricing[pricingMode] || 0
        item.subtotal = calculateSubtotal(item.rate, item.duration.value, pricingMode) * item.quantity
      }
    } else if (field === 'quantity') {
      item.quantity = parseInt(value) || 1
      item.subtotal = calculateSubtotal(item.rate, item.duration.value, item.pricingMode) * item.quantity
    } else if (field === 'duration') {
      item.duration.value = parseFloat(value) || 1
      item.subtotal = calculateSubtotal(item.rate, item.duration.value, item.pricingMode) * item.quantity
    }

    newItems[index] = item
    setItems(newItems)
  }

  const calculateSubtotal = (rate: number, duration: number, mode: string) => {
    return rate * duration
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setLoading(true)

    try {
      const jobItems = items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        pricingMode: item.pricingMode,
        duration: item.duration
      }))

      const response = await api.post('/jobs', {
        ...formData,
        items: jobItems
      })

      toast.success('Job created successfully')
      router.push(`/shop/jobs/${response.data._id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating job')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Job</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Return Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                    <select
                      required
                      value={item.product}
                      onChange={(e) => updateItem(index, 'product', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Mode *</label>
                    <select
                      required
                      value={item.pricingMode}
                      onChange={(e) => updateItem(index, 'pricingMode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.1"
                      value={item.duration.value}
                      onChange={(e) => updateItem(index, 'duration', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="text-lg font-medium">${item.subtotal.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {items.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
