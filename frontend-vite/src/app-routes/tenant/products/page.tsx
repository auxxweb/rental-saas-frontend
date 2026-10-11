import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'js-cookie'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SearchToolbar } from '@/components/SearchToolbar'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'

type Cat = { _id: string; name: string }
type Product = {
  _id: string
  name: string
  localName?: string
  modelNumber: string
  category: Cat | string
}

export default function TenantProductsPage() {
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['v2-categories-all', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<Cat[]>('/v2/categories')).data,
    enabled: ready,
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['v2-catalog-products', appliedSearch, Cookies.get('tenantId')],
    queryFn: async () =>
      (
        await api.get<Product[]>('/v2/catalog-products', {
          params: appliedSearch.trim() ? { search: appliedSearch.trim() } : undefined,
        })
      ).data,
    enabled: ready,
  })

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/v2/catalog-products', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-catalog-products'] }),
  })

  const [form, setForm] = useState({
    name: '',
    localName: '',
    modelNumber: '',
    category: '',
    pricing: { hourly: 0, daily: 0, monthly: 0 },
  })

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
      <PageHeader
        title="Products & models"
        description="Model number groups products; add serials on the next step."
      />
      <SearchToolbar
        draft={draftSearch}
        onDraftChange={setDraftSearch}
        onSearch={() => setAppliedSearch(draftSearch)}
        placeholder="Search name / model"
      />
      <Card padding="lg" className="mb-8 max-w-2xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.category || !form.name || !form.modelNumber) return
            create.mutate({
              name: form.name,
              localName: form.localName,
              modelNumber: form.modelNumber,
              category: form.category,
              pricing: form.pricing,
            })
            setForm({
              name: '',
              localName: '',
              modelNumber: '',
              category: '',
              pricing: { hourly: 0, daily: 0, monthly: 0 },
            })
          }}
        >
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input
            label="Local name"
            value={form.localName}
            onChange={(e) => setForm((f) => ({ ...f, localName: e.target.value }))}
          />
          <Input
            label="Model number"
            value={form.modelNumber}
            onChange={(e) => setForm((f) => ({ ...f, modelNumber: e.target.value }))}
            required
          />
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Category</span>
            <select
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              required
            >
              <option value="">Select…</option>
              {(categories || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['hourly', 'daily', 'monthly'] as const).map((k) => (
              <Input
                key={k}
                label={k}
                type="number"
                min={0}
                step={0.01}
                value={String(form.pricing[k])}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pricing: { ...f.pricing, [k]: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            ))}
          </div>
          <Button type="submit" disabled={create.isPending}>
            Save product
          </Button>
        </form>
      </Card>
      <Card padding="none">
        {isLoading ? (
          <div className="p-6">Loading…</div>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Serials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(products || []).map((p) => (
                  <tr key={p._id}>
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3 font-mono">{p.modelNumber}</td>
                    <td className="px-6 py-3">{typeof p.category === 'object' ? p.category?.name : ''}</td>
                    <td className="px-6 py-3">
                      <Link
                        to={`/tenant/products/${p._id}/serials`}
                        className="font-semibold text-[var(--accent)] hover:brightness-95"
                      >
                        Manage serials
                      </Link>
                    </td>
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
