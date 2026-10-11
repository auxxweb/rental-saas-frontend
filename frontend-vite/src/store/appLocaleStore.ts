import { create } from 'zustand'

export type AppLocaleSnapshot = {
  currencyCode: string
  currencySymbol: string
  dialCode: string
  countryName: string
  timezone: string
}

const defaults: AppLocaleSnapshot = {
  currencyCode: 'USD',
  currencySymbol: '$',
  dialCode: '+1',
  countryName: '',
  timezone: 'UTC',
}

type State = AppLocaleSnapshot & {
  /** False until locale for the nav strip is known (avoids flashing platform global before tenant for shop). */
  localeNavReady: boolean
  setLocaleNavReady: (ready: boolean) => void
  setFromGlobal: (g: Record<string, unknown>) => void
  /** Nav country label from super-admin global settings (same source as super admin panel). */
  mergeGlobalCountryName: (g: Record<string, unknown>) => void
  setFromTenant: (tenant: Record<string, unknown> | null | undefined) => void
}

export const useAppLocaleStore = create<State>((set, get) => ({
  ...defaults,
  localeNavReady: false,
  setLocaleNavReady: (ready) => set({ localeNavReady: ready }),
  setFromGlobal: (g: Record<string, unknown>) => {
    const code = String(g.currencyCode || g.defaultCurrency || 'USD').toUpperCase()
    set({
      currencyCode: code,
      currencySymbol: g.currencySymbol != null ? String(g.currencySymbol) : '$',
      dialCode: g.dialCode != null ? String(g.dialCode).trim() || '+1' : '+1',
      countryName: g.countryName != null ? String(g.countryName).trim() : '',
      timezone: g.timezone != null ? String(g.timezone).trim() || 'UTC' : 'UTC',
    })
  },
  mergeGlobalCountryName: (g) => {
    const n = g.countryName != null ? String(g.countryName).trim() : ''
    if (n) set({ countryName: n })
  },
  setFromTenant: (tenant) => {
    if (!tenant || typeof tenant !== 'object') return
    const cur = get()
    const rawCid = tenant.countryId
    let nameFromCountry = ''
    if (rawCid && typeof rawCid === 'object' && rawCid !== null && 'name' in rawCid) {
      const n = (rawCid as { name?: string }).name
      if (n) nameFromCountry = String(n).trim()
    }
    const address = tenant.address as { country?: string } | undefined
    const addrCountry = address?.country?.trim() || ''
    const iso = tenant.countryCode ? String(tenant.countryCode).trim() : ''
    const countryName = nameFromCountry || addrCountry || cur.countryName || iso
    set({
      currencyCode: tenant.currency ? String(tenant.currency).toUpperCase() : cur.currencyCode,
      currencySymbol:
        tenant.currencySymbol != null && String(tenant.currencySymbol).trim() !== ''
          ? String(tenant.currencySymbol)
          : cur.currencySymbol,
      dialCode:
        tenant.dialCode != null && String(tenant.dialCode).trim() !== ''
          ? String(tenant.dialCode).trim()
          : cur.dialCode,
      timezone: tenant.timezone ? String(tenant.timezone) : cur.timezone,
      countryName,
    })
  },
}))
