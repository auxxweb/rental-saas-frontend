import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Cookies from 'js-cookie'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SearchToolbar } from '@/components/SearchToolbar'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'

type Customer = {
  _id: string
  name: string
  phone: string
  email?: string
  riskScore?: number
}

export default function TenantCustomersPage() {
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['v2-customers', appliedSearch, Cookies.get('tenantId')],
    queryFn: async () =>
      (
        await api.get<Customer[]>('/v2/customers', {
          params: appliedSearch.trim() ? { search: appliedSearch.trim() } : undefined,
        })
      ).data,
    enabled: ready,
  })

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/v2/customers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-customers'] }),
  })

  const [form, setForm] = useState({ name: '', phone: '', email: '', idProof: '' })

  if (Cookies.get('role') === 'super_admin' && !Cookies.get('tenantId')) {
    return (
      <Layout>
        <Card padding="lg">Select a tenant in the header first.</Card>
      </Layout>
    )
  }

  if (!ready) {
    return (
      <Layout>
        <Card padding="lg">Loading…</Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader title="Customers" description="ID proof and risk fields can be used for compliance." />
      <SearchToolbar
        draft={draftSearch}
        onDraftChange={setDraftSearch}
        onSearch={() => setAppliedSearch(draftSearch)}
      />
      <Card padding="lg" className="mb-8 max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate({ ...form })
            setForm({ name: '', phone: '', email: '', idProof: '' })
          }}
        >
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="ID proof reference"
            value={form.idProof}
            onChange={(e) => setForm((f) => ({ ...f, idProof: e.target.value }))}
          />
          <Button type="submit" disabled={create.isPending}>
            Add customer
          </Button>
        </form>
      </Card>
      <Card padding="none">
        {isLoading ? (
          <div className="p-6">Loading…</div>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data || []).map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-3">{c.name}</td>
                  <td className="px-6 py-3">{c.phone}</td>
                  <td className="px-6 py-3">{c.riskScore ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </Layout>
  )
}
