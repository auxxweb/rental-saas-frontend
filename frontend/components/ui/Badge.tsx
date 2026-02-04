import React from 'react'
import { statusColors } from '@/lib/theme'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'active' | 'pending' | 'overdue' | 'returned' | 'cancelled' | 'suspended' | 'default'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const colors = variant !== 'default' ? statusColors[variant] : {
    bg: 'bg-[var(--surface-2)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border)]',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }
  
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  )
}
