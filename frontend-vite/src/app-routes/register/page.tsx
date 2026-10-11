import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { login } from '@/lib/auth'
import { toast } from 'react-toastify'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function RegisterTenantPage() {
  const navigate = useNavigate()
  const { data: countries } = useQuery({
    queryKey: ['v2-countries'],
    queryFn: async () => (await api.get<{ code: string; name: string }[]>('/v2/countries')).data,
  })

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    countryCode: 'GB',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/v2/auth/register-tenant', form)
      await login(form.email, form.password, 'business_owner')
      toast.success('Welcome! Your business is ready.')
      navigate('/shop/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
        <Card padding="lg" hover>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Register your business</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Creates a tenant with VAT defaults (GB / AE / SA). You will sign in as business owner.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Business name"
              required
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            />
            <Input
              label="Owner name"
              required
              value={form.ownerName}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Country (VAT)</span>
              <select
                className="mt-1 w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--text-primary)]"
                value={form.countryCode}
                onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
              >
                {(countries || []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" fullWidth isLoading={loading} size="lg">
              Create account & sign in
            </Button>
            <p className="text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--accent)]">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
