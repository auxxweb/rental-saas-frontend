import { Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import GlobalSettingsProvider from '@/components/providers/GlobalSettingsProvider'
import TenantLocaleSync from '@/components/TenantLocaleSync'
import DeferredChatWidget from '@/components/DeferredChatWidget'

/**
 * Mirrors `frontend/app/layout.tsx` provider order (no Next Metadata / Script).
 */
export function RootLayout() {
  return (
    <GlobalSettingsProvider>
      <TenantLocaleSync />
      <ThemeProvider>
        <QueryProvider>
          <Outlet />
          <DeferredChatWidget />
          <ToastContainer position="top-right" autoClose={3000} />
        </QueryProvider>
      </ThemeProvider>
    </GlobalSettingsProvider>
  )
}
