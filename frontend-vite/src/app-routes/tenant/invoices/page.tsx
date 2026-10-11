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

type Inv = {
  _id: string
  invoiceNumber: string
  grandTotal: number
  currency: string
  status: string
}

export default function TenantInvoicesPage() {
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [bookingId, setBookingId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['v2-invoices', appliedSearch, Cookies.get('tenantId')],
    queryFn: async () =>
      (
        await api.get<Inv[]>('/v2/invoices', {
          params: appliedSearch.trim() ? { search: appliedSearch.trim() } : undefined,
        })
      ).data,
    enabled: ready,
  })

  const fromBooking = useMutation({
    mutationFn: (id: string) => api.post(`/v2/invoices/from-booking/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-invoices'] }),
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
      <PageHeader title="Invoices" description="Tax uses tenant country VAT settings." />
      <SearchToolbar
        draft={draftSearch}
        onDraftChange={setDraftSearch}
        onSearch={() => setAppliedSearch(draftSearch)}
        placeholder="Invoice number"
      />
      <Card padding="lg" className="mb-8 max-w-xl">
        <form
          className="flex flex-col sm:flex-row gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            if (!bookingId.trim()) return
            fromBooking.mutate(bookingId.trim())
            setBookingId('')
          }}
        >
          <div className="flex-1 w-full">
            <Input
              label="Create from booking ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="MongoDB booking _id"
            />
          </div>
          <Button type="submit" disabled={fromBooking.isPending}>
            Generate invoice
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
                <th className="px-6 py-3 text-left">Invoice</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data || []).map((i) => (
                <tr key={i._id}>
                  <td className="px-6 py-3 font-mono">{i.invoiceNumber}</td>
                  <td className="px-6 py-3">
                    {i.grandTotal} {i.currency}
                  </td>
                  <td className="px-6 py-3">{i.status}</td>
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
