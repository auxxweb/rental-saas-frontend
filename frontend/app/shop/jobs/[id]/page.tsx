'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    fetchJob()
    fetchInvoice()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`)
      setJob(response.data)
    } catch (error) {
      toast.error('Error fetching job')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoice = async () => {
    try {
      const response = await api.get('/invoices')
      const jobInvoice = response.data.find((inv: any) => inv.job._id === jobId)
      if (jobInvoice) {
        // Fetch full invoice details
        const fullInvoice = await api.get(`/invoices/${jobInvoice._id}`)
        setInvoice(fullInvoice.data)
      }
    } catch (error) {
      // Invoice might not exist yet
    }
  }

  const createInvoice = async () => {
    try {
      const response = await api.post('/invoices', { jobId })
      setInvoice(response.data)
      toast.success('Invoice created successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating invoice')
    }
  }

  const downloadPDF = () => {
    if (!invoice) {
      toast.error('Invoice not available')
      return
    }

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('INVOICE', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 35)
    doc.text(`Date: ${format(new Date(invoice.createdAt), 'MMM dd, yyyy')}`, 20, 42)
    
    // Customer Info
    doc.setFontSize(14)
    doc.text('Bill To:', 20, 55)
    doc.setFontSize(10)
    doc.text(invoice.customer.name, 20, 62)
    if (invoice.customer.phone) {
      doc.text(`Phone: ${invoice.customer.phone}`, 20, 69)
    }
    if (invoice.customer.email) {
      doc.text(`Email: ${invoice.customer.email}`, 20, 76)
    }

    // Items Table
    const tableData = invoice.items.map((item: any) => [
      item.name,
      item.quantity.toString(),
      item.pricingMode,
      `$${item.rate.toFixed(2)}`,
      `${item.duration.value} ${item.duration.unit}`,
      `$${item.subtotal.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 85,
      head: [['Product', 'Qty', 'Mode', 'Rate', 'Duration', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] }
    })

    // Totals
    const finalY = (doc.lastAutoTable?.finalY ?? 85) + 10
    doc.setFontSize(10)
    doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 150, finalY, { align: 'right' })
    doc.text(`Tax: $${invoice.tax.toFixed(2)}`, 150, finalY + 7, { align: 'right' })
    if (invoice.extraCharges > 0) {
      doc.text(`Extra Charges: $${invoice.extraCharges.toFixed(2)}`, 150, finalY + 14, { align: 'right' })
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: $${invoice.total.toFixed(2)}`, 150, finalY + 21, { align: 'right' })

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
    toast.success('PDF downloaded successfully')
  }

  const shareOnWhatsApp = () => {
    if (!invoice || !job) {
      toast.error('Invoice not available')
      return
    }

    // Get customer phone number (remove any non-digit characters except +)
    let phone = (job.customer.phone || invoice.customer.phone || '').replace(/[^\d+]/g, '')
    
    // Remove leading + if present and ensure it's just digits
    phone = phone.replace(/^\+/, '')
    
    // If phone doesn't start with country code, assume it's a local number
    // You may need to adjust this based on your country code
    if (!phone) {
      toast.error('Customer phone number not available')
      return
    }

    // Create invoice summary message
    const message = `*Invoice ${invoice.invoiceNumber}*\n\n` +
      `*Customer:* ${invoice.customer.name}\n` +
      `*Date:* ${format(new Date(invoice.createdAt), 'MMM dd, yyyy')}\n` +
      `*Job Number:* ${job.jobNumber}\n\n` +
      `*Items:*\n` +
      invoice.items.map((item: any) => 
        `• ${item.name} (Qty: ${item.quantity}, ${item.pricingMode}, ${item.duration.value} ${item.duration.unit}) - $${item.subtotal.toFixed(2)}`
      ).join('\n') +
      `\n\n*Subtotal:* $${invoice.subtotal.toFixed(2)}\n` +
      `*Tax:* $${invoice.tax.toFixed(2)}\n` +
      (invoice.extraCharges > 0 ? `*Extra Charges:* $${invoice.extraCharges.toFixed(2)}\n` : '') +
      `*Total:* $${invoice.total.toFixed(2)}\n\n` +
      `Thank you for your business!`

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // Open WhatsApp Web/App with pre-filled message
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
    toast.success('Opening WhatsApp...')
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

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Job: {job.jobNumber}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {format(new Date(job.startDate), 'MMM dd, yyyy HH:mm')} → {format(new Date(job.expectedReturnDate), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!invoice && (
              <Button onClick={createInvoice} size="md">
                Create Invoice
              </Button>
            )}
            {invoice && (
              <>
                <Link
                  href={`/shop/invoices/${invoice._id}`}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Invoice
                </Link>
                <Button onClick={downloadPDF} variant="secondary" size="md" className="inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </Button>
                <Button onClick={shareOnWhatsApp} variant="primary" size="md" className="inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Share on WhatsApp
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Job Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Status</p>
              <p className={`font-medium ${
                job.status === 'active' ? 'text-green-600' :
                job.status === 'returned' ? 'text-blue-600' :
                'text-red-600'
              }`}>
                {job.status.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Customer</p>
              <p className="font-medium text-[var(--text-primary)]">{job.customer.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{job.customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Start Date</p>
              <p className="font-medium text-[var(--text-primary)]">{format(new Date(job.startDate), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Expected Return</p>
              <p className="font-medium text-[var(--text-primary)]">{format(new Date(job.expectedReturnDate), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            {job.actualReturnDate && (
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Actual Return</p>
                <p className="font-medium text-[var(--text-primary)]">{format(new Date(job.actualReturnDate), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="bg-[var(--surface-2)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Pricing Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {job.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.pricingMode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">${item.rate.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.duration.value} {item.duration.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        <Card>
          <div className="flex justify-end">
            <div className="text-right space-y-2">
              <div className="flex justify-between w-64">
                <span className="text-[var(--text-secondary)]">Subtotal:</span>
                <span className="font-medium text-[var(--text-primary)]">${job.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-[var(--text-secondary)]">Tax:</span>
                <span className="font-medium text-[var(--text-primary)]">${job.tax.toFixed(2)}</span>
              </div>
              {job.extraCharges > 0 && (
                <div className="flex justify-between w-64">
                  <span className="text-[var(--text-secondary)]">Extra Charges:</span>
                  <span className="font-medium text-[var(--text-primary)]">${job.extraCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between w-64 border-t border-[var(--border)] pt-2">
                <span className="font-bold text-lg text-[var(--text-primary)]">Total:</span>
                <span className="font-bold text-lg text-[var(--text-primary)]">${job.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
