import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

type PopulatedPlan = { _id: string; title: string; name: string; price: number; currency: string }

type RequestRow = {
  _id: string
  status: string
  paymentReference?: string
  paymentNote?: string
  adminNote?: string
  createdAt: string
  shop?: { _id: string; name: string; email: string }
  requestedPlan?: PopulatedPlan
  currentPlan?: PopulatedPlan | null
  requestedBy?: { name: string; email: string }
  resolvedAt?: string
  resolvedBy?: { name: string; email: string }
}

export default function PlanUpgradeRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [rejecting, setRejecting] = useState<RequestRow | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      const q = filter === 'all' ? '' : `?status=${filter}`
      const { data } = await api.get(`/admin/plan-upgrade-requests${q}`)
      setRows(data)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setRows([])
    load()
  }, [filter])

  const approve = async (r: RequestRow) => {
    if (
      !confirm(
        'Confirm payment received and approve this upgrade? The shop subscription will be updated immediately (manual step until payment gateway is integrated).'
      )
    ) {
      return
    }
    setBusyId(r._id)
    try {
      await api.patch(`/admin/plan-upgrade-requests/${r._id}/approve`, {})
      toast.success('Plan activated for shop')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Approve failed')
    } finally {
      setBusyId(null)
    }
  }

  const submitReject = async () => {
    if (!rejecting) return
    setBusyId(rejecting._id)
    try {
      await api.patch(`/admin/plan-upgrade-requests/${rejecting._id}/reject`, {
        adminNote: rejectNote,
      })
      toast.success('Request rejected')
      setRejecting(null)
      setRejectNote('')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Reject failed')
    } finally {
      setBusyId(null)
    }
  }

  if (loading && rows.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader
        title="Plan upgrade requests"
        description="Business owners submit upgrade requests after arranging payment offline. Verify payment, then approve to apply the plan, or reject with a note."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">No requests</div>
          ) : (
            rows.map((r) => (
              <div key={r._id} className="px-6 py-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          r.status === 'approved' ? 'active' : r.status === 'rejected' ? 'cancelled' : 'pending'
                        }
                      >
                        {r.status}
                      </Badge>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {format(new Date(r.createdAt), 'PPp')}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-[var(--text-primary)]">
                      {r.shop?.name ?? 'Shop'} · {r.shop?.email}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Requested:{' '}
                      <span className="text-[var(--text-primary)] font-medium">
                        {r.requestedPlan?.title ?? '?'} ({r.requestedPlan?.price} {r.requestedPlan?.currency})
                      </span>
                      {r.currentPlan && (
                        <>
                          {' '}
                          · from {r.currentPlan.title}
                        </>
                      )}
                    </p>
                    {r.requestedBy && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Requested by {r.requestedBy.name} ({r.requestedBy.email})
                      </p>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(r)} disabled={busyId === r._id}>
                        {busyId === r._id ? '…' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setRejecting(r)
                          setRejectNote('')
                        }}
                        disabled={busyId === r._id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                {(r.paymentReference || r.paymentNote) && (
                  <div className="rounded-lg bg-[var(--surface-2)] p-3 text-sm">
                    {r.paymentReference && (
                      <p>
                        <span className="text-[var(--text-secondary)]">Reference: </span>
                        {r.paymentReference}
                      </p>
                    )}
                    {r.paymentNote && (
                      <p className="mt-1 whitespace-pre-wrap">
                        <span className="text-[var(--text-secondary)]">Note: </span>
                        {r.paymentNote}
                      </p>
                    )}
                  </div>
                )}
                {r.status !== 'pending' && r.adminNote && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Admin note: <span className="text-[var(--text-primary)]">{r.adminNote}</span>
                  </p>
                )}
                {r.resolvedAt && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Resolved {format(new Date(r.resolvedAt), 'PPp')}
                    {r.resolvedBy && ` · ${r.resolvedBy.name}`}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {rejecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Reject request</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Optional note to store with this rejection (visible in history).
            </p>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm mb-4"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejecting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={submitReject} disabled={busyId === rejecting._id}>
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
