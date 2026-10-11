import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

interface ShopCategory {
  _id: string
  code: string
  name: string
  createdAt?: string
}

function toastApiError(error: { response?: { data?: { message?: string; errors?: { msg: string }[] } } }) {
  const d = error.response?.data
  if (d?.errors?.length) {
    toast.error(d.errors.map((e) => e.msg).join('. '))
  } else {
    toast.error(d?.message || 'Request failed')
  }
}

export default function ShopCategoriesPage() {
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchDraft, setSearchDraft] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ShopCategory | null>(null)
  const [formData, setFormData] = useState({ code: '', name: '' })
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'created'>('name')

  const displayedCategories = useMemo(() => {
    const list = [...categories]
    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    } else if (sortBy === 'code') {
      list.sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { sensitivity: 'base' }))
    } else {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
    }
    return list
  }, [categories, sortBy])

  const fetchCategories = async (search?: string) => {
    try {
      const params =
        search && search.trim() ? { search: search.trim() } : undefined
      const res = await api.get<ShopCategory[]>('/shop-categories', params ? { params } : undefined)
      setCategories(res.data)
    } catch {
      toast.error('Error loading categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const runSearch = () => {
    setLoading(true)
    fetchCategories(searchDraft)
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({ code: '', name: '' })
    setShowModal(true)
  }

  const openEdit = (row: ShopCategory) => {
    setEditing(row)
    setFormData({ code: row.code || '', name: row.name })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = formData.code.trim().toUpperCase()
    const name = formData.name.trim()
    if (!code || !name) {
      toast.error('Category ID and name are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/shop-categories/${editing._id}`, { code, name })
        toast.success('Category updated')
      } else {
        await api.post('/shop-categories', { code, name })
        toast.success('Category created')
      }
      setShowModal(false)
      setEditing(null)
      setFormData({ code: '', name: '' })
      fetchCategories(searchDraft.trim() || undefined)
    } catch (error: unknown) {
      toastApiError(error as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: ShopCategory) => {
    if (!confirm(`Delete category "${row.name}" (${row.code || row._id})?`)) return
    try {
      await api.delete(`/shop-categories/${row._id}`)
      toast.success('Category deleted')
      fetchCategories(searchDraft.trim() || undefined)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const columns = [
    {
      key: 'code',
      label: 'Category ID',
      render: (value: string) => (
        <span className="font-mono text-sm text-[var(--text-primary)]">{value || '—'}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (value: string) => (
        <span className="font-medium text-[var(--text-primary)]">{value}</span>
      ),
    },
    {
      key: '_id',
      label: 'System ID',
      render: (value: string) => (
        <span className="text-xs font-mono text-[var(--text-secondary)] break-all max-w-[140px] inline-block">
          {value}
        </span>
      ),
      mobileHidden: true,
    },
  ]

  if (loading && categories.length === 0) {
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
          title="Categories"
          description="Manage product categories (ID and name) for your shop"
          action={{
            label: 'Add category',
            onClick: openCreate,
          }}
        />

        <Card className="mb-6" padding="md">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Search runs against the server when you click Search (or press Enter). Sort applies to the current result set below.
          </p>
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by category ID or name..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Sort by</label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'code' | 'created')}
              >
                <option value="name">Name (A–Z)</option>
                <option value="code">Category ID (A–Z)</option>
                <option value="created">Newest first</option>
              </select>
            </div>
            <Button type="button" onClick={runSearch} isLoading={loading}>
              Search
            </Button>
          </div>
        </Card>

        <ResponsiveTable
          columns={columns}
          data={displayedCategories}
          emptyMessage="No categories yet. Add a category to use it when creating products."
          actions={(row) => (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(row)
                }}
                className="text-xs"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(row)
                }}
                className="text-xs"
              >
                Delete
              </Button>
            </div>
          )}
        />

        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={openCreate}
            className="h-14 w-14 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-lg hover:bg-[var(--accent-dark)] flex items-center justify-center transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-md px-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {editing ? 'Edit category' : 'Add category'}
                  </h3>
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
                    label="Category ID"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. TOOLS, EQ-01"
                  />
                  <Input
                    label="Category name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Display name"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={saving}>
                      {editing ? 'Save' : 'Create'}
                    </Button>
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
