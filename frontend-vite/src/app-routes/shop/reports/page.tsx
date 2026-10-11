import { useCallback, useEffect, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAppLocale } from '@/lib/useAppLocale'
import { formatMoneyForUi, formatPhoneForUi } from '@/lib/formatMoneyForUi'

type PeriodPreset = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

function getRangeForPreset(preset: PeriodPreset): { start: Date; end: Date } {
  const now = new Date()
  switch (preset) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'weekly':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'yearly':
      return { start: startOfYear(now), end: endOfYear(now) }
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

function pdfCell(v: unknown): string {
  if (v == null) return ''
  return String(v)
}

export default function ReportsPage() {
  const { formatMoney } = useAppLocale()
  const [activeTab, setActiveTab] = useState<'jobs' | 'payments'>('jobs')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('monthly')
  const [jobs, setJobs] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [jobsSummary, setJobsSummary] = useState({ totalJobs: 0, totalRevenue: 0 })
  const [paymentsSummary, setPaymentsSummary] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    totalPending: 0,
  })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: '',
    status: 'all',
  })

  const applyPresetToDates = useCallback((preset: PeriodPreset) => {
    if (preset === 'custom') return
    const { start, end } = getRangeForPreset(preset)
    setFilters((f) => ({
      ...f,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    }))
  }, [])

  useEffect(() => {
    applyPresetToDates('monthly')
  }, [applyPresetToDates])

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const buildParamsFrom = useCallback((f: typeof filters) => {
    const params = new URLSearchParams()
    if (f.startDate) params.append('startDate', f.startDate)
    if (f.endDate) params.append('endDate', f.endDate)
    if (f.search.trim()) params.append('search', f.search.trim())
    if (f.status && f.status !== 'all') params.append('status', f.status)
    return params
  }, [])

  const fetchJobsWithFilters = useCallback(
    async (f: typeof filters) => {
      setLoading(true)
      try {
        const response = await api.get(`/reports/jobs?${buildParamsFrom(f).toString()}`)
        setJobs(response.data.jobs || [])
        const s = response.data.summary
        if (s) {
          setJobsSummary({
            totalJobs: s.totalJobs ?? 0,
            totalRevenue: s.totalRevenue ?? 0,
          })
        }
      } catch {
        toast.error('Error fetching jobs report')
      } finally {
        setLoading(false)
      }
    },
    [buildParamsFrom]
  )

  const fetchPaymentsWithFilters = useCallback(
    async (f: typeof filters) => {
      setLoading(true)
      try {
        const response = await api.get(`/reports/payments?${buildParamsFrom(f).toString()}`)
        setPayments(response.data.invoices || [])
        const s = response.data.summary
        if (s) {
          setPaymentsSummary({
            totalInvoices: s.totalInvoices ?? 0,
            totalPaid: s.totalPaid ?? 0,
            totalPending: s.totalPending ?? 0,
          })
        }
      } catch {
        toast.error('Error fetching sales report')
      } finally {
        setLoading(false)
      }
    },
    [buildParamsFrom]
  )

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return
    const f = filtersRef.current
    if (activeTab === 'jobs') void fetchJobsWithFilters(f)
    else void fetchPaymentsWithFilters(f)
  }, [activeTab, filters.startDate, filters.endDate, fetchJobsWithFilters, fetchPaymentsWithFilters])

  const handleTabChange = (tab: 'jobs' | 'payments') => {
    setActiveTab(tab)
  }

  const handlePresetClick = (preset: PeriodPreset) => {
    setPeriodPreset(preset)
    if (preset === 'custom') {
      setFilters((f) => {
        if (f.startDate && f.endDate) return f
        const { start, end } = getRangeForPreset('monthly')
        return {
          ...f,
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
        }
      })
      return
    }
    applyPresetToDates(preset)
  }

  const applyFilters = () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Choose a start and end date (or pick a period preset)')
      return
    }
    if (activeTab === 'jobs') void fetchJobsWithFilters(filters)
    else void fetchPaymentsWithFilters(filters)
  }

  const downloadCurrentReport = () => {
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const rangeLabel =
      filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : '—'

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const margin = 14
    let y = margin

    const headerBlock = (title: string, summaryLine: string) => {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Period: ${rangeLabel}`, margin, y)
      y += 5
      doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, margin, y)
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.text(summaryLine, margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
    }

    if (activeTab === 'jobs') {
      headerBlock(
        'Jobs report',
        `Jobs: ${jobsSummary.totalJobs}    Total revenue: ${formatMoneyForUi(Number(jobsSummary.totalRevenue))}`
      )
      const body = jobs.map((j) => [
        pdfCell(j.jobNumber),
        pdfCell(j.customer?.name),
        pdfCell(j.customer?.email),
        pdfCell(j.customer?.phone ? formatPhoneForUi(String(j.customer.phone)) : ''),
        pdfCell(j.status),
        pdfCell(formatMoneyForUi(Number(j.total ?? 0))),
        j.createdAt ? format(new Date(j.createdAt), 'yyyy-MM-dd HH:mm') : '',
      ])
      autoTable(doc, {
        startY: y + 4,
        head: [['Job number', 'Customer', 'Email', 'Phone', 'Status', 'Total', 'Created']],
        body,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 8, cellPadding: 2 },
      })
      doc.save(`jobs-report-${stamp}.pdf`)
      toast.success('PDF downloaded')
      return
    }

    headerBlock(
      'Sales report',
      `Invoices: ${paymentsSummary.totalInvoices}    Paid: ${formatMoneyForUi(Number(paymentsSummary.totalPaid))}    Pending: ${formatMoneyForUi(Number(paymentsSummary.totalPending))}`
    )
    const body = payments.map((inv) => [
      pdfCell(inv.invoiceNumber),
      pdfCell(inv.customer?.name),
      pdfCell(inv.customer?.email),
      pdfCell(inv.customer?.phone ? formatPhoneForUi(String(inv.customer.phone)) : ''),
      pdfCell(inv.status),
      pdfCell(formatMoneyForUi(Number(inv.total ?? 0))),
      pdfCell(
        typeof inv.job === 'object' && inv.job?.jobNumber ? inv.job.jobNumber : String(inv.job ?? '')
      ),
      inv.createdAt ? format(new Date(inv.createdAt), 'yyyy-MM-dd HH:mm') : '',
    ])
    autoTable(doc, {
      startY: y + 4,
      head: [['Invoice #', 'Customer', 'Email', 'Phone', 'Status', 'Total', 'Job', 'Created']],
      body,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      styles: { fontSize: 8, cellPadding: 2 },
    })
    doc.save(`sales-report-${stamp}.pdf`)
    toast.success('PDF downloaded')
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-7xl mx-auto">
        <PageHeader
          title="Reports"
          description="Job activity and sales (invoices) for your shop. Pick a period or custom range, then apply filters. Download a PDF anytime."
        />

        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-[var(--border)]">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                type="button"
                onClick={() => handleTabChange('jobs')}
                className={`py-4 px-6 text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'jobs'
                    ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Jobs
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('payments')}
                className={`py-4 px-6 text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sales
              </button>
            </nav>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Period</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['daily', 'Daily'],
                    ['weekly', 'Weekly'],
                    ['monthly', 'Monthly'],
                    ['yearly', 'Yearly'],
                    ['custom', 'Custom range'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetClick(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      periodPreset === key
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Daily = today · Weekly = Mon–Sun · Monthly = this month · Yearly = this calendar year. Choose Custom
                range to set start and end dates.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 gap-4 ${
                periodPreset === 'custom' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {periodPreset === 'custom' && (
                <>
                  <Input
                    label="Start date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => {
                      setPeriodPreset('custom')
                      setFilters({ ...filters, startDate: e.target.value })
                    }}
                  />
                  <Input
                    label="End date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                      setPeriodPreset('custom')
                      setFilters({ ...filters, endDate: e.target.value })
                    }}
                  />
                </>
              )}
              <Input
                label="Search"
                type="search"
                placeholder={
                  activeTab === 'payments' ? 'Invoice #, customer name or email…' : 'Job #, customer…'
                }
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              {(activeTab === 'jobs' || activeTab === 'payments') && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="block w-full h-11 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    <option value="all">All</option>
                    {activeTab === 'jobs' ? (
                      <>
                        <option value="active">Active</option>
                        <option value="ready_to_return">Ready to return</option>
                        <option value="closed">Closed</option>
                        <option value="returned">Returned</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </>
                    ) : (
                      <>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="overdue">Overdue</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <Button type="button" variant="outline" onClick={downloadCurrentReport} disabled={loading}>
                Download PDF
              </Button>
              <Button type="button" onClick={applyFilters} disabled={loading}>
                {loading ? 'Loading…' : 'Apply filters'}
              </Button>
            </div>

            {!loading && activeTab === 'jobs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard title="Jobs in period" value={jobsSummary.totalJobs} />
                <StatCard title="Total revenue (job totals)" value={formatMoney(Number(jobsSummary.totalRevenue))} />
              </div>
            )}

            {!loading && activeTab === 'payments' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Invoices" value={paymentsSummary.totalInvoices} />
                <StatCard title="Paid total" value={formatMoney(Number(paymentsSummary.totalPaid))} />
                <StatCard title="Pending total" value={formatMoney(Number(paymentsSummary.totalPending))} />
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
              </div>
            ) : (
              <div>
                {activeTab === 'jobs' && (
                  <ResponsiveTable
                    columns={[
                      { key: 'jobNumber', label: 'Job number' },
                      { key: 'customer', label: 'Customer', render: (v) => v?.name || '—' },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (v) => (
                          <Badge
                            variant={
                              v === 'active'
                                ? 'active'
                                : v === 'returned' || v === 'closed'
                                  ? 'returned'
                                  : v === 'overdue'
                                    ? 'overdue'
                                    : v === 'cancelled'
                                      ? 'cancelled'
                                      : 'default'
                            }
                          >
                            {String(v || '—')}
                          </Badge>
                        ),
                      },
                      { key: 'total', label: 'Total', render: (v) => formatMoney(Number(v || 0)) },
                      {
                        key: 'createdAt',
                        label: 'Created',
                        render: (v) => (v ? format(new Date(v), 'MMM dd, yyyy') : '—'),
                      },
                    ]}
                    data={jobs}
                    emptyMessage="No jobs for the selected filters"
                  />
                )}

                {activeTab === 'payments' && (
                  <ResponsiveTable
                    columns={[
                      { key: 'invoiceNumber', label: 'Invoice #' },
                      { key: 'customer', label: 'Customer', render: (v) => v?.name || '—' },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (v) => (
                          <Badge variant={v === 'paid' ? 'active' : v === 'pending' ? 'pending' : 'overdue'}>
                            {String(v || '—')}
                          </Badge>
                        ),
                      },
                      { key: 'total', label: 'Total', render: (v) => formatMoney(Number(v || 0)) },
                      {
                        key: 'job',
                        label: 'Job',
                        render: (v) =>
                          typeof v === 'object' && v?.jobNumber ? v.jobNumber : v ? String(v) : '—',
                      },
                      {
                        key: 'createdAt',
                        label: 'Created',
                        render: (v) => (v ? format(new Date(v), 'MMM dd, yyyy') : '—'),
                      },
                    ]}
                    data={payments}
                    emptyMessage="No invoices for the selected filters"
                  />
                )}

              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
