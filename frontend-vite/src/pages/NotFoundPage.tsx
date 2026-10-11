import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">404</h1>
      <p className="text-[var(--text-secondary)]">No route matched.</p>
      <Link to="/" className="text-primary-600 underline">
        Home
      </Link>
    </div>
  )
}
