/** Fired after super admin saves global settings (same tab + storage sync for other tabs). */
export const GLOBAL_SETTINGS_UPDATED = 'global-settings-updated'

const LS_BUMP_KEY = 'global-settings-bump'

export function notifyGlobalSettingsUpdated(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_BUMP_KEY, String(Date.now()))
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(GLOBAL_SETTINGS_UPDATED))
}

export function isGlobalSettingsBumpKey(key: string | null): boolean {
  return key === LS_BUMP_KEY
}
