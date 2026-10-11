import { create } from 'zustand'
import Cookies from 'js-cookie'

const TENANT_COOKIE = { expires: 7, path: '/' as const, sameSite: 'lax' as const }

type State = {
  tenantId: string | null
  setTenantId: (id: string | null) => void
}

export const useTenantStore = create<State>((set) => ({
  tenantId: typeof window !== 'undefined' ? Cookies.get('tenantId') || null : null,
  setTenantId: (id) => {
    if (id) Cookies.set('tenantId', id, TENANT_COOKIE)
    else Cookies.remove('tenantId', { path: '/' })
    set({ tenantId: id })
  },
}))
