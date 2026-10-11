import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Cookies from 'js-cookie'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Customer = { _id: string; name: string; isBlocked?: boolean }

type BookingRow = {
  _id: string
  bookingNumber?: string
  status: string
  customerNotes?: string
  startDate: string
}
type Product = { _id: string; name: string; modelNumber: string }
type Item = { _id: string; serialNumber: string; status: string }

function TenantBookingsPageInner() {
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const prefillSerialDone = useRef(false)

  const { data: customers } = useQuery({
    queryKey: ['v2-customers-all', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<Customer[]>('/v2/customers')).data,
    enabled: ready,
  })

  const { data: bookingsList, refetch: refetchBookings } = useQuery({
    queryKey: ['v2-bookings-list', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<BookingRow[]>('/v2/bookings')).data,
    enabled: ready,
  })

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})

  const addNote = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await api.patch(`/v2/bookings/${id}/add-note`, { note })
    },
    onSuccess: () => {
      refetchBookings()
      qc.invalidateQueries({ queryKey: ['v2-bookings-list'] })
    },
  })

  const { data: products } = useQuery({
    queryKey: ['v2-products-all', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<Product[]>('/v2/catalog-products')).data,
    enabled: ready,
  })

  const [productId, setProductId] = useState('')
  const { data: availableItems } = useQuery({
    queryKey: ['v2-items-available', productId],
    queryFn: async () =>
      (await api.get<Item[]>('/v2/product-items', { params: { productId, status: 'available' } })).data,
    enabled: ready && !!productId,
  })

  const [createError, setCreateError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/v2/bookings', body),
    onSuccess: () => {
      setCreateError(null)
      qc.invalidateQueries({ queryKey: ['v2-items-available'] })
      qc.invalidateQueries({ queryKey: ['v2-analytics'] })
      qc.invalidateQueries({ queryKey: ['v2-bookings-list'] })
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string } } }
      setCreateError(ax.response?.data?.message || 'Could not create booking')
    },
  })

  const [customerId, setCustomerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [pricingMode, setPricingMode] = useState<'hourly' | 'daily' | 'monthly'>('daily')
  const [durValue, setDurValue] = useState(1)
  const [durUnit, setDurUnit] = useState<'hours' | 'days' | 'months'>('days')

  useEffect(() => {
    if (!ready) return
    const pid = searchParams.get('productId')
    const sd = searchParams.get('startDate')
    const ed = searchParams.get('endDate')
    if (pid) setProductId(pid)
    if (sd) {
      const d = new Date(sd)
      if (!Number.isNaN(d.getTime())) setStartDate(toDatetimeLocalValue(d))
    }
    if (ed) {
      const d = new Date(ed)
      if (!Number.isNaN(d.getTime())) setEndDate(toDatetimeLocalValue(d))
    }
  }, [ready, searchParams])

  useEffect(() => {
    const piid = searchParams.get('productItemId')
    if (!piid || prefillSerialDone.current || !availableItems?.length) return
    if (availableItems.some((i) => i._id === piid)) {
      setSelected([piid])
      prefillSerialDone.current = true
    }
  }, [searchParams, availableItems])

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  if (Cookies.get('role') === 'super_admin' && !Cookies.get('tenantId')) {
    return (
      <Layout>
        <Card padding="lg">Select a tenant in the header first.</Card>
      </Layout>
    )
  }

  if (!ready) {
    return (
      <Layout>
        <Card padding="lg">Loading…</Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader
        title="Bookings"
        description="Pick a customer, product, and specific serial numbers. Conflicts are blocked."
      />
      <Card padding="lg" className="max-w-2xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!customerId || !startDate || !endDate || selected.length === 0) return
            setCreateError(null)
            const items = selected.map((productItemId) => ({
              productItemId,
              pricingMode,
              duration: { value: durValue, unit: durUnit },
            }))
            create.mutate({
              customerId,
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              items,
              status: 'confirmed',
            })
            setSelected([])
          }}
        >
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Customer</span>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {(customers || [])
                .filter((c) => !c.isBlocked)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Product</span>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setSelected([])
              }}
              required
            >
              <option value="">Select…</option>
              {(products || []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.modelNumber})
                </option>
              ))}
            </select>
          </label>
          {productId && (
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Available serials</p>
              <div className="border border-[var(--border)] rounded-xl max-h-48 overflow-auto divide-y divide-[var(--border)]">
                {(availableItems || []).map((i) => (
                  <label key={i._id} className="flex items-center gap-2 px-4 py-2 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(i._id)} onChange={() => toggle(i._id)} />
                    <span className="font-mono">{i.serialNumber}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              Start
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              End
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              Pricing mode
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                value={pricingMode}
                onChange={(e) => setPricingMode(e.target.value as 'hourly' | 'daily' | 'monthly')}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="text-sm">
              Duration value
              <input
                type="number"
                min={0.01}
                step={0.01}
                className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                value={durValue}
                onChange={(e) => setDurValue(parseFloat(e.target.value) || 0)}
              />
            </label>
          </div>
          <label className="block text-sm">
            Duration unit
            <select
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2"
              value={durUnit}
              onChange={(e) => setDurUnit(e.target.value as 'hours' | 'days' | 'months')}
            >
              <option value="hours">hours</option>
              <option value="days">days</option>
              <option value="months">months</option>
            </select>
          </label>
          <Button type="submit" disabled={create.isPending}>
            Create booking
          </Button>
        </form>
      </Card>

      <Card padding="lg" className="max-w-2xl mt-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Recent bookings — notes</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Append a timestamped note per booking. Blocked customers are hidden from the selector above.
        </p>
        {!bookingsList?.length ? (
          <p className="text-sm text-[var(--text-secondary)]">No bookings yet.</p>
        ) : (
          <ul className="space-y-4 text-sm">
            {bookingsList.slice(0, 20).map((b) => (
              <li key={b._id} className="border border-[var(--border)] rounded-xl p-3">
                <div className="font-mono text-xs text-[var(--text-secondary)]">
                  {b.bookingNumber || b._id} · {b.status}
                </div>
                {b.customerNotes ? (
                  <pre className="mt-2 text-xs whitespace-pre-wrap text-[var(--text-secondary)] bg-[var(--surface-2)] rounded-lg p-2 max-h-32 overflow-auto">
                    {b.customerNotes}
                  </pre>
                ) : null}
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 bg-[var(--surface)] text-sm"
                    placeholder="Add note…"
                    value={noteDrafts[b._id] || ''}
                    onChange={(e) => setNoteDrafts((d) => ({ ...d, [b._id]: e.target.value }))}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={addNote.isPending || !(noteDrafts[b._id] || '').trim()}
                    onClick={() => {
                      const t = (noteDrafts[b._id] || '').trim()
                      if (!t) return
                      addNote.mutate({ id: b._id, note: t }, { onSuccess: () => setNoteDrafts((d) => ({ ...d, [b._id]: '' })) })
                    }}
                  >
                    Save note
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  )
}

export default function TenantBookingsPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <Card padding="lg">Loading…</Card>
        </Layout>
      }
    >
      <TenantBookingsPageInner />
    </Suspense>
  )
}
