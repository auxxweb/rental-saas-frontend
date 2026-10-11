import { useEffect } from 'react'
import api from '@/lib/api'
import i18n from '@/lib/i18n'
import { getRole } from '@/lib/auth'
import { applyDocumentLanguage } from '@/lib/rtl'
import { GLOBAL_SETTINGS_UPDATED, isGlobalSettingsBumpKey } from '@/lib/globalSettingsEvents'
import { useAppLocaleStore } from '@/store/appLocaleStore'

/** Applies tenant language + direction (synced from global config) for shop roles. Bundled locales: en, ar only. */
export default function TenantLocaleSync() {
  useEffect(() => {
    let cancelled = false

    const apply = async () => {
      useAppLocaleStore.getState().setLocaleNavReady(false)
      try {
        const [{ data: globalData }, { data }] = await Promise.all([
          api.get('/global-settings', { params: { _: Date.now() } }),
          api.get('/auth/me', { params: { _: Date.now() } }),
        ])
        if (cancelled) return
        if (data.role !== 'business_owner' && data.role !== 'sub_admin') {
          useAppLocaleStore.getState().setLocaleNavReady(true)
          return
        }
        useAppLocaleStore.getState().setFromTenant(data.tenant as Record<string, unknown>)
        useAppLocaleStore.getState().mergeGlobalCountryName(globalData as Record<string, unknown>)
        useAppLocaleStore.getState().setLocaleNavReady(true)
        const raw = (data.tenant?.language as string | undefined) || 'en'
        const lng = raw.toLowerCase().startsWith('ar') ? 'ar' : 'en'
        const dir = data.tenant?.direction as 'ltr' | 'rtl' | undefined
        await i18n.changeLanguage(lng)
        applyDocumentLanguage(lng, 'business', undefined, dir)
      } catch {
        useAppLocaleStore.getState().setLocaleNavReady(true)
      }
    }

    const r = getRole()
    if (r === 'business_owner' || r === 'sub_admin') void apply()

    const onGlobalSettingsUpdated = () => {
      if (getRole() !== 'business_owner' && getRole() !== 'sub_admin') return
      void apply()
    }

    const onStorage = (e: StorageEvent) => {
      if (isGlobalSettingsBumpKey(e.key)) onGlobalSettingsUpdated()
    }

    window.addEventListener(GLOBAL_SETTINGS_UPDATED, onGlobalSettingsUpdated)
    window.addEventListener('storage', onStorage)
    const onLocale = () => void apply()
    window.addEventListener('tenant-locale-changed', onLocale)

    return () => {
      cancelled = true
      window.removeEventListener(GLOBAL_SETTINGS_UPDATED, onGlobalSettingsUpdated)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('tenant-locale-changed', onLocale)
    }
  }, [])

  return null
}
