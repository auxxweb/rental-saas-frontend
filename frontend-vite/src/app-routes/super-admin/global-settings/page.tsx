import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { COMMON_TIMEZONES } from '@/lib/commonTimezones'
import { listIso4217Currencies } from '@/lib/isoCurrencies'
import { notifyGlobalSettingsUpdated } from '@/lib/globalSettingsEvents'

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English (en)' },
  { code: 'ar', label: 'Arabic (ar)' },
  { code: 'hi', label: 'Hindi (hi)' },
  { code: 'ur', label: 'Urdu (ur)' },
  { code: 'fr', label: 'French (fr)' },
]

interface GlobalFormState {
  countryName: string
  defaultLanguage: string
  direction: 'ltr' | 'rtl'
  defaultCurrency: string
  currencySymbol: string
  timezone: string
  dialCode: string
  taxName: string
  taxPercentage: number
}

export default function GlobalSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingGlobal, setSavingGlobal] = useState(false)

  const [globalForm, setGlobalForm] = useState<GlobalFormState>({
    countryName: '',
    defaultLanguage: 'en',
    direction: 'ltr',
    defaultCurrency: 'USD',
    currencySymbol: '$',
    timezone: 'UTC',
    dialCode: '+1',
    taxName: 'VAT',
    taxPercentage: 0,
  })

  const currencyOptions = useMemo(() => listIso4217Currencies(), [])

  const timezoneOptions = useMemo(() => {
    const tz = globalForm.timezone
    const base = [...COMMON_TIMEZONES]
    if (tz && !base.includes(tz)) base.unshift(tz)
    return base
  }, [globalForm.timezone])

  const fetchGlobal = async () => {
    const res = await api.get('/admin/global-settings')
    const g = res.data
    setGlobalForm({
      countryName: g.countryName || '',
      defaultLanguage: g.defaultLanguage || 'en',
      direction: g.direction === 'rtl' ? 'rtl' : 'ltr',
      defaultCurrency: (g.defaultCurrency || 'USD').toUpperCase(),
      currencySymbol: g.currencySymbol != null ? String(g.currencySymbol) : '$',
      timezone: g.timezone || 'UTC',
      dialCode: g.dialCode != null ? String(g.dialCode) : '+1',
      taxName: g.taxName || 'VAT',
      taxPercentage: g.taxPercentage != null ? Number(g.taxPercentage) : 0,
    })
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        await fetchGlobal()
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const saveGlobal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGlobal(true)
    try {
      await api.patch('/admin/global-settings', {
        countryName: globalForm.countryName,
        defaultLanguage: globalForm.defaultLanguage,
        direction: globalForm.direction,
        defaultCurrency: globalForm.defaultCurrency,
        currencySymbol: globalForm.currencySymbol,
        timezone: globalForm.timezone,
        dialCode: globalForm.dialCode,
        taxName: globalForm.taxName,
        taxPercentage: globalForm.taxPercentage,
      })
      toast.success('Global settings saved')
      await fetchGlobal()
      notifyGlobalSettingsUpdated()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(message || 'Save failed')
    } finally {
      setSavingGlobal(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 text-[var(--text-secondary)] text-sm">Loading…</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto space-y-8">
        <PageHeader
          title="Global settings"
          description="Country rules, tax, currency, timezone, and language defaults for all business owners"
        />

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Defaults</h3>
          <form onSubmit={saveGlobal} className="space-y-4 max-w-xl">
            <Input
              label="Country label"
              value={globalForm.countryName}
              onChange={(e) => setGlobalForm((f) => ({ ...f, countryName: e.target.value }))}
              helperText="Display name (e.g. India, UAE)"
            />
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Default language</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={globalForm.defaultLanguage}
                onChange={(e) => setGlobalForm((f) => ({ ...f, defaultLanguage: e.target.value }))}
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Layout direction</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={globalForm.direction}
                onChange={(e) => setGlobalForm((f) => ({ ...f, direction: e.target.value as 'ltr' | 'rtl' }))}
              >
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Currency (ISO 4217)</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={globalForm.defaultCurrency}
                onChange={(e) => setGlobalForm((f) => ({ ...f, defaultCurrency: e.target.value.toUpperCase() }))}
              >
                {currencyOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Currency symbol"
              value={globalForm.currencySymbol}
              onChange={(e) => setGlobalForm((f) => ({ ...f, currencySymbol: e.target.value }))}
              helperText="e.g. ₹, د.إ, £, $"
            />
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Timezone (IANA)</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={globalForm.timezone}
                onChange={(e) => setGlobalForm((f) => ({ ...f, timezone: e.target.value }))}
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Dial code"
              value={globalForm.dialCode}
              onChange={(e) => setGlobalForm((f) => ({ ...f, dialCode: e.target.value }))}
              helperText="Must start with +"
            />
            <Input
              label="Tax name"
              value={globalForm.taxName}
              onChange={(e) => setGlobalForm((f) => ({ ...f, taxName: e.target.value }))}
              helperText="e.g. VAT, GST"
            />
            <Input
              type="number"
              label="Tax %"
              value={globalForm.taxPercentage}
              onChange={(e) => setGlobalForm((f) => ({ ...f, taxPercentage: Number(e.target.value) }))}
            />
            <Button type="submit" disabled={savingGlobal}>
              {savingGlobal ? 'Saving…' : 'Save global settings'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
