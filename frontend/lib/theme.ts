// Minimal shared status -> Tailwind class mapping (works in light & dark because surfaces are soft)
export const statusColors = {
  active: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  overdue: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  returned: {
    bg: 'bg-[rgba(154,230,110,0.14)]',
    text: 'text-[var(--text-primary)]',
    border: 'border-[rgba(154,230,110,0.28)]',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  suspended: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
} as const
