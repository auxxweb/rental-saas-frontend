'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import RevenueTrendChart, { type RevenuePoint } from '@/components/charts/RevenueTrendChart'
import { format, subDays } from 'date-fns'

export default function ShopDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingReturns: 0,
    returnedJobs: 0
  })
  const [inventoryCount, setInventoryCount] = useState(0)
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([])
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchInventoryCount()
    fetchRevenueTrend()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/jobs/stats/overview')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryCount = async () => {
    try {
      const response = await api.get('/products')
      const totalStock = response.data.reduce((sum: number, product: any) => sum + product.stock, 0)
      setInventoryCount(totalStock)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const fetchRevenueTrend = async () => {
    setRevenueLoading(true)
    try {
      const end = new Date()
      const start = subDays(end, 13) // last 14 days

      const response = await api.get('/reports/payments', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      })

      const invoices = response.data?.invoices || []
      const map = new Map<string, number>()

      for (const inv of invoices) {
        const dayKey = format(new Date(inv.createdAt), 'yyyy-MM-dd')
        map.set(dayKey, (map.get(dayKey) || 0) + Number(inv.total || 0))
      }

      const series: RevenuePoint[] = []
      for (let i = 13; i >= 0; i--) {
        const d = subDays(end, i)
        const key = format(d, 'yyyy-MM-dd')
        series.push({
          label: format(d, 'MMM d'),
          revenue: Number((map.get(key) || 0).toFixed(2)),
        })
      }

      setRevenueSeries(series)
    } catch (error) {
      console.error('Error fetching revenue trend:', error)
      setRevenueSeries([])
    } finally {
      setRevenueLoading(false)
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
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Overview of your rental operations</p>
        </div>

        {/* Stats Grid - 12 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#9AE66E]/20 to-[#C6F76F]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9AE66E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            }
          />
          <StatCard
            title="Pending Returns"
            value={stats.pendingReturns}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
          <StatCard
            title="Returned Jobs"
            value={stats.returnedJobs}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
          <StatCard
            title="Inventory Count"
            value={inventoryCount}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#9AE66E]/20 to-[#C6F76F]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9AE66E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            }
          />
        </div>

        {/* Analytics (moved above Quick Actions) */}
        <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="xl:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Revenue Trend</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Last 14 days invoice totals</p>
              </div>
            </div>
            {revenueLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
              </div>
            ) : (
              <RevenueTrendChart data={revenueSeries} />
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Operational Snapshot</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Quick health indicators</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Active jobs</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.activeJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Pending returns</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.pendingReturns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Returned jobs</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.returnedJobs}</span>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Inventory</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{inventoryCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Status Summary - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/shop/jobs/new')}
                className="w-full text-left px-5 py-4 bg-gradient-to-r from-[#9AE66E]/10 to-[#C6F76F]/10 hover:from-[#9AE66E]/20 hover:to-[#C6F76F]/20 rounded-xl transition-all duration-200 border border-[#9AE66E]/20 group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[#9AE66E] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Create New Job</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Start a new rental job</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => router.push('/shop/products/new')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Add Product</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Add new product to inventory</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => router.push('/shop/returns')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Process Returns</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage product returns</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Status Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#9AE66E]/10 to-[#C6F76F]/10 rounded-xl border border-[#9AE66E]/20">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-[#9AE66E] rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Active Jobs</span>
                </div>
                <span className="text-sm font-bold text-[#9AE66E]">{stats.activeJobs}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Pending Returns</span>
                </div>
                <span className="text-sm font-bold text-amber-700">{stats.pendingReturns}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Completed Returns</span>
                </div>
                <span className="text-sm font-bold text-green-700">{stats.returnedJobs}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Total Inventory</span>
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{inventoryCount} items</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
