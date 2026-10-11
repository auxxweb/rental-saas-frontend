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

type Ticket = {
  _id: string
  subject: string
  status: string
  priority: string
}

export default function TenantTicketsPage() {
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['v2-tickets', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<Ticket[]>('/v2/tickets')).data,
    enabled: ready,
  })

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/v2/tickets', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-tickets'] }),
  })

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const filtered =
    appliedSearch.trim() && data
      ? data.filter((t) =>
          t.subject.toLowerCase().includes(appliedSearch.toLowerCase())
        )
      : data

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
      <PageHeader title="Support tickets" description="Internal ticketing for your tenant." />
      <SearchToolbar
        draft={draftSearch}
        onDraftChange={setDraftSearch}
        onSearch={() => setAppliedSearch(draftSearch)}
        placeholder="Filter by subject (after load)"
      />
      <Card padding="lg" className="mb-8 max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate({ subject, body })
            setSubject('')
            setBody('')
          }}
        >
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Description</span>
            <textarea
              className="mt-1 w-full min-h-[100px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={create.isPending}>
            Submit ticket
          </Button>
        </form>
      </Card>
      <Card padding="none">
        {isLoading ? (
          <div className="p-6">Loading…</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(filtered || []).map((t) => (
              <li key={t._id} className="px-6 py-4">
                <p className="font-medium text-[var(--text-primary)]">{t.subject}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t.status} · {t.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  )
}
