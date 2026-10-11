import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  tone?: 'default' | 'paper'
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  tone = 'default',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-5',
    md: 'p-6',
    lg: 'p-7',
  }

  const hoverClass = hover ? 'hover:-translate-y-0.5 transition-transform duration-200' : ''
  const toneClass = tone === 'paper' ? 'command-paper' : 'panel-card'

  return (
    <div className={`${toneClass} ${paddings[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  )
}
