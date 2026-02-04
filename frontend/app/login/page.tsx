'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { toast } from 'react-toastify'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'shop_admin'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.email, formData.password, formData.role)
      toast.success('Login successful!')
      
      if (formData.role === 'super_admin') {
        router.push('/super-admin/dashboard')
      } else {
        router.push('/shop/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        {/* Top right toggle (login is outside dashboard layout) */}
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left marketing / brand panel */}
          <div
            className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 hidden lg:flex flex-col justify-between"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center">
                  <span className="text-[var(--accent-ink)] font-bold text-lg">R</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Rental SaaS</p>
                  <p className="text-xs text-[var(--text-secondary)]">Billing • Jobs • Inventory</p>
                </div>
              </div>

              <h1 className="mt-8 text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
                Modern billing dashboard
                <span className="block text-[var(--text-secondary)] text-2xl mt-2">for rental businesses</span>
              </h1>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--text-secondary)]">Live jobs</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Trackable</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Job numbers + invoices</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--text-secondary)]">Reports</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Analytics</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Revenue & returns</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[var(--radius-md)] bg-[linear-gradient(135deg,rgba(154,230,110,0.16),rgba(198,247,111,0.10))] border border-[rgba(154,230,110,0.25)] p-5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Tip</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Use the theme toggle to switch between light & dark—your whole dashboard will match.
              </p>
            </div>

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[rgba(154,230,110,0.22)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[rgba(198,247,111,0.18)] blur-3xl" />
          </div>

          {/* Right login panel */}
          <Card padding="lg" className="relative overflow-hidden" hover>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Sign in</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Access your dashboard with your assigned credentials.
                </p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] flex items-center justify-center">
                <svg className="h-5 w-5 text-[var(--accent-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 2.21-1.79 4-4 4H5v-2h3a2 2 0 100-4H5V7h3c2.21 0 4 1.79 4 4zm7 4h-3c-2.21 0-4-1.79-4-4s1.79-4 4-4h3v2h-3a2 2 0 000 4h3v2z" />
                </svg>
              </div>
            </div>

            {/* Role segmented control */}
            <div className="mt-7">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Role</p>
              <div className="grid grid-cols-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'shop_admin' })}
                  className={`h-10 rounded-xl text-sm font-semibold ${
                    formData.role === 'shop_admin'
                      ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-ink)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Shop Admin
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'super_admin' })}
                  className={`h-10 rounded-xl text-sm font-semibold ${
                    formData.role === 'super_admin'
                      ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-ink)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <Input
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <Input
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] accent-[var(--accent)]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--accent)] hover:brightness-95"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" fullWidth isLoading={loading} size="lg">
                Sign In
              </Button>

              <p className="text-xs text-[var(--text-secondary)] text-center">
                By signing in you agree to your organization’s terms and policies.
              </p>
            </form>

            <div className="pointer-events-none absolute -top-24 -right-24 h-52 w-52 rounded-full bg-[rgba(154,230,110,0.18)] blur-3xl" />
          </Card>
        </div>
      </div>
    </div>
  )
}
