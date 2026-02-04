'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import ShopStatusDonut from '@/components/charts/ShopStatusDonut'

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/shops/stats/overview')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
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

  const activePercentage = stats.totalShops > 0 ? Math.round((stats.activeShops / stats.totalShops) * 100) : 0
  const inactiveShops = Math.max(stats.totalShops - stats.activeShops - stats.pendingShops, 0)
  const donutData = [
    { name: 'Active', value: stats.activeShops, color: 'var(--accent)' },
    { name: 'Pending', value: stats.pendingShops, color: '#F59E0B' },
    { name: 'Inactive', value: inactiveShops, color: 'rgba(148,163,184,0.9)' },
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Overview of your rental SaaS platform</p>
        </div>

        {/* Stats Grid - 12 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Shops"
            value={stats.totalShops}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#9AE66E]/20 to-[#C6F76F]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9AE66E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            }
          />
          <StatCard
            title="Active Shops"
            value={stats.activeShops}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
            trend={{
              value: `${activePercentage}% of total`,
              isPositive: true
            }}
          />
          <StatCard
            title="Pending Shops"
            value={stats.pendingShops}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--warning)]/20 to-[var(--warning)]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#9AE66E]/20 to-[#C6F76F]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9AE66E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          />
        </div>

        {/* Quick Actions & Status Summary - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/super-admin/shops/new')}
                className="w-full text-left px-5 py-4 bg-gradient-to-r from-[#9AE66E]/10 to-[#C6F76F]/10 hover:from-[#9AE66E]/20 hover:to-[#C6F76F]/20 rounded-xl transition-all duration-200 border border-[#9AE66E]/20 group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[#9AE66E] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Create New Shop</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Onboard a new rental shop</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => router.push('/super-admin/shops')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Manage Shops</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">View and manage all shops</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => router.push('/super-admin/reports')}
                className="w-full text-left px-5 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 border border-[var(--border)] group"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">View Reports</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">Analytics and insights</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Status Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[var(--success)]/10 rounded-xl border border-[var(--success)]/20">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-[var(--success)] rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Active Shops</span>
                </div>
                <span className="text-sm font-bold text-[var(--success)]">{stats.activeShops}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--warning)]/10 rounded-xl border border-[var(--warning)]/20">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-[var(--warning)] rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Pending Approval</span>
                </div>
                <span className="text-sm font-bold text-[var(--warning)]">{stats.pendingShops}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#9AE66E]/10 to-[#C6F76F]/10 rounded-xl border border-[#9AE66E]/20">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 bg-[#9AE66E] rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Total Revenue</span>
                </div>
                <span className="text-sm font-bold text-[#9AE66E]">
                  ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="xl:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Shop Status Breakdown</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Active vs pending vs inactive</p>
              </div>
            </div>
            <ShopStatusDonut data={donutData} />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Platform Snapshot</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Key health metrics</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total shops</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.totalShops}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Active shops</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.activeShops}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Pending shops</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{stats.pendingShops}</span>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
