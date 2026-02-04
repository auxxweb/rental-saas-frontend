'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'payments' | 'returns'>('jobs')
  const [jobs, setJobs] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  })

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const response = await api.get(`/reports/jobs?${params.toString()}`)
      setJobs(response.data.jobs)
    } catch (error) {
      toast.error('Error fetching jobs report')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const response = await api.get(`/reports/payments?${params.toString()}`)
      setPayments(response.data.invoices)
    } catch (error) {
      toast.error('Error fetching payments report')
    } finally {
      setLoading(false)
    }
  }

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const response = await api.get(`/reports/returns?${params.toString()}`)
      setReturns(response.data.returns)
    } catch (error) {
      toast.error('Error fetching returns report')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'jobs' | 'payments' | 'returns') => {
    setActiveTab(tab)
    if (tab === 'jobs') fetchJobs()
    else if (tab === 'payments') fetchPayments()
    else fetchReturns()
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <PageHeader
          title="Reports"
          description="Filter and export jobs, payments, and returns"
        />

        <Card padding="none">
          <div className="border-b border-[var(--border)]">
            <nav className="flex -mb-px overflow-x-auto">
              <button
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
                onClick={() => handleTabChange('payments')}
                className={`py-4 px-6 text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => handleTabChange('returns')}
                className={`py-4 px-6 text-sm font-semibold whitespace-nowrap ${
                  activeTab === 'returns'
                    ? 'border-b-2 border-[var(--accent)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Returns
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    if (activeTab === 'jobs') fetchJobs()
                    else if (activeTab === 'payments') fetchPayments()
                    else fetchReturns()
                  }}
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
              </div>
            ) : (
              <div>
                {activeTab === 'jobs' && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Total Jobs: {jobs.length}</p>
                    <ResponsiveTable
                      columns={[
                        { key: 'jobNumber', label: 'Job Number' },
                        { key: 'customer', label: 'Customer', render: (v) => v?.name || '-' },
                        {
                          key: 'status',
                          label: 'Status',
                          render: (v) => (
                            <Badge
                              variant={
                                v === 'active'
                                  ? 'active'
                                  : v === 'returned'
                                  ? 'returned'
                                  : v === 'overdue'
                                  ? 'overdue'
                                  : v === 'cancelled'
                                  ? 'cancelled'
                                  : 'default'
                              }
                            >
                              {String(v || '-')}
                            </Badge>
                          ),
                        },
                        { key: 'total', label: 'Total', render: (v) => `$${Number(v || 0).toFixed(2)}` },
                        { key: 'createdAt', label: 'Date', render: (v) => format(new Date(v), 'MMM dd, yyyy') },
                      ]}
                      data={jobs}
                      emptyMessage="No jobs for the selected date range"
                    />
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Total Invoices: {payments.length}</p>
                    <ResponsiveTable
                      columns={[
                        { key: 'invoiceNumber', label: 'Invoice Number' },
                        { key: 'customer', label: 'Customer', render: (v) => v?.name || '-' },
                        {
                          key: 'status',
                          label: 'Status',
                          render: (v) => (
                            <Badge variant={v === 'paid' ? 'active' : v === 'pending' ? 'pending' : 'overdue'}>
                              {String(v || '-')}
                            </Badge>
                          ),
                        },
                        { key: 'total', label: 'Total', render: (v) => `$${Number(v || 0).toFixed(2)}` },
                        { key: 'createdAt', label: 'Date', render: (v) => format(new Date(v), 'MMM dd, yyyy') },
                      ]}
                      data={payments}
                      emptyMessage="No invoices for the selected date range"
                    />
                  </div>
                )}

                {activeTab === 'returns' && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Total Returns: {returns.length}</p>
                    <ResponsiveTable
                      columns={[
                        { key: 'jobNumber', label: 'Job Number' },
                        { key: 'customer', label: 'Customer', render: (v) => v?.name || '-' },
                        {
                          key: 'actualReturnDate',
                          label: 'Return Date',
                          render: (v) => (v ? format(new Date(v), 'MMM dd, yyyy') : '-'),
                        },
                        {
                          key: 'extraCharges',
                          label: 'Extra Charges',
                          render: (v) => `$${Number(v || 0).toFixed(2)}`,
                        },
                        { key: 'total', label: 'Total', render: (v) => `$${Number(v || 0).toFixed(2)}` },
                      ]}
                      data={returns}
                      emptyMessage="No returns for the selected date range"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
