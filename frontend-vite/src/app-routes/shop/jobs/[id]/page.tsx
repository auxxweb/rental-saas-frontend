import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAppLocale } from '@/lib/useAppLocale'
import { formatMoneyForUi, formatPhoneForUi } from '@/lib/formatMoneyForUi'

function toDatetimeLocalValue(iso: string | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** API may send categoryId as an id string or populated { _id, name } */
function normalizeProductCategoryId(categoryId: unknown): string {
  if (categoryId == null || categoryId === '') return ''
  if (typeof categoryId === 'string') return categoryId
  if (typeof categoryId === 'object' && categoryId !== null && '_id' in categoryId) {
    return String((categoryId as { _id: string })._id)
  }
  return String(categoryId)
}

interface Product {
  _id: string
  name: string
  stock: number
  availableCount?: number
  categoryId?: string | { _id: string; name?: string } | null
  category?: string
  pricing: {
    hourly: number
    daily: number
    monthly: number
    yearly: number
  }
}

interface Category {
  _id: string
  name: string
}

type JobItemRow = {
  _id?: string
  product?: { name?: string }
  productItem?: { serialNumber?: string }
  quantity?: number
  pricingMode?: string
  rate?: number
  duration?: { value: number; unit: string }
  subtotal?: number | null
  jobItemStatus?: string
  rentedAt?: string
  returnedAt?: string
  serialNumber?: string
  returnNote?: string
  returnTiming?: 'early' | 'on_time' | 'late' | null
}

export default function JobDetailPage() {
  const { formatMoney, withDial } = useAppLocale()
  const params = useParams()
  const jobId = params.id as string
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [addForm, setAddForm] = useState({
    categoryFilter: '',
    productId: '',
    productItemId: '',
    rentalType: 'daily' as string,
    units: [] as { _id: string; serialNumber: string; status: string }[],
    serialFilter: '',
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [returnModalItemId, setReturnModalItemId] = useState<string | null>(null)
  const [returnNoteDraft, setReturnNoteDraft] = useState('')
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false)
  const [finalizePaymentType, setFinalizePaymentType] = useState<'cash' | 'online'>('cash')
  const [scheduleDraft, setScheduleDraft] = useState({ startDate: '', expectedReturnDate: '' })

  const fetchJob = useCallback(async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`)
      setJob(response.data)
    } catch {
      toast.error('Error fetching job')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  const fetchInvoice = useCallback(async () => {
    try {
      const response = await api.get('/invoices')
      const list = Array.isArray(response.data) ? response.data : []
      const jobInvoice = list.find((inv: any) => inv.job && (inv.job._id === jobId || inv.job === jobId))
      if (jobInvoice) {
        const fullInvoice = await api.get(`/invoices/${jobInvoice._id}`)
        setInvoice(fullInvoice.data)
      } else {
        setInvoice(null)
      }
    } catch {
      setInvoice(null)
    }
  }, [jobId])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/shop-categories')
      setCategories(Array.isArray(response.data) ? response.data : [])
    } catch {
      toast.error('Error fetching categories')
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const params: Record<string, string> = { includeAvailability: 'true' }
      const response = await api.get('/products', { params })
      const raw = response.data
      const list: Product[] = Array.isArray(raw) ? raw : (raw as { items?: Product[] })?.items || []
      setProducts(
        list.filter((p: Product) => (p.availableCount != null ? p.availableCount > 0 : p.stock > 0))
      )
    } catch {
      toast.error('Error fetching products')
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [fetchCategories, fetchProducts])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  useEffect(() => {
    if (!job?.startDate || !job?.expectedReturnDate) return
    setScheduleDraft({
      startDate: toDatetimeLocalValue(job.startDate),
      expectedReturnDate: toDatetimeLocalValue(job.expectedReturnDate),
    })
  }, [job?.startDate, job?.expectedReturnDate])

  const getProductsForLine = useMemo(() => {
    return (categoryId: string) => {
      if (!categoryId) return products
      const want = String(categoryId)
      const byId = products.filter((p) => normalizeProductCategoryId(p.categoryId) === want)
      if (byId.length > 0) return byId
      const cat = categories.find((c) => c._id === categoryId)
      const name = cat?.name?.trim().toLowerCase()
      if (!name) return []
      return products.filter((p) => p.category && String(p.category).trim().toLowerCase() === name)
    }
  }, [products, categories])

  const filteredUnitsForAdd = () => {
    const f = addForm.serialFilter.trim().toLowerCase()
    if (!f) return addForm.units
    return addForm.units.filter((u) => u.serialNumber.toLowerCase().includes(f))
  }

  useEffect(() => {
    if (!job) return
    const fid = job.finalInvoiceId
    if (fid) {
      api
        .get(`/invoices/${fid}`)
        .then((r) => setInvoice(r.data))
        .catch(() => fetchInvoice())
    } else {
      setInvoice(null)
      fetchInvoice()
    }
  }, [job, fetchInvoice])

  const loadUnitsForAdd = async (productId: string) => {
    if (!productId) return
    try {
      const res = await api.get(`/products/${productId}/units`, {
        params: { forBooking: '1' },
      })
      setAddForm((f) => ({ ...f, units: res.data.units || [], productItemId: '' }))
    } catch {
      toast.error('Could not load serials')
    }
  }

  const submitMarkReturn = async () => {
    if (!returnModalItemId) return
    setActionLoading(true)
    try {
      await api.post(`/jobs/${jobId}/items/${returnModalItemId}/return`, {
        outcome: 'good',
        returnNote: returnNoteDraft.trim(),
      })
      toast.success('Item marked returned')
      setReturnModalItemId(null)
      setReturnNoteDraft('')
      await fetchJob()
      await fetchInvoice()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Return failed')
    } finally {
      setActionLoading(false)
    }
  }

  const submitFinalizeJob = async () => {
    setActionLoading(true)
    try {
      await api.post(`/jobs/${jobId}/finalize-invoice`, { paymentType: finalizePaymentType })
      toast.success('Job completed and payment recorded')
      setFinalizeModalOpen(false)
      await fetchJob()
      await fetchInvoice()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not complete job')
    } finally {
      setActionLoading(false)
    }
  }

  const addProductLine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleDraft.startDate || !scheduleDraft.expectedReturnDate) {
      toast.error('Start and estimated return date and time are required')
      return
    }
    if (new Date(scheduleDraft.startDate) >= new Date(scheduleDraft.expectedReturnDate)) {
      toast.error('Estimated return must be after start')
      return
    }
    if (!addForm.productId) {
      toast.error('Select a product')
      return
    }
    if (addForm.units.length > 0 && !addForm.productItemId) {
      toast.error('Select a serial')
      return
    }
    setActionLoading(true)
    try {
      await api.put(`/jobs/${jobId}`, {
        startDate: new Date(scheduleDraft.startDate).toISOString(),
        expectedReturnDate: new Date(scheduleDraft.expectedReturnDate).toISOString(),
      })
      await api.post(`/jobs/${jobId}/items`, {
        product: addForm.productId,
        productItemId: addForm.productItemId || undefined,
        rentalType: addForm.rentalType,
        quantity: addForm.units.length === 0 ? 1 : undefined,
      })
      toast.success('Product added')
      setAddForm({
        categoryFilter: '',
        productId: '',
        productItemId: '',
        rentalType: 'daily',
        units: [],
        serialFilter: '',
      })
      await fetchJob()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Add failed')
    } finally {
      setActionLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!invoice) {
      toast.error('Invoice not available')
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('INVOICE', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 35)
    doc.text(`Date: ${format(new Date(invoice.createdAt), 'MMM dd, yyyy')}`, 20, 42)

    doc.setFontSize(14)
    doc.text('Bill To:', 20, 55)
    doc.setFontSize(10)
    doc.text(invoice.customer.name, 20, 62)
    if (invoice.customer.phone) {
      doc.text(`Phone: ${formatPhoneForUi(String(invoice.customer.phone))}`, 20, 69)
    }
    if (invoice.customer.email) {
      doc.text(`Email: ${invoice.customer.email}`, 20, 76)
    }

    const tableData = invoice.items.map((item: any) => [
      item.name,
      String(item.quantity ?? ''),
      item.pricingMode,
      formatMoneyForUi(Number(item.rate)),
      `${item.duration?.value ?? ''} ${item.duration?.unit ?? ''}`,
      formatMoneyForUi(Number(item.subtotal)),
    ])

    autoTable(doc, {
      startY: 85,
      head: [['Product', 'Qty', 'Mode', 'Rate', 'Duration', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
    })

    const finalY = (doc.lastAutoTable?.finalY ?? 85) + 10
    doc.setFontSize(10)
    doc.text(`Subtotal: ${formatMoneyForUi(Number(invoice.subtotal))}`, 150, finalY, { align: 'right' })
    doc.text(`Tax: ${formatMoneyForUi(Number(invoice.tax))}`, 150, finalY + 7, { align: 'right' })
    if (invoice.advanceDeduction > 0) {
      doc.text(`Advance: -${formatMoneyForUi(Number(invoice.advanceDeduction))}`, 150, finalY + 14, { align: 'right' })
    }
    if (invoice.extraCharges > 0) {
      doc.text(`Extra Charges: ${formatMoneyForUi(Number(invoice.extraCharges))}`, 150, finalY + 21, { align: 'right' })
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const pay = invoice.payableAmount != null ? invoice.payableAmount : invoice.total
    doc.text(`Payable: ${formatMoneyForUi(Number(pay))}`, 150, finalY + 28, { align: 'right' })

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
    toast.success('PDF downloaded successfully')
  }

  const markPayment = async (paymentType: 'cash' | 'online') => {
    if (!invoice) return
    try {
      await api.put(`/invoices/${invoice._id}`, {
        status: 'paid',
        paymentType,
        paymentDate: new Date().toISOString(),
      })
      toast.success('Payment recorded')
      const full = await api.get(`/invoices/${invoice._id}`)
      setInvoice(full.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  if (!job) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <p className="text-[var(--text-secondary)]">Job not found</p>
        </div>
      </Layout>
    )
  }

  const isV2 = Number(job.workflowVersion) === 2
  const rows: JobItemRow[] = Array.isArray(job.items) ? job.items : []
  const canAct = isV2 && !['closed', 'cancelled', 'returned'].includes(job.status)
  const allLinesReturned =
    (job.allItemsReturned as boolean | undefined) ??
    (rows.length > 0 && rows.every((r) => r.jobItemStatus === 'returned'))
  const jobClosed = ['closed', 'returned'].includes(job.status)
  const canAddProduct =
    isV2 &&
    ['active', 'overdue'].includes(job.status) &&
    !['closed', 'cancelled', 'returned'].includes(job.status) &&
    !allLinesReturned
  const showAwaitingPayment =
    isV2 && allLinesReturned && !jobClosed && (!invoice || invoice.status !== 'paid')

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Job: {job.jobNumber}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Start: {format(new Date(job.startDate), 'MMM dd, yyyy HH:mm')}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              Expected return (required): {format(new Date(job.expectedReturnDate), 'MMM dd, yyyy HH:mm')}
            </p>
            {job.isOverdue && ['active', 'overdue'].includes(job.status) && (
              <p className="mt-1 text-sm text-amber-600 font-medium">Overdue — past expected return</p>
            )}
            {job.jobReturnTiming === 'early' && ['ready_to_return', 'closed'].includes(job.status) && (
              <p className="mt-1 text-sm text-emerald-600 font-medium">Early return — all items back before expected return</p>
            )}
            {job.jobReturnTiming === 'late' && ['ready_to_return', 'closed'].includes(job.status) && (
              <p className="mt-1 text-sm text-rose-600 font-medium">Late return — return after expected return time</p>
            )}
            {(job.createdByUserId?.name || job.createdByUserName) && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Created by:{' '}
                <span className="text-[var(--text-primary)] font-medium">
                  {typeof job.createdByUserId === 'object' && job.createdByUserId?.name
                    ? job.createdByUserId.name
                    : job.createdByUserName}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {showAwaitingPayment && (
              <Button
                type="button"
                size="md"
                onClick={() => setFinalizeModalOpen(true)}
                disabled={actionLoading}
                className="bg-[var(--accent)] text-[var(--accent-ink)]"
              >
                Complete job &amp; record payment
              </Button>
            )}
            {!isV2 && !invoice && (
              <Button
                onClick={async () => {
                  try {
                    const response = await api.post('/invoices', { jobId })
                    setInvoice(response.data)
                    toast.success('Invoice created successfully')
                    await fetchJob()
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Error creating invoice')
                  }
                }}
                size="md"
              >
                Create invoice
              </Button>
            )}
            {invoice && (
              <>
                <Link
                  to={`/shop/invoices/${invoice._id}`}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                >
                  View invoice
                </Link>
                <Button onClick={downloadPDF} variant="secondary" size="md" className="inline-flex items-center gap-2">
                  Download PDF
                </Button>
                {!isV2 && invoice.status !== 'paid' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => markPayment('cash')}>
                      Pay cash
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => markPayment('online')}>
                      Pay online
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Job details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Status</p>
              <p className="font-medium text-[var(--text-primary)]">{job.status}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Expected return *</p>
              <p className="font-medium text-[var(--text-primary)]">
                {format(new Date(job.expectedReturnDate), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Customer</p>
              <p className="font-medium text-[var(--text-primary)]">{job.customer?.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {job.customer?.phone ? withDial(String(job.customer.phone)) : '—'}
              </p>
            </div>
            {isV2 && (
              <>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Advance</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    {job.advanceEnabled ? formatMoney(Number(job.advanceAmount || 0)) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Buffer (min)</p>
                  <p className="font-medium text-[var(--text-primary)]">{job.bufferTime ?? 0}</p>
                </div>
              </>
            )}
            {job.actualReturnDate && (
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Actual return</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {format(new Date(job.actualReturnDate), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Items</h2>
          <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="bg-[var(--surface-2)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Product</th>
                  {isV2 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Serial</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Rate</th>
                  {isV2 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Rented / Returned</th>
                  )}
                  {isV2 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Return note</th>
                  )}
                  {isV2 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Timing</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Line total</th>
                  {isV2 && canAct && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((item: JobItemRow, index: number) => (
                  <tr key={item._id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {item.product?.name}
                    </td>
                    {isV2 && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                        {item.serialNumber || item.productItem?.serialNumber || '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.pricingMode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {formatMoney(Number(item.rate || 0))}
                    </td>
                    {isV2 && (
                      <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                        {item.rentedAt ? format(new Date(item.rentedAt), 'MMM dd HH:mm') : '—'}
                        {' → '}
                        {item.returnedAt ? format(new Date(item.returnedAt), 'MMM dd HH:mm') : '—'}
                      </td>
                    )}
                    {isV2 && (
                      <td className="px-6 py-4 text-sm text-[var(--text-primary)] max-w-[200px]">
                        {item.returnNote ? (
                          <span className="whitespace-pre-wrap break-words">{item.returnNote}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    {isV2 && (
                      <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                        {item.jobItemStatus === 'returned' && item.returnTiming === 'early' && (
                          <span className="text-emerald-600 font-medium">Early</span>
                        )}
                        {item.jobItemStatus === 'returned' && item.returnTiming === 'late' && (
                          <span className="text-rose-600 font-medium">Late</span>
                        )}
                        {item.jobItemStatus === 'returned' && item.returnTiming === 'on_time' && (
                          <span className="text-[var(--text-secondary)]">On time</span>
                        )}
                        {item.jobItemStatus !== 'returned' && '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {item.subtotal != null ? formatMoney(Number(item.subtotal)) : '—'}
                    </td>
                    {isV2 && canAct && (
                      <td className="px-6 py-4">
                        {item.jobItemStatus === 'active' && item._id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading}
                            onClick={() => {
                              setReturnNoteDraft('')
                              setReturnModalItemId(item._id!)
                            }}
                          >
                            Mark return
                          </Button>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">Returned</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {isV2 && canAddProduct && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Add product</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Rental window for this job (used for serial availability). Adjust here before adding a line if the
              schedule changed.
            </p>
            <form onSubmit={addProductLine} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Start *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDraft.startDate}
                    onChange={(e) => setScheduleDraft((s) => ({ ...s, startDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Estimated return *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDraft.expectedReturnDate}
                    onChange={(e) => setScheduleDraft((s) => ({ ...s, expectedReturnDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Category</label>
                  <select
                    value={addForm.categoryFilter}
                    onChange={(e) => {
                      const v = e.target.value
                      setAddForm((f) => ({
                        ...f,
                        categoryFilter: v,
                        productId: '',
                        productItemId: '',
                        units: [],
                        serialFilter: '',
                      }))
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    <option value="">All</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Product *</label>
                  <select
                    required
                    value={addForm.productId}
                    onChange={(e) => {
                      const v = e.target.value
                      setAddForm((f) => ({
                        ...f,
                        productId: v,
                        productItemId: '',
                        units: [],
                        serialFilter: '',
                      }))
                      if (v) void loadUnitsForAdd(v)
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    <option value="">Select</option>
                    {(addForm.categoryFilter ? getProductsForLine(addForm.categoryFilter) : products).map(
                      (product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Rental type</label>
                  <select
                    value={addForm.rentalType}
                    onChange={(e) => setAddForm((f) => ({ ...f, rentalType: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Serial (search)</label>
                  <input
                    type="text"
                    placeholder="Filter serials..."
                    value={addForm.serialFilter}
                    onChange={(e) => setAddForm((f) => ({ ...f, serialFilter: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] mb-2"
                  />
                  <select
                    value={addForm.productItemId}
                    onChange={(e) => setAddForm((f) => ({ ...f, productItemId: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    <option value="">
                      {addForm.units.length === 0 && addForm.productId ? 'Loading…' : 'Select serial'}
                    </option>
                    {filteredUnitsForAdd().map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.serialNumber} ({u.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  Pick a category to narrow products. Serial-tracked items require a serial; only active serials are
                  listed.
                </p>
                <Button type="submit" disabled={actionLoading || !addForm.productId}>
                  Add to job
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card>
          <div className="flex justify-end">
            <div className="text-right space-y-2">
              {isV2 ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {jobClosed
                      ? 'Job is closed. Invoice reflects final charges.'
                      : 'Use Mark return with a note for each line, then Complete job & record payment when all items are back.'}
                  </p>
                  {invoice && (
                    <>
                      <div className="flex justify-between w-72">
                        <span className="text-[var(--text-secondary)]">Subtotal:</span>
                        <span className="font-medium text-[var(--text-primary)]">{formatMoney(Number(invoice.subtotal))}</span>
                      </div>
                      <div className="flex justify-between w-72">
                        <span className="text-[var(--text-secondary)]">Tax:</span>
                        <span className="font-medium text-[var(--text-primary)]">{formatMoney(Number(invoice.tax))}</span>
                      </div>
                      {invoice.advanceDeduction > 0 && (
                        <div className="flex justify-between w-72">
                          <span className="text-[var(--text-secondary)]">Advance:</span>
                          <span className="font-medium text-[var(--text-primary)]">
                            -{formatMoney(Number(invoice.advanceDeduction))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between w-72 border-t border-[var(--border)] pt-2">
                        <span className="font-bold text-lg text-[var(--text-primary)]">Payable:</span>
                        <span className="font-bold text-lg text-[var(--text-primary)]">
                          {formatMoney(Number(invoice.payableAmount != null ? invoice.payableAmount : invoice.total))}
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between w-64">
                    <span className="text-[var(--text-secondary)]">Subtotal:</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatMoney(Number(job.subtotal || 0))}</span>
                  </div>
                  <div className="flex justify-between w-64">
                    <span className="text-[var(--text-secondary)]">Tax:</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatMoney(Number(job.tax || 0))}</span>
                  </div>
                  {job.extraCharges > 0 && (
                    <div className="flex justify-between w-64">
                      <span className="text-[var(--text-secondary)]">Extra charges:</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatMoney(Number(job.extraCharges))}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-64 border-t border-[var(--border)] pt-2">
                    <span className="font-bold text-lg text-[var(--text-primary)]">Total:</span>
                    <span className="font-bold text-lg text-[var(--text-primary)]">{formatMoney(Number(job.total || 0))}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {returnModalItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Mark return</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Add a note about condition, missing accessories, damage, or other issues (optional but recommended).
              </p>
              <textarea
                value={returnNoteDraft}
                onChange={(e) => setReturnNoteDraft(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-sm mb-4"
                placeholder="Return note…"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReturnModalItemId(null)
                    setReturnNoteDraft('')
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => void submitMarkReturn()} disabled={actionLoading}>
                  Confirm return
                </Button>
              </div>
            </div>
          </div>
        )}

        {finalizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Complete job</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Creates the final invoice (if needed), records payment, and closes this job.
              </p>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Payment type</p>
              <div className="flex gap-4 mb-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pay"
                    checked={finalizePaymentType === 'cash'}
                    onChange={() => setFinalizePaymentType('cash')}
                  />
                  <span className="text-sm">Cash</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pay"
                    checked={finalizePaymentType === 'online'}
                    onChange={() => setFinalizePaymentType('online')}
                  />
                  <span className="text-sm">Online</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFinalizeModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void submitFinalizeJob()} disabled={actionLoading}>
                  Save invoice &amp; close job
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
