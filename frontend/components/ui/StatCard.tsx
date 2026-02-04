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
}

export default function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] p-6 hover:shadow-md transition-all duration-200 ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-3">{value}</p>
          {trend && (
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              trend.isPositive 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <span className="mr-1">{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
