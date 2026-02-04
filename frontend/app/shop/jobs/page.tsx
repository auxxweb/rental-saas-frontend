'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { format } from 'date-fns'

interface Job {
  _id: string
  jobNumber: string
  customer: {
    name: string
    phone: string
  }
  status: string
  total: number
  startDate: string
  expectedReturnDate: string
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs')
      setJobs(response.data)
    } catch (error) {
      toast.error('Error fetching jobs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status: string): 'active' | 'pending' | 'overdue' | 'returned' | 'cancelled' => {
    switch (status) {
      case 'active':
        return 'active'
      case 'returned':
        return 'returned'
      case 'overdue':
        return 'overdue'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'pending'
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      key: 'jobNumber',
      label: 'Job Number',
      render: (value: string, row: Job) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {format(new Date(row.startDate), 'MMM dd, yyyy')}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (value: any) => (
        <div>
          <p className="text-sm text-[var(--text-primary)]">{value.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">{value.phone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusVariant(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'expectedReturnDate',
      label: 'Return Date',
      render: (value: string) => (
        <span className="text-sm text-[var(--text-primary)]">
          {format(new Date(value), 'MMM dd, yyyy')}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: 'total',
      label: 'Total',
      render: (value: number) => (
        <span className="font-semibold text-[var(--text-primary)]">
          ${value.toFixed(2)}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Jobs"
          description="Manage all rental jobs and bookings"
          action={{
            label: 'Create New Job',
            onClick: () => router.push('/shop/jobs/new'),
          }}
        />

        {/* Filters */}
        <Card className="mb-6" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Search by job number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-[var(--surface)] text-[var(--text-primary)]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="returned">Returned</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Jobs Table */}
        <ResponsiveTable
          columns={columns}
          data={filteredJobs}
          emptyMessage="No jobs found. Create your first job to get started."
          actions={(row) => (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/shop/jobs/${row._id}`)
              }}
            >
              View
            </Button>
          )}
          onRowClick={(row) => router.push(`/shop/jobs/${row._id}`)}
        />
      </div>
    </Layout>
  )
}
