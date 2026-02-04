'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

interface Return {
  _id: string
  jobNumber: string
  customer: {
    name: string
    phone: string
  }
  expectedReturnDate: string
  actualReturnDate?: string
  status: string
  extraCharges: number
  total: number
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [returnDate, setReturnDate] = useState('')

  useEffect(() => {
    fetchReturns()
  }, [])

  const fetchReturns = async () => {
    try {
      const response = await api.get('/returns')
      setReturns(response.data)
    } catch (error) {
      toast.error('Error fetching returns')
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = (returnItem: any) => {
    setSelectedReturn(returnItem)
    setShowModal(true)
    setReturnDate(new Date().toISOString().slice(0, 16))
  }

  const processReturn = async () => {
    if (!selectedReturn) return

    try {
      await api.post(`/returns/${selectedReturn._id}`, {
        actualReturnDate: returnDate
      })
      toast.success('Return processed successfully')
      setShowModal(false)
      setSelectedReturn(null)
      fetchReturns()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error processing return')
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

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <PageHeader
          title="Returns"
          description="Track returns and process late fees"
        />

        <Card padding="none">
          <ul className="divide-y divide-[var(--border)]">
            {returns.length === 0 ? (
              <li className="px-6 py-6 text-center text-[var(--text-secondary)]">No returns found</li>
            ) : (
              returns.map((returnItem) => (
                <li key={returnItem._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{returnItem.jobNumber}</h3>
                        <Badge
                          className="ml-2"
                          variant={
                            returnItem.status === 'active'
                              ? 'pending'
                              : returnItem.status === 'returned'
                              ? 'active'
                              : returnItem.status === 'overdue'
                              ? 'overdue'
                              : 'default'
                          }
                        >
                          {returnItem.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-[var(--text-secondary)]">
                        <p>Customer: {returnItem.customer.name} ({returnItem.customer.phone})</p>
                        <p>Expected Return: {format(new Date(returnItem.expectedReturnDate), 'MMM dd, yyyy HH:mm')}</p>
                        {returnItem.actualReturnDate && (
                          <p>Actual Return: {format(new Date(returnItem.actualReturnDate), 'MMM dd, yyyy HH:mm')}</p>
                        )}
                        {returnItem.extraCharges > 0 && (
                          <p className="text-[rgba(239,68,68,0.95)] font-semibold">
                            Extra Charges: ${returnItem.extraCharges.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        ${returnItem.total.toFixed(2)}
                      </p>
                      {returnItem.status === 'active' && (
                        <div className="mt-2 flex justify-end">
                          <Button onClick={() => handleReturn(returnItem)} size="sm">
                            Process Return
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        {showModal && selectedReturn && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-md px-4">
              <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Process Return</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedReturn(null)
                  }}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <Input
                  label="Actual Return Date & Time"
                  type="datetime-local"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedReturn(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={processReturn}>Process Return</Button>
                </div>
              </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
