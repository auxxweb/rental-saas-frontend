import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { isMongoObjectIdString } from '@/lib/mongoId'

type ShopDetail = {
  _id: string
  name: string
  email: string
  phone?: string
  imageUrl?: string
  shopType?: string
  status?: string
  termsAndConditions?: string
  tenantId?: string | null
  subAdminCount?: number
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  admin?: { name?: string; email?: string } | null
  settings?: {
    currency?: string
    countryCode?: string
    timezone?: string
    taxRate?: number
    taxInclusive?: boolean
    language?: string
  }
  subscription?: {
    plan?: string
    planId?: string | null
    isActive?: boolean
    startDate?: string
    endDate?: string
  }
  createdAt?: string
  updatedAt?: string
}

function formatDate(val: unknown): string | undefined {
  if (val == null || val === '') return undefined
  const d = new Date(val as string)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleString()
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-[var(--border)] last:border-0">
      <dt className="text-sm font-medium text-[var(--text-secondary)]">{label}</dt>
      <dd className="sm:col-span-2 text-sm text-[var(--text-primary)] break-words">{value ?? '—'}</dd>
    </div>
  )
}

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<ShopDetail | null>(null)

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
        const { data } = await api.get<ShopDetail>(`/shops/${id}`)
        if (!cancelled) setShop(data)
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
  }, [id, navigate])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  if (!shop) return null

  const status = shop.status || '—'
  const statusVariant =
    status === 'active'
      ? 'active'
      : status === 'pending'
        ? 'pending'
        : status === 'suspended'
          ? 'suspended'
          : 'cancelled'

  return (
    <Layout>
      <div>
        <PageHeader
          title={shop.name}
          description="Shop profile and settings (read-only)"
          action={{
            label: 'Edit shop',
            onClick: () => navigate(`/super-admin/shops/${shop._id}/edit`),
          }}
        />

        <div className="flex flex-col lg:flex-row gap-6 max-w-5xl">
          <Card className="lg:w-72 shrink-0" padding="lg">
            <div className="aspect-square max-h-64 mx-auto rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] mb-4">
              {shop.imageUrl?.trim() ? (
                <img
                  src={shop.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-sm p-4 text-center">
                  No image URL
                </div>
              )}
            </div>
            {shop.imageUrl?.trim() ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                className="mb-2"
                onClick={() =>
                  window.open(shop.imageUrl!.trim(), '_blank', 'noopener,noreferrer')
                }
              >
                Open image URL
              </Button>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Badge variant={shop.shopType === 'car_wash' ? 'active' : 'default'}>
                {shop.shopType === 'car_wash' ? 'Car wash' : 'Rental'}
              </Badge>
              <Badge variant={statusVariant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
            </div>
          </Card>

          <Card className="flex-1 min-w-0" padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Contact &amp; IDs</h2>
            <dl>
              <DetailRow label="Shop email" value={shop.email} />
              <DetailRow label="Phone" value={shop.phone} />
              <DetailRow
                label="Business owner"
                value={
                  shop.admin ? (
                    <>
                      {shop.admin.name}
                      <br />
                      <span className="text-[var(--text-secondary)]">{shop.admin.email}</span>
                    </>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow label="Tenant ID" value={shop.tenantId ? String(shop.tenantId) : '—'} />
              <DetailRow label="Sub admins (active)" value={String(shop.subAdminCount ?? 0)} />
              <DetailRow label="Shop ID" value={shop._id} />
            </dl>

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-4">Address</h2>
            <dl>
              <DetailRow label="Street" value={shop.address?.street} />
              <DetailRow label="City" value={shop.address?.city} />
              <DetailRow label="State / region" value={shop.address?.state} />
              <DetailRow label="ZIP / postal" value={shop.address?.zipCode} />
              <DetailRow label="Country" value={shop.address?.country} />
            </dl>

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-4">Settings</h2>
            <dl>
              <DetailRow label="Currency" value={shop.settings?.currency} />
              <DetailRow label="Country code" value={shop.settings?.countryCode} />
              <DetailRow label="Timezone" value={shop.settings?.timezone} />
              <DetailRow
                label="Tax rate %"
                value={
                  shop.settings?.taxRate != null ? String(shop.settings.taxRate) : undefined
                }
              />
              <DetailRow
                label="Tax inclusive"
                value={shop.settings?.taxInclusive != null ? String(shop.settings.taxInclusive) : undefined}
              />
              <DetailRow label="Language" value={shop.settings?.language} />
            </dl>

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-4">Subscription</h2>
            <dl>
              <DetailRow label="Plan (slug)" value={shop.subscription?.plan} />
              <DetailRow
                label="Plan ID"
                value={
                  shop.subscription?.planId != null && shop.subscription.planId !== ''
                    ? String(shop.subscription.planId)
                    : undefined
                }
              />
              <DetailRow
                label="Active"
                value={
                  shop.subscription?.isActive != null
                    ? shop.subscription.isActive
                      ? 'Yes'
                      : 'No'
                    : undefined
                }
              />
              <DetailRow label="Start" value={formatDate(shop.subscription?.startDate)} />
              <DetailRow label="End" value={formatDate(shop.subscription?.endDate)} />
            </dl>

            {shop.termsAndConditions ? (
              <>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-4">
                  Terms &amp; conditions
                </h2>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap border border-[var(--border)] rounded-lg p-3 bg-[var(--surface-2)]">
                  {shop.termsAndConditions}
                </p>
              </>
            ) : null}

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-4">Record</h2>
            <dl>
              <DetailRow label="Created" value={formatDate(shop.createdAt)} />
              <DetailRow label="Updated" value={formatDate(shop.updatedAt)} />
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/super-admin/shops')}>
                Back to list
              </Button>
              <Button type="button" onClick={() => navigate(`/super-admin/shops/${shop._id}/edit`)}>
                Edit shop
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
