/** Format stored numeric amounts using tenant / global currency (ISO 4217). */
export function formatCurrencyAmount(amount: number, currency: string, locale?: string): string {
  const cur = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat(locale || 'en', { style: 'currency', currency: cur }).format(Number(amount) || 0)
  } catch {
    return `${cur} ${Number(amount).toFixed(2)}`
  }
}

/** Prefer explicit symbol from global/tenant config. */
export function formatCurrency(amount: number, currencyCode: string, symbol?: string | null, locale?: string): string {
  const n = Number(amount) || 0
  const sym = symbol != null && String(symbol).trim() !== '' ? String(symbol).trim() : null
  const code = (currencyCode || 'USD').toUpperCase()
  if (sym) {
    return `${sym}${n.toLocaleString(locale || 'en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return formatCurrencyAmount(n, code, locale)
}
