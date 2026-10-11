import { useCallback } from 'react'
import { useAppLocaleStore } from '@/store/appLocaleStore'
import { formatCurrency } from '@/lib/currencyFormat'
import i18n from '@/lib/i18n'

/** Currency + regional display derived from global config (super admin) or synced tenant (shop). */
export function useAppLocale() {
  const currencyCode = useAppLocaleStore((s) => s.currencyCode)
  const currencySymbol = useAppLocaleStore((s) => s.currencySymbol)
  const dialCode = useAppLocaleStore((s) => s.dialCode)
  const countryName = useAppLocaleStore((s) => s.countryName)
  const timezone = useAppLocaleStore((s) => s.timezone)

  const formatMoney = useCallback(
    (amount: number) => formatCurrency(amount, currencyCode, currencySymbol, i18n.language),
    [currencyCode, currencySymbol]
  )

  const formatDateTime = useCallback(
    (iso: string | Date) => {
      const d = typeof iso === 'string' ? new Date(iso) : iso
      if (Number.isNaN(d.getTime())) return '—'
      try {
        return new Intl.DateTimeFormat(i18n.language || 'en', {
          timeZone: timezone,
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(d)
      } catch {
        return d.toLocaleString()
      }
    },
    [timezone]
  )

  /** Prefix national digits with the configured dial code (e.g. +91 98765…). */
  const withDial = useCallback(
    (nationalNumber: string) => {
      const n = String(nationalNumber || '').trim()
      const dial = dialCode.trim() || '+1'
      if (!n) return ''
      if (n.startsWith('+')) return n
      return `${dial} ${n}`.trim()
    },
    [dialCode]
  )

  return {
    currencyCode,
    currencySymbol,
    dialCode,
    countryName,
    timezone,
    formatMoney,
    formatDateTime,
    withDial,
  }
}
