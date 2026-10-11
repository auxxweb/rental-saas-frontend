import Cookies from 'js-cookie'
import api from './api'
import { useTenantStore } from '@/store/tenantStore'

export interface User {
  _id: string
  name: string
  email: string
  role: 'super_admin' | 'business_owner' | 'sub_admin'
  shop?: unknown
  tenant?: unknown
  /** Present for shop staff — same as tenant ObjectId string */
  tenantId?: string | null
  /** Present for shop staff — same as shop ObjectId string */
  shopId?: string | null
}

/** Match on set/remove so cookies are visible on all routes (e.g. /login vs /super-admin/...). */
const COOKIE_BASE = { path: '/', sameSite: 'lax' as const }
const COOKIE_AUTH = { ...COOKIE_BASE, expires: 7 }

function normalizeUserPayload(data: Record<string, unknown>): User {
  const rawId = data._id
  const _id =
    typeof rawId === 'object' && rawId !== null && '$oid' in (rawId as object)
      ? String((rawId as { $oid: string }).$oid)
      : String(rawId ?? '')
  return {
    _id,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    role: data.role as User['role'],
    ...(data.shop !== undefined && { shop: data.shop }),
    ...(data.tenant !== undefined && { tenant: data.tenant }),
    ...(data.tenantId !== undefined && { tenantId: data.tenantId as string | null }),
    ...(data.shopId !== undefined && { shopId: data.shopId as string | null }),
  }
}

/** Resolve tenant id from API user (explicit field or populated tenant object). */
export function getTenantIdFromUser(user: User | null): string | null {
  if (!user) return null
  if (user.tenantId) return user.tenantId
  const t = user.tenant as { _id?: string } | undefined
  if (t && typeof t === 'object' && t._id) return String(t._id)
  return null
}

/**
 * Keeps `tenantId` cookie + store aligned with the session user for `/api` + `X-Tenant-Id`.
 * Super admin: preserves or clears tenant only on fresh login (caller clears cookie before this if needed).
 */
export function syncTenantContextFromUser(user: User | null, options?: { superAdminClearTenant?: boolean }) {
  if (typeof window === 'undefined') return

  if (!user) {
    Cookies.remove('tenantId', COOKIE_BASE)
    useTenantStore.getState().setTenantId(null)
    return
  }

  if (user.role === 'super_admin') {
    if (options?.superAdminClearTenant) {
      Cookies.remove('tenantId', COOKIE_BASE)
      useTenantStore.getState().setTenantId(null)
    } else {
      const c = Cookies.get('tenantId')
      useTenantStore.getState().setTenantId(c || null)
    }
    return
  }

  const tid = getTenantIdFromUser(user)
  if (tid) {
    Cookies.set('tenantId', tid, COOKIE_AUTH)
    useTenantStore.getState().setTenantId(tid)
  } else {
    Cookies.remove('tenantId', COOKIE_BASE)
    useTenantStore.getState().setTenantId(null)
  }
}

export const login = async (email: string, password: string, role: string) => {
  const response = await api.post('/auth/login', { email, password, role })
  const { token, ...rest } = response.data
  const userData = normalizeUserPayload(rest as Record<string, unknown>)

  Cookies.set('token', token, COOKIE_AUTH)
  Cookies.set('role', userData.role, COOKIE_AUTH)
  Cookies.set('user', JSON.stringify(userData), COOKIE_AUTH)

  syncTenantContextFromUser(userData, {
    superAdminClearTenant: userData.role === 'super_admin',
  })

  return userData
}

export const logout = () => {
  Cookies.remove('token', COOKIE_BASE)
  Cookies.remove('role', COOKIE_BASE)
  Cookies.remove('user', COOKIE_BASE)
  Cookies.remove('tenantId', COOKIE_BASE)
  useTenantStore.getState().setTenantId(null)
  window.location.href = '/login'
}

let sessionInflight: Promise<User | null> | null = null

/**
 * Resolves the current user from the `user` cookie, or hydrates via GET /auth/me when a token exists.
 * Deduplicates concurrent calls (Layout + dashboard both await the same work).
 */
export async function ensureSession(): Promise<User | null> {
  if (sessionInflight) return sessionInflight

  sessionInflight = (async (): Promise<User | null> => {
    const existing = getCurrentUser()
    if (existing) {
      syncTenantContextFromUser(existing)
      return existing
    }

    const token = Cookies.get('token')
    if (!token) return null

    try {
      const { data } = await api.get('/auth/me')
      const u = normalizeUserPayload(data as Record<string, unknown>)
      Cookies.set('user', JSON.stringify(u), COOKIE_AUTH)
      Cookies.set('role', u.role, COOKIE_AUTH)
      syncTenantContextFromUser(u)
      return u
    } catch {
      return null
    }
  })()

  try {
    return await sessionInflight
  } finally {
    sessionInflight = null
  }
}

export const getCurrentUser = (): User | null => {
  const userStr = Cookies.get('user')
  if (!userStr) return null
  try {
    const parsed = JSON.parse(userStr) as Record<string, unknown>
    return normalizeUserPayload(parsed)
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => !!Cookies.get('token')

export const getRole = (): string | null => Cookies.get('role') || null
