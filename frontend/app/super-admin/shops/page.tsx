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

interface Shop {
  _id: string
  name: string
  email: string
  status: string
  admin: {
    name: string
    email: string
  }
}

export default function ShopsPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops')
      setShops(response.data)
    } catch (error) {
      toast.error('Error fetching shops')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (shopId: string, newStatus: string, shopName: string) => {
    try {
      await api.put(`/shops/${shopId}`, { status: newStatus })
      toast.success(`Shop status updated to ${newStatus}`)
      fetchShops()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating shop status')
    }
  }

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusVariant = (status: string): 'active' | 'pending' | 'suspended' | 'cancelled' => {
    switch (status) {
      case 'active':
        return 'active'
      case 'pending':
        return 'pending'
      case 'suspended':
        return 'suspended'
      default:
        return 'cancelled'
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Shop Name',
      render: (value: string, row: Shop) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'admin',
      label: 'Admin',
      render: (value: any) => (
        <div>
          <p className="text-sm text-gray-900">{value?.name || '-'}</p>
          <p className="text-xs text-gray-500">{value?.email || '-'}</p>
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusVariant(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
  ]

  if (loading) {
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
          title="Shops"
          description="Manage all rental shops on the platform"
          action={{
            label: 'Create New Shop',
            onClick: () => router.push('/super-admin/shops/new'),
          }}
        />

        {/* Search Bar */}
        <Card className="mb-6" padding="md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search shops by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Shops Table */}
        <ResponsiveTable
          columns={columns}
          data={filteredShops}
          emptyMessage="No shops found. Create your first shop to get started."
          actions={(row) => (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={row.status}
                onChange={(e) => handleStatusChange(row._id, e.target.value, row.name)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        />
      </div>
    </Layout>
  )
}
