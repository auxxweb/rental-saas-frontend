// Minimal shared status -> Tailwind class mapping (works in light & dark because surfaces are soft)
export const statusColors = {
  active: {
    bg: 'bg-[var(--accent)]',
    text: 'text-[var(--accent-ink)]',
    border: 'border-transparent',
  },
  pending: {
    bg: 'bg-[rgba(232,162,58,0.16)]',
    text: 'text-[#E8A23A]',
    border: 'border-transparent',
  },
  overdue: {
    bg: 'bg-[rgba(240,113,103,0.16)]',
    text: 'text-[#F07167]',
    border: 'border-transparent',
  },
  returned: {
    bg: 'bg-[var(--accent)]',
    text: 'text-[var(--accent-ink)]',
    border: 'border-transparent',
  },
  cancelled: {
    bg: 'bg-[var(--surface-2)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border)]',
  },
  suspended: {
    bg: 'bg-[rgba(240,113,103,0.16)]',
    text: 'text-[#F07167]',
    border: 'border-transparent',
  },
} as const
