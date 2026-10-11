/** Map pathname to shop.json title.* key for business owner panel */
export function getBusinessOwnerTitleKey(pathname: string): string {
  if (pathname.startsWith('/shop/settings/password')) return 'password'
  if (pathname.startsWith('/shop/dashboard')) return 'dashboard'
  if (pathname.startsWith('/shop/products') && pathname.includes('/units')) return 'productUnits'
  if (pathname.startsWith('/shop/products')) return 'products'
  if (pathname.startsWith('/shop/inventory/maintenance')) return 'inventoryMaintenance'
  if (pathname.startsWith('/shop/inventory/damage')) return 'inventoryDamage'
  if (pathname.startsWith('/shop/inventory/calendar')) return 'inventoryCalendar'
  if (pathname.startsWith('/shop/inventory')) return 'inventory'
  if (pathname.startsWith('/shop/categories')) return 'categories'
  if (pathname.startsWith('/shop/customers')) return 'customers'
  if (pathname.startsWith('/shop/jobs')) return 'jobs'
  if (pathname.startsWith('/shop/invoices')) return 'invoices'
  if (pathname.startsWith('/shop/reports')) return 'reports'
  if (pathname.startsWith('/shop/support')) return 'supportHelp'
  if (pathname.startsWith('/shop/settings')) return 'settings'
  if (pathname.startsWith('/shop/my-plan')) return 'myPlan'
  return 'dashboard'
}

export function getSuperAdminTitleKey(pathname: string): string {
  if (pathname.startsWith('/super-admin/dashboard')) return 'dashboard'
  if (pathname.startsWith('/super-admin/shops')) return 'shops'
  if (pathname.startsWith('/super-admin/chat')) return 'chat'
  if (pathname.startsWith('/super-admin/subscriptions')) return 'subscriptions'
  if (pathname.startsWith('/super-admin/plans')) return 'plans'
  if (pathname.startsWith('/super-admin/plan-requests')) return 'planRequests'
  if (pathname.startsWith('/super-admin/reports')) return 'reports'
  if (pathname.startsWith('/super-admin/support')) return 'support'
  if (pathname.startsWith('/super-admin/global-settings')) return 'globalSettings'
  if (pathname.startsWith('/super-admin/sub-users')) return 'subUsers'
  return 'dashboard'
}
