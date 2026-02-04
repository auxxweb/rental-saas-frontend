'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  address: any
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers')
      setCustomers(response.data)
    } catch (error) {
      toast.error('Error fetching customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/customers', formData)
      toast.success('Customer created successfully')
      setShowModal(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zipCode: '' }
      })
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating customer')
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Customers</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage your customer directory</p>
          </div>
          <Button onClick={() => setShowModal(true)}>Add Customer</Button>
        </div>

        <Card padding="none">
          <ul className="divide-y divide-[var(--border)]">
            {customers.length === 0 ? (
              <li className="px-6 py-6 text-center text-[var(--text-secondary)]">No customers found</li>
            ) : (
              customers.map((customer) => (
                <li key={customer._id} className="px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{customer.name}</h3>
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">
                      <p>Phone: {customer.phone}</p>
                      {customer.email && <p>Email: {customer.email}</p>}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-md px-4">
              <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add New Customer</h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
