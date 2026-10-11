import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

interface Shop {
  _id: string
  name: string
  email: string
  shopType?: string
  status: string
  tenantId?: string | null
  subAdminCount?: number
  imageUrl?: string
  admin: {
    name: string
    email: string
  }
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export default function ShopsPage() {
  const navigate = useNavigate()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [passwordChangeModal, setPasswordChangeModal] = useState<{ shopId: string; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

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

  const handlePasswordChange = (shopId: string, adminEmail: string) => {
    setPasswordChangeModal({ shopId, email: adminEmail })
    setNewPassword('')
    setConfirmPassword('')
  }

  const handlePasswordChangeSubmit = async () => {
    if (!passwordChangeModal) return

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      await api.put(`/shops/${passwordChangeModal.shopId}/admin-password`, { newPassword })
      toast.success('Password changed successfully')
      setPasswordChangeModal(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error changing password')
    } finally {
      setChangingPassword(false)
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
        <div className="flex items-center gap-3 min-w-0">
          {row.imageUrl?.trim() ? (
            <img
              src={row.imageUrl}
              alt=""
              className="h-10 w-10 rounded-lg object-cover border border-[var(--border)] shrink-0 bg-[var(--surface-2)]"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-lg border border-[var(--border)] shrink-0 bg-[var(--surface-2)] flex items-center justify-center text-xs text-[var(--text-secondary)]"
              title="No image"
            >
              —
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">{value}</p>
            <p className="text-sm text-[var(--text-secondary)] truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'shopType',
      label: 'Type',
      render: (value: string) => (
        <Badge variant={value === 'car_wash' ? 'active' : 'default'}>
          {value === 'car_wash' ? 'Car Wash' : 'Rental'}
        </Badge>
      ),
      mobileHidden: true,
    },
    {
      key: 'admin',
      label: 'Admin',
      render: (value: any) => (
        <div>
          <p className="text-sm text-[var(--text-primary)]">{value?.name || '-'}</p>
          <p className="text-xs text-[var(--text-secondary)]">{value?.email || '-'}</p>
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
    {
      key: 'subAdminCount',
      label: 'Sub admins',
      render: (_: unknown, row: Shop) => (
        <span className="text-sm text-[var(--text-primary)]">{row.subAdminCount ?? 0}</span>
      ),
      mobileHidden: true,
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
          title="Shops"
          description="Manage all rental shops on the platform"
          action={{
            label: 'Create New Shop',
            onClick: () => navigate('/super-admin/shops/new'),
          }}
        />

        {/* Search Bar */}
        <Card className="mb-6" padding="md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search shops by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
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
              <div className="flex items-center gap-2 sm:mr-1">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  title="View full shop details"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/super-admin/shops/${row._id}`)
                  }}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="!px-2"
                  title="Edit shop"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/super-admin/shops/${row._id}/edit`)
                  }}
                >
                  <PencilIcon className="text-[var(--text-primary)]" />
                </Button>
              </div>
              <select
                value={row.status}
                onChange={(e) => handleStatusChange(row._id, e.target.value, row.name)}
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-[var(--surface)] text-[var(--text-primary)]"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePasswordChange(row._id, row.admin?.email || row.email)
                }}
              >
                Change Password
              </Button>
            </div>
          )}
        />

        {/* Password Change Modal */}
        {passwordChangeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full" padding="lg">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Change Password for {passwordChangeModal.email}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordChangeModal(null)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChangeSubmit}
                  isLoading={changingPassword}
                  disabled={!newPassword || !confirmPassword}
                >
                  Change Password
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
