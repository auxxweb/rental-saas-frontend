type Props = {
  draft: string
  onDraftChange: (v: string) => void
  onSearch: () => void
  placeholder?: string
}

/** Search runs only when the user clicks Search (no live filtering on keystroke). */
export function SearchToolbar({ draft, onDraftChange, onSearch, placeholder }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        className="flex-1 min-w-[200px] h-11 rounded-full border border-[var(--border)] bg-[var(--field)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={placeholder || 'Search…'}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch()
        }}
      />
      <button
        type="button"
        onClick={onSearch}
        className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-95"
      >
        Search
      </button>
    </div>
  )
}
