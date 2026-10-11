import Cookies from 'js-cookie'

/** Super admin must pick a tenant for /api/v2; business owner is scoped automatically. */
export function useTenantReady(): boolean {
  const role = Cookies.get('role')
  const tid = Cookies.get('tenantId')
  if (role === 'business_owner' || role === 'sub_admin') return true
  if (role === 'super_admin' && tid) return true
  return false
}
