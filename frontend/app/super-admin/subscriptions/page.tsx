'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

interface Subscription {
  _id: string
  name: string
  email: string
  subscription: {
    plan: string
    isActive: boolean
    startDate?: string
    endDate?: string
  }
  status: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions')
      setSubscriptions(response.data)
    } catch (error) {
      toast.error('Error fetching subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (shopId: string, plan: string, isActive: boolean) => {
    try {
      await api.put(`/subscriptions/${shopId}`, {
        plan,
        isActive
      })
      toast.success('Subscription updated')
      fetchSubscriptions()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating subscription')
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
          description="Manage shop subscription plans and status"
        />

        <Card>
          {subscriptions.length === 0 ? (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">
              No subscriptions found
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {subscriptions.map((sub) => (
                <div key={sub._id} className="px-6 py-5 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{sub.name}</h3>
                        <Badge variant={sub.subscription.isActive ? 'active' : 'cancelled'}>
                          {sub.subscription.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                        <p>Email: {sub.email}</p>
                        <p>Plan: <span className="font-medium capitalize text-[var(--text-primary)]">{sub.subscription.plan}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={sub.subscription.plan}
                        onChange={(e) => handleUpdate(sub._id, e.target.value, sub.subscription.isActive)}
                        className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                      >
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <Button
                        variant={sub.subscription.isActive ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleUpdate(sub._id, sub.subscription.plan, !sub.subscription.isActive)}
                      >
                        {sub.subscription.isActive ? 'Deactivate' : 'Activate'}
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
