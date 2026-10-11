import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'

type CustomerRow = {
  _id: string
  name: string
  email?: string
  phone?: string
  phoneNumber?: string
  contactMethod?: string
  isBlocked?: boolean
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  documentType: '',
  documentNumber: '',
  documentUrl: '',
  contactMethod: 'phone' as 'phone' | 'email' | 'whatsapp',
  internalNotes: '',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [draftFilters, setDraftFilters] = useState({
    name: '',
    phone: '',
    email: '',
    blocked: '' as '' | 'true' | 'false',
  })
  const [appliedFilters, setAppliedFilters] = useState(draftFilters)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (appliedSearch.trim()) params.search = appliedSearch.trim()
      if (appliedFilters.name.trim()) params.name = appliedFilters.name.trim()
      if (appliedFilters.phone.trim()) params.phone = appliedFilters.phone.trim()
      if (appliedFilters.email.trim()) params.email = appliedFilters.email.trim()
      if (appliedFilters.blocked) params.blocked = appliedFilters.blocked

      const response = await api.get<CustomerRow[]>('/v2/customers', {
        params: Object.keys(params).length ? params : undefined,
      })
      setCustomers(response.data)
    } catch {
      toast.error('Error fetching customers')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [appliedSearch, appliedFilters])

  const runSearch = () => setAppliedSearch(draftSearch)

  const applyFilters = () => setAppliedFilters({ ...draftFilters })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/v2/customers', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: {
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
        },
        documentType: formData.documentType || undefined,
        documentNumber: formData.documentNumber || undefined,
        documentUrl: formData.documentUrl || undefined,
        contactMethod: formData.contactMethod,
        internalNotes: formData.internalNotes || undefined,
      })
      toast.success('Customer created successfully')
      setShowModal(false)
      setFormData(emptyForm)
      fetchCustomers()
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Error creating customer')
    }
  }

  const openEdit = async (c: CustomerRow) => {
    try {
      const { data } = await api.get<Record<string, unknown>>(`/v2/customers/${c._id}`)
      const addr = (data.address || {}) as Record<string, string>
      setEditId(c._id)
      setEditForm({
        ...emptyForm,
        name: String(data.name || ''),
        email: String(data.email || ''),
        phone: String(data.phone || data.phoneNumber || ''),
        addressLine: String(addr.addressLine || addr.street || ''),
        city: String(addr.city || ''),
        state: String(addr.state || ''),
        country: String(addr.country || ''),
        postalCode: String(addr.postalCode || addr.zipCode || ''),
        documentType: String(data.documentType || ''),
        documentNumber: String(data.documentNumber || ''),
        documentUrl: String(data.documentUrl || ''),
        contactMethod: (data.contactMethod as 'phone' | 'email' | 'whatsapp') || 'phone',
        internalNotes: String(data.internalNotes || data.notes || ''),
      })
    } catch {
      toast.error('Could not load customer')
    }
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    try {
      await api.patch(`/v2/customers/${editId}`, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email || null,
        address: {
          addressLine: editForm.addressLine,
          city: editForm.city,
          state: editForm.state,
          country: editForm.country,
          postalCode: editForm.postalCode,
        },
        documentType: editForm.documentType || undefined,
        documentNumber: editForm.documentNumber || undefined,
        documentUrl: editForm.documentUrl || undefined,
        contactMethod: editForm.contactMethod,
        internalNotes: editForm.internalNotes || undefined,
      })
      toast.success('Customer updated')
      setEditId(null)
      fetchCustomers()
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Error updating customer')
    }
  }

  const toggleBlock = async (c: CustomerRow) => {
    try {
      if (c.isBlocked) {
        await api.patch(`/v2/customers/${c._id}/unblock`)
        toast.success('Customer unblocked')
      } else {
        await api.patch(`/v2/customers/${c._id}/block`)
        toast.success('Customer blocked')
      }
      fetchCustomers()
    } catch {
      toast.error('Could not update status')
    }
  }

  const removeCustomer = async (id: string) => {
    if (!window.confirm('Delete this customer?')) return
    try {
      await api.delete(`/v2/customers/${id}`)
      toast.success('Customer removed')
      fetchCustomers()
    } catch {
      toast.error('Could not delete customer')
    }
  }

  if (initialLoad && customers.length === 0) {
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
          title="Customers"
          description="Manage your customer directory (tenant-scoped). Use Search / Apply filters — no auto-filtering."
          action={{
            label: 'Add Customer',
            onClick: () => setShowModal(true),
          }}
        />

        <Card padding="md" className="mb-6">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Search by name, email, or phone. Click Search to apply.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search customers…"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
              />
            </div>
            <Button type="button" onClick={runSearch} isLoading={loading}>
              Search
            </Button>
          </div>
        </Card>

        <Card padding="md" className="mb-6 space-y-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Name contains"
              value={draftFilters.name}
              onChange={(e) => setDraftFilters((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Phone contains"
              value={draftFilters.phone}
              onChange={(e) => setDraftFilters((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Email contains"
              value={draftFilters.email}
              onChange={(e) => setDraftFilters((f) => ({ ...f, email: e.target.value }))}
            />
            <label className="text-sm block">
              <span className="text-[var(--text-secondary)]">Blocked</span>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 bg-[var(--surface)]"
                value={draftFilters.blocked}
                onChange={(e) =>
                  setDraftFilters((f) => ({ ...f, blocked: e.target.value as '' | 'true' | 'false' }))
                }
              >
                <option value="">Any</option>
                <option value="false">Active only</option>
                <option value="true">Blocked only</option>
              </select>
            </label>
          </div>
          <Button type="button" variant="outline" onClick={applyFilters} isLoading={loading}>
            Apply filters
          </Button>
        </Card>

        <Card padding="none">
          <ul className="divide-y divide-[var(--border)]">
            {!loading && customers.length === 0 ? (
              <li className="px-6 py-6 text-center text-[var(--text-secondary)]">No customers match</li>
            ) : (
              customers.map((customer) => (
                <li key={customer._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{customer.name}</h3>
                    <div className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
                      <p>Phone: {customer.phone || customer.phoneNumber}</p>
                      {customer.email && <p>Email: {customer.email}</p>}
                      <p>
                        Status:{' '}
                        {customer.isBlocked ? (
                          <span className="text-red-600">Blocked</span>
                        ) : (
                          <span className="text-emerald-600">Active</span>
                        )}
                      </p>
                      <p>Contact: {customer.contactMethod || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/shop/customers/${customer._id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => openEdit(customer)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleBlock(customer)}>
                      {customer.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => removeCustomer(customer._id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-lg px-4 pb-20">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add customer</h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <Input label="Phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <Input label="Address line" value={formData.addressLine} onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    <Input label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                    <Input label="Postal code" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
                  </div>
                  <Input label="Document type" value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })} />
                  <Input label="Document number" value={formData.documentNumber} onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} />
                  <Input label="Document URL" value={formData.documentUrl} onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })} />
                  <label className="text-sm block">
                    <span className="text-[var(--text-secondary)]">Contact method</span>
                    <select
                      className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 bg-[var(--surface)]"
                      value={formData.contactMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, contactMethod: e.target.value as 'phone' | 'email' | 'whatsapp' })
                      }
                    >
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </label>
                  <Input
                    label="Internal notes"
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
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

        {editId && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-lg px-4 pb-20">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit customer</h3>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={saveEdit} className="space-y-4">
                  <Input label="Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <Input label="Phone" required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  <Input label="Address line" value={editForm.addressLine} onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                    <Input label="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Country" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
                    <Input label="Postal code" value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
                  </div>
                  <Input label="Document type" value={editForm.documentType} onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value })} />
                  <Input label="Document number" value={editForm.documentNumber} onChange={(e) => setEditForm({ ...editForm, documentNumber: e.target.value })} />
                  <Input label="Document URL" value={editForm.documentUrl} onChange={(e) => setEditForm({ ...editForm, documentUrl: e.target.value })} />
                  <label className="text-sm block">
                    <span className="text-[var(--text-secondary)]">Contact method</span>
                    <select
                      className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 bg-[var(--surface)]"
                      value={editForm.contactMethod}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contactMethod: e.target.value as 'phone' | 'email' | 'whatsapp' })
                      }
                    >
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </label>
                  <Input
                    label="Internal notes"
                    value={editForm.internalNotes}
                    onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setEditId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
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
