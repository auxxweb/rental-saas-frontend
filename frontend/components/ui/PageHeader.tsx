import React from 'react'
import Button from './Button'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }
  children?: React.ReactNode
}

export default function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              className="w-full sm:w-auto"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
