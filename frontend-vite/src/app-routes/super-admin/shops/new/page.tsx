import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SubAdminRepeater, {
  createSubAdminsForTenant,
  newSubAdminRow,
  type SubAdminDraft,
} from '@/components/super-admin/SubAdminRepeater'

export default function NewShopPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
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
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  })
  const [subAdminRows, setSubAdminRows] = useState<SubAdminDraft[]>([newSubAdminRow()])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.adminPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post<{
        tenantId?: string
        notifications?: { email: string; whatsapp: string }
      }>('/shops', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber || formData.phone,
        shopType: formData.shopType,
        imageUrl: formData.imageUrl.trim() || undefined,
        address: formData.address,
        countryCode: formData.countryCode.trim() || undefined,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
      })

      if (data.tenantId) {
        try {
          const { created, failures } = await createSubAdminsForTenant(
            data.tenantId,
            subAdminRows,
            formData.adminEmail
          )
          if (failures.length) {
            toast.warning(
              `Shop created. ${created} sub-admin(s) added; some failed: ${failures.join('; ')}`
            )
          } else {
            const subNote = created > 0 ? ` ${created} sub-admin(s) added.` : ''
            toast.success(
              `Shop created successfully! Credentials sent via email and WhatsApp.${subNote}`
            )
          }
        } catch (subErr: unknown) {
          const m = subErr instanceof Error ? subErr.message : 'Sub-admin validation failed'
          toast.warning(`Shop created. Sub-admins were not added: ${m}`)
        }
      } else {
        if (subAdminRows.some((r) => r.name.trim() || r.email.trim() || r.password)) {
          toast.warning(
            'Shop created, but sub-admins could not be linked yet. Add them from Edit shop.'
          )
        } else {
          toast.success('Shop created successfully! Credentials sent via email and WhatsApp.')
        }
      }

      navigate('/super-admin/shops')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: { msg: string }[] } } }
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Error creating shop'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectClass =
    'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'

  return (
    <Layout>
      <div>
        <PageHeader
          title="Create shop"
          description="Add a business, owner login, optional sub-admins, and tenant country"
          action={{
            label: 'Back to list',
            onClick: () => navigate('/super-admin/shops'),
          }}
        />

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Shop</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Shop name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Shop email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Phone *
                  </label>
                  <Input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    WhatsApp
                  </label>
                  <Input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="Defaults to phone if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Shop type *
                  </label>
                  <select
                    required
                    value={formData.shopType}
                    onChange={(e) => setFormData({ ...formData, shopType: e.target.value })}
                    className={selectClass}
                  >
                    <option value="rental">Rental</option>
                    <option value="car_wash">Car wash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Tenant country (ISO)
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
                    Used when creating the tenant record (defaults to GB).
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Shop image URL
                  </label>
                  <Input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Street
                  </label>
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    City
                  </label>
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    State
                  </label>
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    ZIP
                  </label>
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Country
                  </label>
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

            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Shop owner (login)
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Credentials are sent by email and WhatsApp where configured.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Owner name *
                  </label>
                  <Input
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Owner email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Password *
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Confirm password *
                  </label>
                  <Input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-8">
              <SubAdminRepeater
                variant="themed"
                rows={subAdminRows}
                onChange={setSubAdminRows}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/super-admin/shops')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                Create shop
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
