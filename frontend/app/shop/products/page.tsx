'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

interface Product {
  _id: string
  name: string
  category: string
  stock: number
  pricing: {
    hourly: number
    daily: number
    monthly: number
  }
  isActive: boolean
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      toast.error('Error fetching products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting product')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (value: string, row: Product) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{value}</p>
          {row.category && (
            <p className="text-sm text-[var(--text-secondary)]">{row.category}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value: number) => (
        <span className={`font-medium ${value > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
          {value} units
        </span>
      ),
    },
    {
      key: 'pricing',
      label: 'Pricing',
      render: (value: any) => (
        <div className="text-sm">
          <p className="text-[var(--text-primary)]">${value.hourly}/hr</p>
          <p className="text-[var(--text-secondary)]">${value.daily}/day</p>
          <p className="text-[var(--text-secondary)]">${value.monthly}/mo</p>
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'active' : 'cancelled'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
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
            onClick: () => router.push('/shop/products/new'),
          }}
        />

        {/* Search Bar */}
        <Card className="mb-6" padding="md">
          <Input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </Card>

        {/* Products Table */}
        <ResponsiveTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="No products found. Create your first product to get started."
          actions={(row) => (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/shop/products/${row._id}/edit`)
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
          onRowClick={(row) => router.push(`/shop/products/${row._id}/edit`)}
        />

        {/* Mobile: Add Product Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => router.push('/shop/products/new')}
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
