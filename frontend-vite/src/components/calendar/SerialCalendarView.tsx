import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'
import { type CalendarPayload, buildEventsByDay } from '@/components/calendar/serialCalendarHelpers'

type Props = {
  pageTitle?: string
  pageDescription?: string
}

export default function SerialCalendarView({
  pageTitle = 'Rental calendar',
  pageDescription = 'Pick an anchor date in the week or day you care about, then Search. Past dates show history; completed work is not shown as still scheduled.',
}: Props) {
  const ready = useTenantReady()
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [anchor, setAnchor] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [queryRange, setQueryRange] = useState<{ start: Date; end: Date } | null>(null)

  const displayDays = useMemo(() => {
    if (queryRange) {
      const out: Date[] = []
      let d = startOfDay(queryRange.start)
      const last = startOfDay(queryRange.end)
      while (d <= last) {
        out.push(d)
        d = addDays(d, 1)
      }
      return out
    }
    const a = parseISO(anchor)
    let rs: Date
    let re: Date
    if (viewMode === 'day') {
      rs = startOfDay(a)
      re = endOfDay(a)
    } else {
      rs = startOfWeek(a, { weekStartsOn: 1 })
      re = endOfWeek(a, { weekStartsOn: 1 })
    }
    const out: Date[] = []
    let d = startOfDay(rs)
    const last = startOfDay(re)
    while (d <= last) {
      out.push(d)
      d = addDays(d, 1)
    }
    return out
  }, [queryRange, anchor, viewMode])

  const calendarQuery = useQuery({
    queryKey: ['v2-calendar', queryRange?.start.toISOString(), queryRange?.end.toISOString(), Cookies.get('tenantId')],
    queryFn: async () => {
      if (!queryRange) throw new Error('No range')
      const { data } = await api.get<CalendarPayload>('/v2/calendar', {
        params: {
          startDate: queryRange.start.toISOString(),
          endDate: queryRange.end.toISOString(),
        },
      })
      return data
    },
    enabled: ready && !!queryRange,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const runSearch = useCallback(() => {
    const a = parseISO(anchor)
    let rs: Date
    let re: Date
    if (viewMode === 'day') {
      rs = startOfDay(a)
      re = endOfDay(a)
    } else {
      rs = startOfWeek(a, { weekStartsOn: 1 })
      re = endOfWeek(a, { weekStartsOn: 1 })
    }
    setQueryRange({ start: rs, end: re })
  }, [anchor, viewMode])

  const data = calendarQuery.data
  const loading = calendarQuery.isFetching

  const eventsByDay = useMemo(() => {
    if (!data || !queryRange) return null
    return buildEventsByDay(
      displayDays,
      data.timelineBookings ?? [],
      data.serialItems ?? [],
      data.maintenanceRecords ?? [],
      data.damageOpenSerials ?? null
    )
  }, [data, displayDays, queryRange])

  function dayPeriodLabel(d: Date) {
    const ds = startOfDay(d)
    if (isToday(d)) return 'Today'
    if (ds < startOfDay(new Date())) return 'Past'
    return 'Future'
  }

  function eventKindClass(kind: string) {
    const map: Record<string, string> = {
      rental: 'border-l-blue-500',
      return: 'border-l-emerald-500',
      due: 'border-l-amber-500',
      maint: 'border-l-orange-500',
      unit: 'border-l-zinc-500',
    }
    return map[kind] || 'border-l-[var(--border)]'
  }

  function axiosMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const dataMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      if (dataMsg) return dataMsg
    }
    if (err instanceof Error && err.message) return err.message
    return 'Failed to load calendar'
  }

  const errMsg = calendarQuery.isError ? axiosMessage(calendarQuery.error) : null

  if (Cookies.get('role') === 'super_admin' && !Cookies.get('tenantId')) {
    return (
      <Layout>
        <Card padding="lg">Select a tenant in the header first.</Card>
      </Layout>
    )
  }

  if (!ready) {
    return (
      <Layout>
        <Card padding="lg">Loading…</Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader title={pageTitle} description={pageDescription} />

      <Card padding="lg" className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
          <label className="text-sm w-full sm:flex-1 sm:min-w-[200px]">
            <span className="text-[var(--text-secondary)]">Anchor date</span>
            <input
              type="datetime-local"
              className="mt-1 block w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base sm:text-sm"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
            />
          </label>
          <label className="text-sm w-full sm:w-auto">
            View
            <select
              className="mt-1 block w-full sm:w-auto min-h-[44px] rounded-xl border border-[var(--border)] px-3 py-2 text-base sm:text-sm"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'week' | 'day')}
            >
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          </label>
          <Button type="button" onClick={runSearch} disabled={loading} className="w-full sm:w-auto shrink-0">
            {loading ? 'Loading…' : 'Search'}
          </Button>
        </div>
        {queryRange && (
          <p className="text-sm text-[var(--text-secondary)]">
            Range: {format(queryRange.start, 'PPp')} — {format(queryRange.end, 'PPp')}
          </p>
        )}
      </Card>

      {data?.summary && queryRange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard title="Total serials" value={data.summary.totalSerials} />
          <StatCard title="Available (status)" value={data.summary.availableCount} />
          <StatCard title="With booking in range" value={data.summary.bookedCount} />
          <StatCard title="Damaged / maintenance" value={data.summary.damagedOrMaintenanceCount} />
        </div>
      )}

      {errMsg && queryRange && <p className="text-sm text-red-600 mb-4">{errMsg}</p>}

      {queryRange && loading && !data && (
        <Card padding="lg" className="mb-4 text-[var(--text-secondary)] animate-pulse">
          Loading activity…
        </Card>
      )}

      {queryRange && data && eventsByDay && (
        <div className="mt-2 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Activity by date</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Open rentals, returns, scheduled return dates (until the booking completes), shop maintenance
            (expected end only while open, plus start and completion), and unit status. Completed maintenance is
            not listed as scheduled.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayDays.map((d) => {
              const key = format(d, 'yyyy-MM-dd')
              const events = eventsByDay.get(key) ?? []
              return (
                <Card key={key} padding="md" className="border border-[var(--border)]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-medium text-[var(--text-primary)]">{format(d, 'EEEE, MMM d')}</p>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        dayPeriodLabel(d) === 'Past'
                          ? 'bg-zinc-500/20 text-zinc-600'
                          : dayPeriodLabel(d) === 'Today'
                            ? 'bg-blue-500/20 text-blue-700'
                            : 'bg-emerald-500/15 text-emerald-700'
                      }`}
                    >
                      {dayPeriodLabel(d)}
                    </span>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">No recorded activity for this day.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {events.map((ev) => (
                        <li
                          key={ev.id}
                          className={`pl-2 border-l-2 ${eventKindClass(ev.kind)} text-[var(--text-primary)]`}
                        >
                          <span className="font-medium">{ev.title}</span>
                          {ev.detail ? (
                            <span className="block text-[var(--text-secondary)] text-xs mt-0.5">{ev.detail}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {queryRange && data && (data.upcomingBookings?.length ?? 0) > 0 && (
        <Card padding="lg" className="mt-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Upcoming (after this range)</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Next rentals starting in the following 30 days after this range.
          </p>
          <ul className="space-y-3 text-sm">
            {data.upcomingBookings!.map((b) => (
              <li
                key={String(b._id)}
                className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
              >
                <p className="font-medium text-[var(--text-primary)]">
                  {format(parseISO(String(b.startDate)), 'PPp')} — {b.customerName}
                </p>
                <p className="text-[var(--text-secondary)] text-xs mt-1">
                  {b.items?.map((i) => i.serialNumber).join(', ') || '—'} · {b.status}
                  {b.bookingNumber ? ` · #${b.bookingNumber}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Layout>
  )
}
