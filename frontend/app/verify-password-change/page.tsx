'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/theme/ThemeToggle'

function VerifyPasswordChangeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid verification link')
      router.push('/login')
    }
  }, [token, email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!token || !email) {
      toast.error('Invalid verification link')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/verify-password-change', {
        token,
        email,
        newPassword: formData.newPassword
      })

      toast.success('Password changed successfully!')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error changing password')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <Card className="p-8" hover>
            <p className="text-[rgba(239,68,68,0.95)] font-medium">Invalid verification link</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <Card className="p-8" hover>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Change Your Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            minLength={6}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Enter new password"
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            minLength={6}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
          />

          <Button type="submit" fullWidth isLoading={loading} size="lg">
            Change Password
          </Button>
        </form>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyPasswordChangePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    }>
      <VerifyPasswordChangeForm />
    </Suspense>
  )
}
