'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`)
      setInvoice(response.data)
    } catch (error) {
      toast.error('Error fetching invoice')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!invoice) return

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <p className="text-[var(--text-secondary)]">Invoice not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Invoice: {invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
          <Button onClick={downloadPDF} variant="secondary" className="inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </Button>
        </div>

        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Invoice Details</h2>
              <p className="text-sm text-[var(--text-secondary)]">Invoice Number</p>
              <p className="font-medium text-[var(--text-primary)] mb-2">{invoice.invoiceNumber}</p>
              <p className="text-sm text-[var(--text-secondary)]">Date</p>
              <p className="font-medium text-[var(--text-primary)] mb-2">{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
              <p className="text-sm text-[var(--text-secondary)]">Status</p>
              <p className={`font-medium ${
                invoice.status === 'paid' ? 'text-green-600' :
                invoice.status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {invoice.status.toUpperCase()}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Customer Details</h2>
              <p className="font-medium text-[var(--text-primary)] mb-2">{invoice.customer.name}</p>
              {invoice.customer.phone && <p className="text-sm text-[var(--text-secondary)] mb-1">Phone: {invoice.customer.phone}</p>}
              {invoice.customer.email && <p className="text-sm text-[var(--text-secondary)] mb-1">Email: {invoice.customer.email}</p>}
            </div>
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
              {invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">{item.name}</td>
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
                <span className="font-medium text-[var(--text-primary)]">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-[var(--text-secondary)]">Tax:</span>
                <span className="font-medium text-[var(--text-primary)]">${invoice.tax.toFixed(2)}</span>
              </div>
              {invoice.extraCharges > 0 && (
                <div className="flex justify-between w-64">
                  <span className="text-[var(--text-secondary)]">Extra Charges:</span>
                  <span className="font-medium text-[var(--text-primary)]">${invoice.extraCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between w-64 border-t border-[var(--border)] pt-2">
                <span className="font-bold text-lg text-[var(--text-primary)]">Total:</span>
                <span className="font-bold text-lg text-[var(--text-primary)]">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
