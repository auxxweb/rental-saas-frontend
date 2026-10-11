import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function ShopSettingsPage() {
  const { t } = useTranslation('shop')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taxInclusive, setTaxInclusive] = useState(false)
  const [termsAndConditions, setTermsAndConditions] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const settingsRes = await api.get('/shop/settings')
      const { shop, tenant } = settingsRes.data

      setTermsAndConditions(shop?.termsAndConditions || '')
      if (tenant?.taxProfile?.taxInclusive != null) {
        setTaxInclusive(!!tenant.taxProfile.taxInclusive)
      } else {
        setTaxInclusive(!!shop?.settings?.taxInclusive)
      }
    } catch {
      toast.error(t('settings.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/shop/settings', {
        termsAndConditions,
        taxProfile: {
          taxInclusive,
        },
      })
      toast.success(t('settings.saved'))
      await load()
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tenant-locale-changed'))
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 text-sm text-[var(--text-secondary)]">{t('settings.loading')}</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto space-y-6">
        <PageHeader title={t('settings.heading')} description={t('settings.subtitle')} />

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-[var(--text-secondary)]">{t('settings.quickLinks')}</span>
          <Link to="/shop/settings/password" className="text-[var(--accent)] font-medium hover:underline">
            {t('settings.changePassword')}
          </Link>
        </div>

        <Card>
          <form onSubmit={save} className="space-y-5">
            <h3 className="font-semibold text-[var(--text-primary)]">{t('settings.tax')}</h3>
            <label className="flex items-start gap-3 text-sm text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-[var(--border)]"
                checked={taxInclusive}
                onChange={(e) => setTaxInclusive(e.target.checked)}
              />
              <span>{t('settings.taxInclusive')}</span>
            </label>

            <h3 className="font-semibold text-[var(--text-primary)] pt-2">{t('settings.terms')}</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('settings.termsHint')}</label>
              <textarea
                className="w-full min-h-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)]"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder={t('settings.termsPlaceholder')}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? t('settings.saving') : t('settings.save')}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
