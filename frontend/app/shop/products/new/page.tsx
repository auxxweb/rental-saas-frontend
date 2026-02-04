'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    stock: 0,
    pricing: {
      hourly: 0,
      daily: 0,
      monthly: 0
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/products', formData)
      toast.success('Product created successfully')
      router.push('/shop/products')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Add New Product"
          description="Add a new product to your inventory"
        />

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
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
                  label="Category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Equipment, Tools"
                />
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Product description (optional)"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
              <div className="max-w-xs">
                <Input
                  label="Stock Quantity"
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              <p className="text-sm text-gray-500 mb-4">Set rental rates for different time periods</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Hourly Rate ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing.hourly}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, hourly: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="0.00"
                />
                <Input
                  label="Daily Rate ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing.daily}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, daily: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="0.00"
                />
                <Input
                  label="Monthly Rate ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricing.monthly}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, monthly: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                fullWidth
              >
                Create Product
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
