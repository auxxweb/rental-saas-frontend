import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import api from '@/lib/api'
import { applyDocumentLanguage } from '@/lib/rtl'
import { getRole } from '@/lib/auth'
import { GLOBAL_SETTINGS_UPDATED, isGlobalSettingsBumpKey } from '@/lib/globalSettingsEvents'
import { useAppLocaleStore } from '@/store/appLocaleStore'

async function loadAndApplyGlobal(): Promise<void> {
  const role = getRole()
  const isShopStaff = role === 'business_owner' || role === 'sub_admin'

  try {
    const { data } = await api.get('/global-settings', { params: { _: Date.now() } })
    // Shop UI uses tenant-synced locale from /auth/me (TenantLocaleSync); platform global would flash wrong region.
    if (!isShopStaff) {
      useAppLocaleStore.getState().setFromGlobal(data as Record<string, unknown>)
      useAppLocaleStore.getState().setLocaleNavReady(true)
    }
    const lang = (data?.defaultLanguage as string) || 'en'
    const globalDirection = (data?.direction as string) === 'rtl' ? 'rtl' : 'ltr'
    await i18n.changeLanguage(lang)
    applyDocumentLanguage(lang, 'global', globalDirection)
  } catch {
    applyDocumentLanguage('en', 'global', 'ltr')
    await i18n.changeLanguage('en')
    if (!isShopStaff) {
      useAppLocaleStore.getState().setLocaleNavReady(true)
    }
  }
}

export default function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void loadAndApplyGlobal()
  }, [])

  useEffect(() => {
    const onUpdated = () => {
      const role = getRole()
      if (role === 'business_owner' || role === 'sub_admin') return
      void loadAndApplyGlobal()
    }

    window.addEventListener(GLOBAL_SETTINGS_UPDATED, onUpdated)
    const onStorage = (e: StorageEvent) => {
      if (isGlobalSettingsBumpKey(e.key)) onUpdated()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(GLOBAL_SETTINGS_UPDATED, onUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
