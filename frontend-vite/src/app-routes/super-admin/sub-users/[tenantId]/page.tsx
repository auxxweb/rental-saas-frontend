import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type SubUser = {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt?: string
  createdBy?: { name?: string; email?: string }
}

export default function TenantSubUsersPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const [list, setList] = useState<SubUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [editing, setEditing] = useState<SubUser | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', isActive: true })

  const load = async () => {
    if (!tenantId) return
    try {
      const { data } = await api.get(`/admin/sub-users/tenant/${tenantId}`)
      setList(data)
    } catch {
      toast.error('Failed to load sub-users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [tenantId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      toast.error('Name, email, and password (min 6 chars) are required')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/sub-users', {
        tenantId,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      toast.success('Sub admin created')
      setForm({ name: '', email: '', password: '' })
      void load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (u: SubUser) => {
    setEditing(u)
    setEditForm({
      name: u.name,
      email: u.email,
      password: '',
      isActive: u.isActive,
    })
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        isActive: editForm.isActive,
      }
      if (editForm.password.length >= 6) body.password = editForm.password
      await api.patch(`/admin/sub-users/${editing._id}`, body)
      toast.success('Updated')
      setEditing(null)
      void load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this sub admin? They will no longer be able to sign in.')) return
    try {
      await api.delete(`/admin/sub-users/${id}`)
      toast.success('Removed')
      void load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Shop sub-users"
          description="Manage additional staff accounts for this business (same tenant)."
          action={{
            label: 'Back to shops',
            onClick: () => navigate('/super-admin/shops'),
          }}
        />

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Tenant ID: <code className="text-[var(--text-primary)]">{tenantId}</code>
        </p>

        <Card className="mb-6" padding="md">
          <h3 className="text-[var(--text-primary)] font-semibold mb-4">Add sub admin</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="flex items-end">
              <Button type="submit" isLoading={saving} disabled={saving}>
                Create
              </Button>
            </div>
          </form>
        </Card>

        <Card padding="md">
          <h3 className="text-[var(--text-primary)] font-semibold mb-4">Sub admins</h3>
          {list.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm">No sub admins yet.</p>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Created by</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u._id} className="border-b border-[var(--border)]/60">
                      <td className="py-2 pr-4 text-[var(--text-primary)]">{u.name}</td>
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4">{u.isActive ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4 text-[var(--text-secondary)]">
                        {u.createdBy?.name || u.createdBy?.email || '—'}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => handleDelete(u._id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full" padding="lg">
              <h4 className="font-semibold text-[var(--text-primary)] mb-4">Edit sub admin</h4>
              <div className="space-y-3">
                <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                <Input
                  label="New password (optional)"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="button" isLoading={saving} onClick={() => void handleUpdate()}>
                  Save
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
