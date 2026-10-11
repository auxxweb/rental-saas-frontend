import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
  variant?: 'panel' | 'due'
}

export default function StatCard({ title, value, icon, trend, className = '', variant = 'due' }: StatCardProps) {
  if (variant === 'due') {
    return (
      <div className={`due-bar ${className}`}>
        <div className="min-w-0">
          <p className="due-kicker">{title}</p>
          <p className="due-figure">{value}</p>
          {trend ? (
            <span className="due-trend">
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          ) : null}
        </div>
        {icon ? <div className="admin-stat-icon shrink-0">{icon}</div> : null}
      </div>
    )
  }

  return (
    <div className={`panel-card min-h-[156px] px-5 py-5 sm:px-6 sm:pt-5 sm:pb-6 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-none text-[var(--text-secondary)]">{title}</p>
        {icon ? <div className="admin-stat-icon shrink-0 -mt-0.5">{icon}</div> : null}
      </div>
      <p className="mt-5 text-[1.85rem] sm:text-[2rem] font-semibold tracking-[-0.045em] leading-none text-[var(--text-primary)]">
        {value}
      </p>
      {trend && (
        <div className="mt-4">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
              trend.isPositive
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'bg-[rgba(240,113,103,0.16)] text-[#F07167]'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        </div>
      )}
    </div>
  )
}
