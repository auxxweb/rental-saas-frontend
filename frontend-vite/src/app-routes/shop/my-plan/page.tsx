import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

type Plan = {
  _id: string
  name: string
  title: string
  subtitle?: string
  price: number
  currency: string
  features?: string[] | Record<string, unknown>
  marketingLines?: string[]
  validityDays: number
}

type ShopPayload = {
  subscription?: {
    plan?: string
    planId?: Plan | null
    startDate?: string
    endDate?: string
    isActive?: boolean
  }
}

type PendingRequest = {
  _id: string
  requestedPlan?: Plan
  status: string
  createdAt: string
}

export default function MyPlanPage() {
  const { t } = useTranslation('shop')
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<ShopPayload | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    'none' | 'active' | 'expired' | 'pending_upgrade'
  >('none')
  const [plans, setPlans] = useState<Plan[]>([])
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null)
  const [modalPlan, setModalPlan] = useState<Plan | null>(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/shop/subscription/my-plan')
      setShop(data.shop)
      setSubscriptionStatus(data.subscriptionStatus)
      setPlans(data.plans || [])
      setPendingRequest(data.pendingRequest || null)
    } catch {
      toast.error(t('myPlan.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const currentPlanId =
    shop?.subscription?.planId && typeof shop.subscription.planId === 'object'
      ? (shop.subscription.planId as Plan)._id
      : (shop?.subscription?.planId as string | undefined)

  const showUpgradeCta = (plan: Plan) => {
    if (pendingRequest) return false
    if (subscriptionStatus === 'pending_upgrade') return false
    if (subscriptionStatus === 'expired' || subscriptionStatus === 'none') return true
    if (subscriptionStatus === 'active' && currentPlanId && plan._id !== currentPlanId) return true
    return false
  }

  const ctaLabel = (plan: Plan) => {
    if (subscriptionStatus === 'expired' || subscriptionStatus === 'none') {
      return plan._id === currentPlanId ? t('myPlan.renew') : t('myPlan.upgrade')
    }
    return t('myPlan.requestChange')
  }

  const submitRequest = async () => {
    if (!modalPlan) return
    setSubmitting(true)
    try {
      await api.post('/shop/subscription/upgrade-requests', {
        requestedPlanId: modalPlan._id,
        paymentReference: paymentReference.trim(),
        paymentNote: paymentNote.trim(),
      })
      toast.success(t('myPlan.requestSent'))
      setModalPlan(null)
      setPaymentReference('')
      setPaymentNote('')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('myPlan.requestError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  const sub = shop?.subscription
  const resolvedPlan: Plan | null =
    sub?.planId && typeof sub.planId === 'object' ? (sub.planId as Plan) : null

  return (
    <Layout>
      <PageHeader title={t('myPlan.heading')} description={t('myPlan.subtitle')} />

      {pendingRequest && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-primary)]">
          {t('myPlan.pendingBanner', {
            plan: pendingRequest.requestedPlan?.title ?? '',
          })}
        </div>
      )}

      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t('myPlan.currentTitle')}</h3>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge
            variant={
              subscriptionStatus === 'active'
                ? 'active'
                : subscriptionStatus === 'expired'
                  ? 'cancelled'
                  : subscriptionStatus === 'pending_upgrade'
                    ? 'pending'
                    : 'pending'
            }
          >
            {subscriptionStatus === 'active'
              ? t('myPlan.statusActive')
              : subscriptionStatus === 'expired'
                ? t('myPlan.statusExpired')
                : subscriptionStatus === 'pending_upgrade'
                  ? t('myPlan.statusPendingUpgrade')
                  : t('myPlan.statusNone')}
          </Badge>
          {resolvedPlan && (
            <span className="text-xl font-semibold text-[var(--text-primary)]">{resolvedPlan.title}</span>
          )}
          {!resolvedPlan && sub?.plan && (
            <span className="text-lg text-[var(--text-primary)] capitalize">{sub.plan}</span>
          )}
        </div>
        {sub?.startDate && (
          <p className="text-sm text-[var(--text-secondary)]">
            {t('myPlan.start')}: {format(new Date(sub.startDate), 'PP')}
          </p>
        )}
        {sub?.endDate && (
          <p className="text-sm text-[var(--text-secondary)]">
            {t('myPlan.end')}: {format(new Date(sub.endDate), 'PP')}
          </p>
        )}
        <p className="mt-4 text-sm text-[var(--text-secondary)]">{t('myPlan.paymentHint')}</p>
      </Card>

      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t('myPlan.availableTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan._id} className="p-6 flex flex-col">
            <h4 className="text-lg font-semibold text-[var(--text-primary)]">{plan.title}</h4>
            {plan.subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{plan.subtitle}</p>}
            <p className="text-2xl font-bold text-[var(--accent)] mt-4">
              {plan.price} {plan.currency}
              <span className="text-sm font-normal text-[var(--text-secondary)]">
                {' '}
                / {plan.validityDays} {t('myPlan.days')}
              </span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-primary)] flex-1">
              {(plan.marketingLines || (Array.isArray(plan.features) ? plan.features : []) || []).map(
                (f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--accent)]">✓</span> {f}
                  </li>
                )
              )}
            </ul>
            <div className="mt-6">
              {currentPlanId === plan._id && subscriptionStatus === 'active' && (
                <Badge variant="active">{t('myPlan.currentBadge')}</Badge>
              )}
              {showUpgradeCta(plan) && (
                <Button className="w-full mt-2" onClick={() => setModalPlan(plan)}>
                  {ctaLabel(plan)}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {modalPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t('myPlan.modalTitle')}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              {modalPlan.title} — {modalPlan.price} {modalPlan.currency}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-4">{t('myPlan.modalHint')}</p>
            <label className="block mt-4 text-sm font-medium text-[var(--text-secondary)]">
              {t('myPlan.paymentRef')}
            </label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder={t('myPlan.paymentRefPlaceholder')}
            />
            <label className="block mt-3 text-sm font-medium text-[var(--text-secondary)]">
              {t('myPlan.paymentNote')}
            </label>
            <textarea
              className="mt-1 w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setModalPlan(null)}>
                {t('myPlan.cancel')}
              </Button>
              <Button onClick={submitRequest} disabled={submitting}>
                {submitting ? '…' : t('myPlan.submitRequest')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
