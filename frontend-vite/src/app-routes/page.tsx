import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('role')
    
    if (token && role) {
      if (role === 'super_admin') {
        navigate('/super-admin/dashboard')
      } else {
        navigate('/shop/dashboard')
      }
    } else {
      navigate('/login')
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}
