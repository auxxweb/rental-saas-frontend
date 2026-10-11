import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type PlanOpt = { _id: string; title: string; name: string }

type SubscriptionRow = {
  _id: string
  name: string
  email: string
  status: string
  subscription: {
    plan?: string
    planId?: PlanOpt | string | null
    isActive?: boolean
    startDate?: string
    endDate?: string
  }
  subscriptionLifecycle: 'none' | 'active' | 'expired'
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([])
  const [plans, setPlans] = useState<PlanOpt[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [subRes, planRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/admin/subscription-plans'),
      ])
      setSubscriptions(subRes.data)
      setPlans(planRes.data.filter((p: PlanOpt & { isActive?: boolean }) => p.isActive !== false))
    } catch {
      toast.error('Error fetching subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const planIdForShop = (sub: SubscriptionRow) => {
    const p = sub.subscription?.planId
    if (p && typeof p === 'object' && '_id' in p) return p._id
    if (typeof p === 'string') return p
    return ''
  }

  const handleAssignPlan = async (shopId: string, planId: string) => {
    if (!planId) return
    try {
      await api.put(`/subscriptions/${shopId}`, { planId })
      toast.success('Subscription updated')
      load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating subscription')
    }
  }

  const toggleActive = async (row: SubscriptionRow) => {
    try {
      await api.put(`/subscriptions/${row._id}`, {
        isActive: !row.subscription?.isActive,
      })
      toast.success('Subscription flag updated')
      load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Subscriptions"
          description="Shop subscription status and lifecycle. Assign a plan to set dates from plan validity, or use Activate/Deactivate. For customer-driven upgrades, use Plan upgrade requests."
        />

        <Card>
          {subscriptions.length === 0 ? (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">No shops found</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {subscriptions.map((sub) => (
                <div key={sub._id} className="px-6 py-5 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{sub.name}</h3>
                        <Badge
                          variant={
                            sub.subscriptionLifecycle === 'active'
                              ? 'active'
                              : sub.subscriptionLifecycle === 'expired'
                                ? 'cancelled'
                                : 'pending'
                          }
                        >
                          {sub.subscriptionLifecycle === 'active'
                            ? 'Active period'
                            : sub.subscriptionLifecycle === 'expired'
                              ? 'Expired'
                              : 'No plan'}
                        </Badge>
                        <Badge variant={sub.subscription?.isActive ? 'active' : 'cancelled'}>
                          {sub.subscription?.isActive ? 'Flag: on' : 'Flag: off'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                        <p>Email: {sub.email}</p>
                        <p>
                          Plan:{' '}
                          <span className="font-medium text-[var(--text-primary)]">
                            {typeof sub.subscription?.planId === 'object' && sub.subscription.planId
                              ? sub.subscription.planId.title
                              : sub.subscription?.plan || '—'}
                          </span>
                        </p>
                        {sub.subscription?.endDate && (
                          <p>Ends: {new Date(sub.subscription.endDate).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:items-center">
                      <select
                        value={planIdForShop(sub)}
                        onChange={(e) => handleAssignPlan(sub._id, e.target.value)}
                        className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] min-w-[200px]"
                      >
                        <option value="">Assign plan…</option>
                        {plans.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.title} ({p.name})
                          </option>
                        ))}
                      </select>
                      <Button
                        variant={sub.subscription?.isActive ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => toggleActive(sub)}
                      >
                        {sub.subscription?.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
