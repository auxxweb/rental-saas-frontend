import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { format, parseISO } from 'date-fns'

type HistoryPayload = {
  customer: Record<string, unknown>
  bookings: Array<{
    _id: string
    bookingNumber?: string
    startDate: string
    endDate: string
    status: string
    total?: number
    currency?: string
  }>
  invoices: Array<{ invoiceNumber?: string; grandTotal: number; status: string; currency?: string }>
  invoiceSummary: { count: number; totalBilled: number }
  totalSpent: number
  lastRentalDate: string | null
}

export default function CustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [history, setHistory] = useState<HistoryPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get<HistoryPayload>(`/v2/customers/${id}/history`)
        if (!cancelled) setHistory(data)
      } catch {
        toast.error('Could not load customer')
        if (!cancelled) setHistory(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const c = history?.customer

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-4xl">
        <PageHeader title={(c?.name as string) || 'Customer'} description="Details and rental history">
          <Button type="button" variant="outline" onClick={() => navigate('/shop/customers')}>
            Back to list
          </Button>
        </PageHeader>
        {loading && (
          <Card padding="lg">
            <p className="text-[var(--text-secondary)]">Loading…</p>
          </Card>
        )}
        {!loading && !history && (
          <Card padding="lg">
            <p className="text-[var(--text-secondary)]">Customer not found.</p>
          </Card>
        )}
        {!loading && c && (
          <>
            <Card padding="md" className="mb-6 space-y-2 text-sm">
              <p>
                <span className="text-[var(--text-secondary)]">Phone:</span> {String(c.phoneNumber || c.phone || '—')}
              </p>
              <p>
                <span className="text-[var(--text-secondary)]">Email:</span> {String(c.email || '—')}
              </p>
              <p>
                <span className="text-[var(--text-secondary)]">Status:</span>{' '}
                {c.isBlocked ? (
                  <span className="text-red-600">Blocked</span>
                ) : (
                  <span className="text-emerald-600">Active</span>
                )}
              </p>
              <p>
                <span className="text-[var(--text-secondary)]">Contact method:</span> {String(c.contactMethod || '—')}
              </p>
              {(c.internalNotes || c.notes) && (
                <p>
                  <span className="text-[var(--text-secondary)]">Internal notes:</span>{' '}
                  {String(c.internalNotes || c.notes)}
                </p>
              )}
              {(c.documentType || c.documentNumber) && (
                <p>
                  <span className="text-[var(--text-secondary)]">Document:</span>{' '}
                  {String(c.documentType || '')} {String(c.documentNumber || '')}
                </p>
              )}
              {c.documentUrl ? (
                <p>
                  <span className="text-[var(--text-secondary)]">Document URL:</span>{' '}
                  <a href={String(c.documentUrl)} className="text-[var(--accent)] underline" target="_blank" rel="noreferrer">
                    link
                  </a>
                </p>
              ) : null}
            </Card>

            <Card padding="md" className="mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Summary</h3>
              <ul className="text-sm space-y-1 text-[var(--text-secondary)]">
                <li>Total spent (paid/issued invoices): {history?.totalSpent?.toFixed?.(2) ?? history?.totalSpent}</li>
                <li>Last rental activity:{' '}
                  {history?.lastRentalDate
                    ? format(parseISO(String(history.lastRentalDate)), 'PPp')
                    : '—'}
                </li>
                <li>Invoices: {history?.invoiceSummary?.count ?? 0}</li>
              </ul>
            </Card>

            <Card padding="md" className="mb-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Bookings</h3>
              {(history?.bookings?.length ?? 0) === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No bookings yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)] text-sm">
                  {history!.bookings.map((b) => (
                    <li key={b._id} className="py-3 flex flex-wrap justify-between gap-2">
                      <div>
                        <span className="font-mono">{b.bookingNumber || b._id}</span>
                        <span className="text-[var(--text-secondary)]"> · {b.status}</span>
                      </div>
                      <div className="text-[var(--text-secondary)]">
                        {format(parseISO(b.startDate), 'PP')} — {format(parseISO(b.endDate), 'PP')}
                      </div>
                      <Link to="/tenant/bookings" className="text-[var(--accent)] text-xs underline">
                        Bookings workspace
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}
