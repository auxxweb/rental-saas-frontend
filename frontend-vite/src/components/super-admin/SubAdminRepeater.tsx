import api from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export type SubAdminDraft = {
  id: string
  name: string
  email: string
  password: string
}

export function newSubAdminRow(): SubAdminDraft {
  const id =
    typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID
      ? globalThis.crypto.randomUUID()
      : `row-${Date.now()}-${Math.random()}`
  return { id, name: '', email: '', password: '' }
}

function rowHasAnyField(row: SubAdminDraft): boolean {
  return !!(row.name.trim() || row.email.trim() || row.password.length > 0)
}

/** Returns error message or null if OK. */
export function validateSubAdminDrafts(
  rows: SubAdminDraft[],
  ownerEmail: string
): string | null {
  const owner = ownerEmail.toLowerCase().trim()
  const seen = new Set<string>()
  for (const row of rows) {
    if (!rowHasAnyField(row)) continue
    const name = row.name.trim()
    const email = row.email.trim().toLowerCase()
    const pwd = row.password
    if (!name || !email || pwd.length < 6) {
      return 'Each sub-admin with any field filled needs username (name), email, and password (min 6 characters).'
    }
    if (email === owner) {
      return 'Sub-admin email must be different from the shop owner email.'
    }
    if (seen.has(email)) return 'Duplicate sub-admin emails in the list.'
    seen.add(email)
  }
  return null
}

export function getFilledSubAdminDrafts(rows: SubAdminDraft[]): SubAdminDraft[] {
  return rows.filter(rowHasAnyField)
}

type Variant = 'plain' | 'themed'

type Props = {
  rows: SubAdminDraft[]
  onChange: (rows: SubAdminDraft[]) => void
  variant?: Variant
  title?: string
  description?: string
}

export default function SubAdminRepeater({
  rows,
  onChange,
  variant = 'themed',
  title = 'Sub admins (optional)',
  description = 'Add one or more sub-admins. Each needs a display name, email, and password. Empty rows are ignored.',
}: Props) {
  const isPlain = variant === 'plain'

  const update = (id: string, patch: Partial<SubAdminDraft>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const remove = (id: string) => {
    onChange(rows.filter((r) => r.id !== id))
  }

  const add = () => onChange([...rows, newSubAdminRow()])

  const inputClass = isPlain
    ? 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
    : undefined

  const labelClass = isPlain ? 'block text-sm font-medium text-gray-700 mb-2' : 'block text-sm font-medium text-[var(--text-secondary)] mb-2'

  return (
    <div className="space-y-4">
      <div>
        <h2 className={isPlain ? 'text-xl font-semibold text-gray-900 mb-1' : 'text-lg font-semibold text-[var(--text-primary)] mb-1'}>
          {title}
        </h2>
        <p className={isPlain ? 'text-sm text-gray-600' : 'text-sm text-[var(--text-secondary)]'}>{description}</p>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.id}
          className={
            isPlain
              ? 'rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50/50'
              : 'rounded-xl border border-[var(--border)] p-4 space-y-3 bg-[var(--surface-2)]'
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Sub admin {index + 1}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(row.id)}>
              Remove
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Username (display name)</label>
              {isPlain ? (
                <input
                  type="text"
                  autoComplete="off"
                  value={row.name}
                  onChange={(e) => update(row.id, { name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Front desk"
                />
              ) : (
                <Input
                  autoComplete="off"
                  value={row.name}
                  onChange={(e) => update(row.id, { name: e.target.value })}
                  placeholder="e.g. Front desk"
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Email</label>
              {isPlain ? (
                <input
                  type="email"
                  autoComplete="off"
                  value={row.email}
                  onChange={(e) => update(row.id, { email: e.target.value })}
                  className={inputClass}
                  placeholder="subadmin@shop.com"
                />
              ) : (
                <Input
                  type="email"
                  autoComplete="off"
                  value={row.email}
                  onChange={(e) => update(row.id, { email: e.target.value })}
                  placeholder="subadmin@shop.com"
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Password</label>
              {isPlain ? (
                <input
                  type="password"
                  autoComplete="new-password"
                  value={row.password}
                  onChange={(e) => update(row.id, { password: e.target.value })}
                  className={inputClass}
                  placeholder="Min 6 characters"
                />
              ) : (
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={row.password}
                  onChange={(e) => update(row.id, { password: e.target.value })}
                  placeholder="Min 6 characters"
                />
              )}
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        + Add sub admin
      </Button>
    </div>
  )
}

/** POSTs each filled row; returns counts and per-email failure messages (partial success allowed). */
export async function createSubAdminsForTenant(
  tenantId: string,
  rows: SubAdminDraft[],
  ownerEmail: string
): Promise<{ created: number; failures: string[] }> {
  const msg = validateSubAdminDrafts(rows, ownerEmail)
  if (msg) throw new Error(msg)
  const toCreate = getFilledSubAdminDrafts(rows)
  const failures: string[] = []
  let created = 0
  for (const row of toCreate) {
    try {
      await api.post('/admin/sub-users', {
        tenantId,
        name: row.name.trim(),
        email: row.email.trim(),
        password: row.password,
      })
      created++
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } }
      failures.push(`${row.email}: ${ax.response?.data?.message || 'Request failed'}`)
    }
  }
  return { created, failures }
}
