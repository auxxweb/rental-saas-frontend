import axios from 'axios'
import Cookies from 'js-cookie'

const COOKIE_PATH = { path: '/' as const }

/**
 * Base URL for the Express API (must include `/api` path segment).
 * In dev, default to same-origin `/api` so requests go through the Vite proxy (avoids CORS issues
 * that break login when calling `http://localhost:5000` from `http://localhost:5173`).
 * Set `VITE_API_URL` in `.env` to override (e.g. direct backend URL if you do not use the proxy).
 */
function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv != null && String(fromEnv).trim() !== '') {
    return String(fromEnv).trim()
  }
  if (import.meta.env.DEV) {
    return '/api'
  }
  return 'http://localhost:5000/api'
}

const API_URL = resolveApiBaseUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const tenantId = Cookies.get('tenantId')
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }
    return config
  },
  (error) => Promise.reject(error)
)

function isLoginAttempt401(error: { config?: { url?: string }; response?: { status?: number } }) {
  if (error.response?.status !== 401) return false
  const url = String(error.config?.url ?? '')
  /** Failed credential check — must not clear session or hard-redirect (login page needs to show toast). */
  return url.includes('/auth/login')
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isLoginAttempt401(error)) {
      Cookies.remove('token', COOKIE_PATH)
      Cookies.remove('role', COOKIE_PATH)
      Cookies.remove('user', COOKIE_PATH)
      Cookies.remove('tenantId', COOKIE_PATH)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
