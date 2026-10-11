/** ISO 4217 codes for dropdowns (uses Intl when available). */
export function listIso4217Currencies(): string[] {
  try {
    const I = Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
    if (typeof I.supportedValuesOf === 'function') {
      return I.supportedValuesOf('currency').slice().sort()
    }
  } catch {
    /* ignore */
  }
  return ['AED', 'AUD', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'INR', 'JPY', 'SAR', 'USD', 'ZAR']
}
