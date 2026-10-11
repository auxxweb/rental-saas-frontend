import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const ChatWidget = lazy(() => import('@/components/chat/ChatWidget'))

const SHOP_SUPPORT_PATH = '/shop/support'

function isShopSupportPage(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname === SHOP_SUPPORT_PATH) return true
  return pathname === `${SHOP_SUPPORT_PATH}/`
}

/** Mount chat after first paint / idle so navigation and clicks stay responsive.
 *  Business-owner ↔ super-admin chat is only available on the shop Support page. */
export default function DeferredChatWidget() {
  const { pathname } = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const show = () => {
      if (!cancelled) setReady(true)
    }
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(show, { timeout: 2500 })
      return () => {
        cancelled = true
        cancelIdleCallback(id)
      }
    }
    const t = window.setTimeout(show, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [])

  if (!ready) return null
  if (!isShopSupportPage(pathname)) return null
  return (
    <Suspense fallback={null}>
      <ChatWidget />
    </Suspense>
  )
}
