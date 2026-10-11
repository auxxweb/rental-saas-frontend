/** BCP-47 base languages that use RTL layout in the panel */
export const RTL_LANGUAGE_BASES = ['ar', 'he', 'fa', 'ur']

export function isRtlLanguage(lang: string): boolean {
  const base = (lang || 'en').split('-')[0].toLowerCase()
  return RTL_LANGUAGE_BASES.includes(base)
}

/**
 * @param mode global: combine API direction + RTL scripts. business: tenant direction when set, else script heuristic.
 */
export function applyDocumentLanguage(
  lang: string,
  mode: 'global' | 'business' = 'global',
  globalDirection?: 'ltr' | 'rtl',
  tenantDirection?: 'ltr' | 'rtl'
): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('lang', lang)
  let rtl: boolean
  if (mode === 'business') {
    if (tenantDirection === 'rtl') rtl = true
    else if (tenantDirection === 'ltr') rtl = false
    else rtl = isRtlLanguage(lang)
  } else {
    rtl = isRtlLanguage(lang) || globalDirection === 'rtl'
  }
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
}
