import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import Cookies from 'js-cookie'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'

type Item = { _id: string; serialNumber: string; status: string }

export default function TenantProductSerialsPage() {
  const params = useParams()
  const productId = params.productId as string
  const ready = useTenantReady()
  const qc = useQueryClient()
  const [single, setSingle] = useState('')
  const [bulkText, setBulkText] = useState('')

  const { data: items, isLoading } = useQuery({
    queryKey: ['v2-product-items', productId, Cookies.get('tenantId')],
    queryFn: async () =>
      (await api.get<Item[]>('/v2/product-items', { params: { productId } })).data,
    enabled: ready && !!productId,
  })

  const addOne = useMutation({
    mutationFn: (serialNumber: string) => api.post('/v2/product-items', { productId, serialNumber }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-product-items', productId] }),
  })

  const bulk = useMutation({
    mutationFn: (serials: string[]) => api.post('/v2/product-items/bulk', { productId, serials }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['v2-product-items', productId] }),
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
      <PageHeader title="Serial numbers" description="Each serial is a trackable asset for this model." />
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card padding="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!single.trim()) return
              addOne.mutate(single.trim())
              setSingle('')
            }}
            className="space-y-4"
          >
            <Input
              label="Add one serial"
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              placeholder="e.g. DRLTR-001"
            />
            <Button type="submit" disabled={addOne.isPending}>
              Add serial
            </Button>
          </form>
        </Card>
        <Card padding="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const serials = bulkText
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
              if (!serials.length) return
              bulk.mutate(serials)
              setBulkText('')
            }}
            className="space-y-4"
          >
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Bulk (comma or newline)</label>
            <textarea
              className="w-full min-h-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)]"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'DRLTR-001\nDRLTR-002'}
            />
            <Button type="submit" disabled={bulk.isPending}>
              Add bulk
            </Button>
          </form>
        </Card>
      </div>
      <Card padding="none">
        {isLoading ? (
          <div className="p-6">Loading…</div>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto touch-pan-x">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 text-left">Serial</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(items || []).map((i) => (
                <tr key={i._id}>
                  <td className="px-6 py-3 font-mono">{i.serialNumber}</td>
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
