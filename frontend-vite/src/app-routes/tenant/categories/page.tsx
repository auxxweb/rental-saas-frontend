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

type Category = { _id: string; name: string }

export default function TenantCategoriesPage() {
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [name, setName] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['v2-categories', appliedSearch, Cookies.get('tenantId')],
    queryFn: async () =>
      (
        await api.get<Category[]>('/v2/categories', {
          params: appliedSearch.trim() ? { search: appliedSearch.trim() } : undefined,
        })
      ).data,
    enabled: ready,
  })

  const create = useMutation({
    mutationFn: (n: string) => api.post('/v2/categories', { name: n }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-categories'] }),
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
      <PageHeader title="Categories" description="Create categories before products (step 1 of catalog setup)." />
      <SearchToolbar
        draft={draftSearch}
        onDraftChange={setDraftSearch}
        onSearch={() => setAppliedSearch(draftSearch)}
        placeholder="Filter by name (click Search)"
      />
      <Card padding="lg" className="mb-8">
        <form
          className="flex flex-col sm:flex-row gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            create.mutate(name.trim())
            setName('')
          }}
        >
          <div className="flex-1 w-full">
            <Input label="New category" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </div>
          <Button type="submit" disabled={create.isPending}>
            Add category
          </Button>
        </form>
      </Card>
      <Card padding="none">
        {isLoading ? (
          <div className="p-6 text-[var(--text-secondary)]">Loading…</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(data || []).map((c) => (
              <li key={c._id} className="px-6 py-4 text-[var(--text-primary)]">
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  )
}
