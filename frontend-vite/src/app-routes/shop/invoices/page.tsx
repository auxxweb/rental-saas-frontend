import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import api from '@/lib/api'
import { format } from 'date-fns'
import { useAppLocale } from '@/lib/useAppLocale'

type InvoiceRow = {
  _id: string
  invoiceNumber?: string
  status: string
  total: number
  currency?: string
  createdAt: string
  customer?: { name?: string; email?: string }
  job?: { jobNumber?: string } | string
}

export default function ShopInvoicesPage() {
  const { formatMoney } = useAppLocale()
  const [draft, setDraft] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const [applied, setApplied] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })

  const params = useMemo(() => {
    const p: Record<string, string> = {}
    if (applied.search.trim()) p.search = applied.search.trim()
    if (applied.status && applied.status !== 'all') p.status = applied.status
    if (applied.dateFrom) p.dateFrom = applied.dateFrom
    if (applied.dateTo) p.dateTo = applied.dateTo
    return p
  }, [applied])

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['shop-invoices', params],
    queryFn: async () => (await api.get<InvoiceRow[]>('/invoices', { params })).data,
  })

  const runSearch = useCallback(() => {
    setApplied({ ...draft })
  }, [draft])

  const statusLabel = (s: string) =>
    s === 'pending'
      ? 'Pending'
      : s === 'paid'
        ? 'Paid'
        : s === 'partial'
          ? 'Partial'
          : s === 'overdue'
            ? 'Overdue'
            : s

  const statusBadge = (s: string) => (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        s === 'paid'
          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
          : s === 'overdue'
            ? 'bg-[rgba(240,113,103,0.16)] text-[#F07167]'
            : s === 'partial'
              ? 'bg-[rgba(232,162,58,0.16)] text-[#E8A23A]'
              : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
      }`}
    >
      {statusLabel(s)}
    </span>
  )

  const tableData = useMemo(
    () =>
      invoices.map((inv) => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber || '—',
        jobNumber: typeof inv.job === 'object' && inv.job?.jobNumber ? inv.job.jobNumber : '—',
        customerName: inv.customer?.name || '—',
        total: inv.total,
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    [invoices]
  )

  type Row = (typeof tableData)[number]

  const columns = useMemo(
    () => [
      { key: 'invoiceNumber', label: 'Invoice' },
      { key: 'jobNumber', label: 'Job' },
      { key: 'customerName', label: 'Customer' },
      {
        key: 'total',
        label: 'Total',
        render: (_: unknown, row: Row) => (
          <span className="font-medium tabular-nums">{formatMoney(Number(row.total))}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (_: unknown, row: Row) => statusBadge(row.status),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (v: string) => (v ? format(new Date(v), 'MMM d, yyyy') : '—'),
      },
    ],
    [formatMoney]
  )

  return (
    <Layout>
      <PageHeader
        title="Invoices"
        description="Create invoices from rental jobs and track payment status."
      />

      <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-3 justify-stretch sm:justify-end">
        <Link to="/shop/invoices/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Create invoice</Button>
        </Link>
      </div>

      <Card padding="lg" className="mb-6 space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Search matches invoice number, customer name, email, phone, line item (product) name, or serial numbers on
          the job. Filters apply when you click Search.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <label className="text-sm sm:col-span-2 xl:col-span-2">
            <span className="text-[var(--text-secondary)]">Search</span>
            <input
              type="search"
              placeholder="Invoice #, name, email, phone, product, serial…"
              className="mt-1 w-full min-h-[44px] rounded-2xl border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-base sm:text-sm"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
            />
          </label>
          <label className="text-sm w-full">
            <span className="text-[var(--text-secondary)]">Status</span>
            <select
              className="mt-1 block w-full min-h-[44px] rounded-2xl border border-[var(--border)] px-3 py-2 text-base sm:text-sm"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label className="text-sm w-full">
            <span className="text-[var(--text-secondary)]">From</span>
            <input
              type="date"
              className="mt-1 block w-full min-h-[44px] rounded-2xl border border-[var(--border)] px-3 py-2 text-base sm:text-sm"
              value={draft.dateFrom}
              onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
            />
          </label>
          <label className="text-sm w-full">
            <span className="text-[var(--text-secondary)]">To</span>
            <input
              type="date"
              className="mt-1 block w-full min-h-[44px] rounded-2xl border border-[var(--border)] px-3 py-2 text-base sm:text-sm"
              value={draft.dateTo}
              onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
            />
          </label>
          <div className="w-full sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <Button type="button" onClick={runSearch} disabled={isLoading} className="w-full sm:w-auto min-w-[120px]">
              {isLoading ? 'Loading…' : 'Search'}
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card padding="lg" className="flex items-center justify-center min-h-[200px] text-[var(--text-secondary)]">
          Loading…
        </Card>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={tableData}
          emptyMessage="No invoices match your filters."
          actions={(row) => (
            <Link
              to={`/shop/invoices/${row._id}`}
              className="font-medium text-[var(--accent)] hover:brightness-95 inline-flex min-h-[44px] items-center"
            >
              View
            </Link>
          )}
        />
      )}
    </Layout>
  )
}
