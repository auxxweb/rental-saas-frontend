import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export default function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-5',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const hoverClass = hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  
  return (
    <div
      className={`bg-[var(--surface)] rounded-[var(--radius-md)] shadow-sm border border-[var(--border)] ${paddings[padding]} ${hoverClass} ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {children}
    </div>
  )
}
