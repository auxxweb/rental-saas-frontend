import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import SubAdminRepeater, {
  createSubAdminsForTenant,
  newSubAdminRow,
} from '@/components/super-admin/SubAdminRepeater'
import type { SubAdminDraft } from '@/components/super-admin/SubAdminRepeater'
import { isMongoObjectIdString } from '@/lib/mongoId'

type ExistingSubUser = {
  _id: string
  name: string
  email: string
  isActive: boolean
}

export default function EditShopPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [existingSubUsers, setExistingSubUsers] = useState<ExistingSubUser[]>([])
  const [subUsersLoading, setSubUsersLoading] = useState(false)
  const [subAdminRows, setSubAdminRows] = useState<SubAdminDraft[]>([newSubAdminRow()])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shopType: 'rental',
    imageUrl: '',
    countryCode: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  })

  const loadSubUsers = useCallback(
    async (tid: string) => {
      setSubUsersLoading(true)
      try {
        const { data } = await api.get<ExistingSubUser[]>(`/admin/sub-users/tenant/${tid}`)
        setExistingSubUsers(data)
      } catch {
        toast.error('Could not load sub-admins')
        setExistingSubUsers([])
      } finally {
        setSubUsersLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!id) return
    if (!isMongoObjectIdString(id)) {
      toast.error('Invalid shop link')
      navigate('/super-admin/shops')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get<{
          tenantId?: string
          admin?: { email?: string }
          settings?: { countryCode?: string }
        }>(`/shops/${id}`)
        if (cancelled) return
        setFormData({
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          shopType: data.shopType ?? 'rental',
          imageUrl: data.imageUrl ?? '',
          countryCode: data.settings?.countryCode ?? '',
          address: {
            street: data.address?.street ?? '',
            city: data.address?.city ?? '',
            state: data.address?.state ?? '',
            zipCode: data.address?.zipCode ?? '',
            country: data.address?.country ?? '',
          },
        })
        const tid = data.tenantId ? String(data.tenantId) : null
        setTenantId(tid)
        const oe =
          (data.admin && typeof data.admin === 'object' && 'email' in data.admin
            ? String((data.admin as { email?: string }).email ?? '')
            : '') || ''
        setOwnerEmail(oe)
        if (tid) {
          void loadSubUsers(tid)
        }
      } catch {
        toast.error('Could not load shop')
        navigate('/super-admin/shops')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, navigate, loadSubUsers])

  const removeExistingSubUser = async (subId: string) => {
    if (!confirm('Remove this sub admin? They will no longer be able to sign in.')) return
    try {
      await api.delete(`/admin/sub-users/${subId}`)
      toast.success('Sub admin removed')
      if (tenantId) void loadSubUsers(tenantId)
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Remove failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !isMongoObjectIdString(id)) {
      toast.error('Invalid shop')
      return
    }
    setSaving(true)
    try {
      const { data: updated } = await api.put<{
        admin?: { email?: string }
      }>(`/shops/${id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        shopType: formData.shopType,
        imageUrl: formData.imageUrl.trim(),
        address: formData.address,
        settings: {
          countryCode: formData.countryCode.trim().toUpperCase(),
        },
      })

      const adminEmail =
        updated.admin && typeof updated.admin === 'object' && 'email' in updated.admin
          ? String((updated.admin as { email?: string }).email ?? '')
          : ownerEmail
      if (adminEmail) setOwnerEmail(adminEmail)

      let tid = tenantId
      if (!tid) {
        const { data: snap } = await api.get<{ tenantId?: string }>(`/shops/${id}`)
        tid = snap.tenantId ? String(snap.tenantId) : null
        setTenantId(tid)
      }

      if (tid) {
        try {
          const { created, failures } = await createSubAdminsForTenant(
            tid,
            subAdminRows,
            adminEmail
          )
          if (failures.length) {
            toast.warning(
              `Shop saved. ${created} sub-admin(s) added; some failed: ${failures.join('; ')}`
            )
          } else if (created > 0) {
            toast.success(`Shop updated. ${created} sub-admin(s) added.`)
            setSubAdminRows([newSubAdminRow()])
          } else {
            toast.success('Shop updated')
          }
        } catch (subErr: unknown) {
          const m = subErr instanceof Error ? subErr.message : 'Invalid sub-admin rows'
          toast.warning(`Shop saved. Sub-admins not added: ${m}`)
        }
      } else if (subAdminRows.some((r) => r.name.trim() || r.email.trim() || r.password)) {
        toast.warning(
          'Shop saved. Tenant not ready for sub-admins — refresh this page and try adding them again.'
        )
      } else {
        toast.success('Shop updated')
      }

      navigate('/super-admin/shops')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Error updating shop')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Edit shop"
          description="Update shop details, tax country code, image URL, and sub-admins"
          action={{
            label: 'Back to list',
            onClick: () => navigate('/super-admin/shops'),
            variant: 'secondary',
          }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => id && navigate(`/super-admin/shops/${id}`)}
          >
            View shop
          </Button>
        </PageHeader>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Shop</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Shop name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Shop email *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Shop type *</label>
                  <select
                    required
                    value={formData.shopType}
                    onChange={(e) => setFormData({ ...formData, shopType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    <option value="rental">Rental</option>
                    <option value="car_wash">Car wash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Tax country (ISO)
                  </label>
                  <Input
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. GB, AE"
                    maxLength={4}
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Saved to shop settings (VAT / defaults).
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Shop image URL
                  </label>
                  <Input
                    type="text"
                    placeholder="https://…"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Shown on the shop detail page; use “Open image URL” there to preview.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Street</label>
                  <Input
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">City</label>
                  <Input
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">State</label>
                  <Input
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">ZIP</label>
                  <Input
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Country</label>
                  <Input
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-8 space-y-8">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sub admins</h2>

              {!tenantId ? (
                <p className="text-sm text-amber-700 dark:text-amber-300/90">
                  No tenant linked yet. After you save, the platform will attach one if needed; refresh the page if sub-admins do not appear.
                </p>
              ) : null}

              {tenantId ? (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Current sub admins</h3>
                  {subUsersLoading ? (
                    <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
                  ) : existingSubUsers.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">None yet. Add below.</p>
                  ) : (
                    <ul className="space-y-2">
                      {existingSubUsers.map((u) => (
                        <li
                          key={u._id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                        >
                          <div>
                            <span className="font-medium text-[var(--text-primary)]">{u.name}</span>
                            <span className="text-[var(--text-secondary)] mx-2">·</span>
                            <span className="text-sm text-[var(--text-secondary)]">{u.email}</span>
                            <Badge variant={u.isActive ? 'active' : 'suspended'} size="sm" className="ml-2">
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeExistingSubUser(u._id)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              <SubAdminRepeater
                variant="themed"
                title="Add sub admins"
                description="Add one or more sub-admins (username, email, password). Use “Add sub admin” for more rows. Empty rows are ignored when you save."
                rows={subAdminRows}
                onChange={setSubAdminRows}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/super-admin/shops')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving}>
                Save
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
