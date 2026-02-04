'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('role')
    
    if (token && role) {
      if (role === 'super_admin') {
        router.push('/super-admin/dashboard')
      } else {
        router.push('/shop/dashboard')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}
