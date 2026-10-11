import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import api from '@/lib/api'
import { useTenantStore } from '@/store/tenantStore'

export default function TenantPicker() {
  const { tenantId, setTenantId } = useTenantStore()
  const [tenants, setTenants] = useState<{ _id: string; name: string }[]>([])

  useEffect(() => {
    const c = Cookies.get('tenantId')
    if (c) setTenantId(c)
  }, [setTenantId])

  useEffect(() => {
    api
      .get('/v2/tenants')
      .then((r) => setTenants(r.data))
      .catch(() => {})
  }, [])

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[var(--text-secondary)] hidden sm:inline">Tenant</span>
      <select
        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] max-w-[200px]"
        value={tenantId || ''}
        onChange={(e) => {
          const v = e.target.value || null
          setTenantId(v)
          if (typeof window !== 'undefined') window.location.reload()
        }}
      >
        <option value="">Select tenant…</option>
        {tenants.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  )
}
