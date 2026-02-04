import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary:
      'bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-ink)] hover:brightness-95 shadow-sm hover:shadow-md focus:ring-[var(--accent)]',
    secondary:
      'bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface)] border border-[var(--border)] shadow-sm focus:ring-[var(--accent)]',
    danger:
      'bg-[rgba(239,68,68,0.92)] text-white hover:bg-[rgba(239,68,68,1)] shadow-sm focus:ring-[rgba(239,68,68,0.5)]',
    outline:
      'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus:ring-[var(--accent)]',
    ghost:
      'text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus:ring-[var(--accent)]',
  }
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  }
  
  const width = fullWidth ? 'w-full' : ''
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}
