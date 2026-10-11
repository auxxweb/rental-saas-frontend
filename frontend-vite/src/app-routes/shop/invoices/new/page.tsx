import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import { toast } from 'react-toastify'

type JobRow = {
  _id: string
  jobNumber?: string
  status?: string
  total?: number
  customer?: { name?: string }
}

type InvoiceRow = {
  _id: string
  job?: { _id?: string } | string
}

export default function NewInvoicePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [jobId, setJobId] = useState('')

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['shop-jobs-for-invoice'],
    queryFn: async () => (await api.get<JobRow[]>('/jobs')).data,
  })

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ['shop-invoices-all'],
    queryFn: async () => (await api.get<InvoiceRow[]>('/invoices')).data,
  })

  const invoicedJobIds = useMemo(() => {
    const s = new Set<string>()
    for (const inv of invoices) {
      const j = inv.job
      const id = typeof j === 'object' && j && '_id' in j && j._id ? String(j._id) : typeof j === 'string' ? j : ''
      if (id) s.add(id)
    }
    return s
  }, [invoices])

  const eligibleJobs = useMemo(
    () => jobs.filter((j) => j._id && !invoicedJobIds.has(String(j._id))),
    [jobs, invoicedJobIds]
  )

  const createInvoice = useMutation({
    mutationFn: (body: { jobId: string }) => api.post('/invoices', body),
    onSuccess: (res) => {
      toast.success('Invoice created')
      qc.invalidateQueries({ queryKey: ['shop-invoices'] })
      qc.invalidateQueries({ queryKey: ['shop-invoices-all'] })
      const id = res.data?._id
      if (id) navigate(`/shop/invoices/${id}`)
      else navigate('/shop/invoices')
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Could not create invoice'
      toast.error(msg || 'Could not create invoice')
    },
  })

  const loading = jobsLoading || invLoading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId) {
      toast.error('Select a job')
      return
    }
    createInvoice.mutate({ jobId })
  }

  return (
    <Layout>
      <PageHeader
        title="Create invoice"
        description="Invoices are generated from a rental job. Each job can only have one invoice."
      />

      <div className="mb-4">
        <Link to="/shop/invoices" className="text-sm font-medium text-[var(--accent)] hover:brightness-95">
          ← Back to invoices
        </Link>
      </div>

      <Card padding="lg" className="max-w-xl">
        {loading ? (
          <p className="text-[var(--text-secondary)]">Loading jobs…</p>
        ) : eligibleJobs.length === 0 ? (
          <div className="space-y-2 text-[var(--text-secondary)]">
            <p>No jobs are available for invoicing.</p>
            <p className="text-sm">Either every job already has an invoice, or you have no jobs yet.</p>
            <Link to="/shop/jobs/new" className="inline-block text-[var(--accent)] font-medium">
              Create a job
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Rental job</span>
              <select
                required
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              >
                <option value="">Select a job without an invoice…</option>
                {eligibleJobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.jobNumber || j._id.slice(-6)} — {j.customer?.name || 'Customer'} —{' '}
                    {j.status ? String(j.status) : '—'}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? 'Creating…' : 'Create invoice'}
            </Button>
          </form>
        )}
      </Card>
    </Layout>
  )
}
