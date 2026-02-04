'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
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

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`)
      setFormData({
        name: response.data.name,
        category: response.data.category || '',
        description: response.data.description || '',
        stock: response.data.stock,
        pricing: response.data.pricing
      })
    } catch (error) {
      toast.error('Error fetching product')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put(`/products/${productId}`, formData)
      toast.success('Product updated successfully')
      router.push('/shop/products')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating product')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Edit Product"
          description="Update product information"
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
                Update Product
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
