'use client'

import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

export default function SuperAdminReportsPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <PageHeader title="Reports" description="Platform-level analytics and exports" />
        <Card>
          <p className="text-[var(--text-secondary)]">Super Admin reports coming soon...</p>
        </Card>
      </div>
    </Layout>
  )
}
