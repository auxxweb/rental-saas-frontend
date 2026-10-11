import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { router } from './routes'
import './styles/globals.css'

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen min-w-0 overflow-x-hidden">
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true,
      }}
    />
    </div>
  </React.StrictMode>
)
