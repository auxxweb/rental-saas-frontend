import { useAppLocaleStore } from '@/store/appLocaleStore'
import { formatCurrency } from '@/lib/currencyFormat'
import i18n from '@/lib/i18n'

/** Use in PDF handlers / callbacks where hooks are not available. */
export function formatMoneyForUi(amount: number): string {
  const { currencyCode, currencySymbol } = useAppLocaleStore.getState()
  return formatCurrency(amount, currencyCode, currencySymbol, i18n.language)
}

/** Prefix national digits with configured dial code; pass through if already E.164. */
export function formatPhoneForUi(nationalDigits: string): string {
  const { dialCode } = useAppLocaleStore.getState()
  const n = String(nationalDigits || '').trim()
  if (!n) return ''
  if (n.startsWith('+')) return n
  return `${String(dialCode).trim()} ${n}`.trim()
}
