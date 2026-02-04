'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [verificationType, setVerificationType] = useState<'link' | 'otp'>('link')
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  })
  const [token, setToken] = useState('')

  const handleRequestPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/request-password-change', {
        newPassword: formData.newPassword,
        verificationType
      })

      if (verificationType === 'otp') {
        setStep('verify')
        toast.success('Verification code sent to your email')
      } else {
        toast.success('Verification link sent to your email. Please check your inbox.')
        // For link type, user will click the link in email
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error requesting password change')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.otp) {
      toast.error('Please enter the OTP')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/verify-otp', {
        otp: formData.otp,
        newPassword: formData.newPassword
      })

      toast.success('Password changed successfully!')
      router.push('/shop/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-6">Verify Password Change</h1>

          <Card className="max-w-md">
            <div className="mb-4">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Enter Verification Code</p>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                className="w-full h-12 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('request')}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Change Password'}
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-6">Change Password</h1>

        <Card className="max-w-md">
          <div className="mb-4">
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Verification Method</p>
            <div className="flex space-x-4">
              <label className="flex items-center text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  value="link"
                  checked={verificationType === 'link'}
                  onChange={(e) => setVerificationType(e.target.value as 'link' | 'otp')}
                  className="mr-2 accent-[var(--accent)]"
                />
                <span>Email Link</span>
              </label>
              <label className="flex items-center text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  value="otp"
                  checked={verificationType === 'otp'}
                  onChange={(e) => setVerificationType(e.target.value as 'link' | 'otp')}
                  className="mr-2 accent-[var(--accent)]"
                />
                <span>OTP Code</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <Input
              label="New Password"
              type="password"
              required
              minLength={6}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter new password"
            />
          </div>

          <div className="mb-4">
            <Input
              label="Confirm New Password"
              type="password"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>

          <div className="rounded-[var(--radius-md)] p-4 mb-4 bg-[rgba(154,230,110,0.10)] border border-[rgba(154,230,110,0.22)]">
            <p className="text-sm text-[var(--text-secondary)]">
              {verificationType === 'link' 
                ? 'A verification link will be sent to your email. Click the link to complete the password change.'
                : 'A verification code will be sent to your email. Enter the code to complete the password change.'}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Request Password Change'}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
