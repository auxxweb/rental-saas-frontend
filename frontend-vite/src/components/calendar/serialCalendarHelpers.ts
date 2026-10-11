import { endOfDay, format, isSameDay, parseISO, startOfDay } from 'date-fns'

export type BookingSeg = {
  bookingId: string
  startDate: string
  endDate: string
  status: string
  customerName: string
}

export type SerialRow = {
  _id: string
  serialNumber: string
  status: string
  productId?: string
  productName?: string
  bookings: BookingSeg[]
}

export type TimelineBooking = {
  _id: string
  bookingNumber?: string
  customerName: string
  status: string
  startDate: string
  endDate: string
  actualReturnDate?: string | null
  updatedAt?: string | null
  items: { productItem: string; serialNumber: string }[]
}

export type DayEvent = {
  id: string
  sortKey: number
  kind: string
  title: string
  detail?: string
}

/** Shop MaintenanceRecord rows (expected end, start, completion) */
export type MaintenanceTimelineRow = {
  _id: string
  issueDescription: string
  startDate: string
  expectedEndDate?: string | null
  completedAt?: string | null
  status: string
  serialNumber: string
  productName?: string
}

export type CalendarPayload = {
  serialItems: SerialRow[]
  timelineBookings?: TimelineBooking[]
  upcomingBookings?: TimelineBooking[]
  maintenanceRecords?: MaintenanceTimelineRow[]
  /** When set, only these serials show as damaged (open shop damage reports). Null = use ProductItem status only. */
  damageOpenSerials?: string[] | null
  summary: {
    totalSerials: number
    availableCount: number
    bookedCount: number
    damagedOrMaintenanceCount: number
  }
}

export function cellKind(
  serial: SerialRow,
  dayStart: Date,
  dayEnd: Date
): {
  kind: 'available' | 'booked' | 'reserved' | 'damaged' | 'completed'
  booking?: BookingSeg
} {
  if (serial.status === 'damaged' || serial.status === 'maintenance') {
    return { kind: 'damaged' }
  }
  for (const b of serial.bookings) {
    const bs = parseISO(String(b.startDate))
    const be = parseISO(String(b.endDate))
    if (bs < dayEnd && be > dayStart) {
      if (b.status === 'draft') return { kind: 'reserved', booking: b }
      if (b.status === 'completed') return { kind: 'completed', booking: b }
      return { kind: 'booked', booking: b }
    }
  }
  return { kind: 'available' }
}

export const cellClass: Record<string, string> = {
  available: 'bg-emerald-500/25 border-emerald-600/40',
  booked: 'bg-red-500/25 border-red-600/40',
  reserved: 'bg-amber-400/25 border-amber-600/40',
  completed: 'bg-slate-500/30 border-slate-600/45',
  damaged: 'bg-zinc-500/25 border-zinc-600/40',
}

export function dayBounds(d: Date) {
  return { dayStart: startOfDay(d), dayEnd: endOfDay(d) }
}

function serialsLabel(items: TimelineBooking['items']) {
  const s = items.map((i) => i.serialNumber).filter(Boolean)
  return s.length ? s.join(', ') : '—'
}

function statusLabel(status: string) {
  const m: Record<string, string> = {
    draft: 'Reserved (draft)',
    confirmed: 'Confirmed',
    active: 'Active rental',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return m[status] || status
}

function bookingOverlapsDay(b: TimelineBooking, dayStart: Date, dayEnd: Date) {
  const bs = parseISO(String(b.startDate))
  const be = parseISO(String(b.endDate))
  return bs < dayEnd && be > dayStart
}

function hasBookingOverlapForSerial(
  bookings: TimelineBooking[],
  productItemId: string,
  dayStart: Date,
  dayEnd: Date
) {
  for (const b of bookings) {
    if (!b.items.some((i) => i.productItem === productItemId)) continue
    if (bookingOverlapsDay(b, dayStart, dayEnd)) return true
  }
  return false
}

/**
 * Groups rentals, returns, scheduled due dates, starts, and unit status lines per calendar day (local).
 */
export function buildEventsByDay(
  displayDays: Date[],
  timelineBookings: TimelineBooking[],
  serialItems: SerialRow[],
  maintenanceRecords: MaintenanceTimelineRow[] = [],
  damageOpenSerials: string[] | null = null
): Map<string, DayEvent[]> {
  const byDay = new Map<string, DayEvent[]>()
  for (const d of displayDays) {
    byDay.set(format(d, 'yyyy-MM-dd'), [])
  }

  for (const d of displayDays) {
    const { dayStart, dayEnd } = dayBounds(d)
    const key = format(d, 'yyyy-MM-dd')
    const bucket = byDay.get(key)!
    const seen = new Set<string>()

    for (const b of timelineBookings) {
      if (bookingOverlapsDay(b, dayStart, dayEnd)) {
        const id = `b-${b._id}-overlap-${key}`
        if (!seen.has(id)) {
          seen.add(id)
          const sn = serialsLabel(b.items)
          const sortKey = parseISO(String(b.startDate)).getTime()
          bucket.push({
            id,
            sortKey,
            kind: 'rental',
            title: `Rental · ${b.customerName}`,
            detail: `${sn} · ${statusLabel(b.status)}${b.bookingNumber ? ` · #${b.bookingNumber}` : ''}`,
          })
        }
      }

      if (b.actualReturnDate) {
        const ar = parseISO(String(b.actualReturnDate))
        if (!Number.isNaN(ar.getTime()) && isSameDay(ar, d)) {
          const id = `b-${b._id}-return-${key}`
          if (!seen.has(id)) {
            seen.add(id)
            bucket.push({
              id,
              sortKey: ar.getTime(),
              kind: 'return',
              title: 'Return recorded',
              detail: `${b.customerName} · ${serialsLabel(b.items)}`,
            })
          }
        }
      }

      const endDt = parseISO(String(b.endDate))
      if (
        !Number.isNaN(endDt.getTime()) &&
        isSameDay(endDt, d) &&
        b.status !== 'cancelled' &&
        b.status !== 'completed'
      ) {
        const id = `b-${b._id}-due-${key}`
        if (!seen.has(id)) {
          seen.add(id)
          bucket.push({
            id,
            sortKey: endDt.getTime(),
            kind: 'due',
            title: 'Scheduled return due',
            detail: `${b.customerName} · ${serialsLabel(b.items)}`,
          })
        }
      }
    }

    for (const m of maintenanceRecords) {
      const maintenanceOpen = m.status === 'PENDING' || m.status === 'IN_PROGRESS'
      if (m.expectedEndDate && maintenanceOpen) {
        const ed = parseISO(String(m.expectedEndDate))
        if (!Number.isNaN(ed.getTime()) && isSameDay(ed, d)) {
          const id = `m-${m._id}-expected-end-${key}`
          if (!seen.has(id)) {
            seen.add(id)
            bucket.push({
              id,
              sortKey: ed.getTime(),
              kind: 'maint',
              title: 'Maintenance expected end',
              detail: `${m.serialNumber}${m.productName ? ` · ${m.productName}` : ''}${m.issueDescription ? ` · ${m.issueDescription}` : ''}`,
            })
          }
        }
      }
      if (m.startDate) {
        const sd = parseISO(String(m.startDate))
        if (!Number.isNaN(sd.getTime()) && isSameDay(sd, d)) {
          const id = `m-${m._id}-start-${key}`
          if (!seen.has(id)) {
            seen.add(id)
            bucket.push({
              id,
              sortKey: sd.getTime(),
              kind: 'maint',
              title: 'Maintenance started',
              detail: `${m.serialNumber}${m.productName ? ` · ${m.productName}` : ''}${m.issueDescription ? ` · ${m.issueDescription}` : ''}`,
            })
          }
        }
      }
      if (m.completedAt) {
        const ca = parseISO(String(m.completedAt))
        if (!Number.isNaN(ca.getTime()) && isSameDay(ca, d)) {
          const id = `m-${m._id}-done-${key}`
          if (!seen.has(id)) {
            seen.add(id)
            let detail = `${m.serialNumber}${m.productName ? ` · ${m.productName}` : ''}`
            if (m.status === 'COMPLETED' && m.expectedEndDate) {
              const exp = parseISO(String(m.expectedEndDate))
              if (!Number.isNaN(exp.getTime()) && ca < exp) {
                detail += ' · Closed before scheduled end'
              }
            }
            bucket.push({
              id,
              sortKey: ca.getTime(),
              kind: 'maint',
              title: 'Maintenance completed',
              detail,
            })
          }
        }
      }
    }

    for (const row of serialItems) {
      const sid = String(row._id)
      if (row.status === 'maintenance') {
        const forSerial = maintenanceRecords.filter((r) => r.serialNumber === row.serialNumber)
        const hasOpenMaint = forSerial.some((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS')
        const allClosed =
          forSerial.length > 0 &&
          forSerial.every((r) => r.status === 'COMPLETED') &&
          !hasOpenMaint
        if (!allClosed) {
          bucket.push({
            id: `u-${sid}-${key}`,
            sortKey: 0,
            kind: 'unit',
            title: `Unit · ${row.serialNumber}`,
            detail: `In maintenance${row.productName ? ` · ${row.productName}` : ''}`,
          })
        }
      } else if (row.status === 'damaged') {
        const showDamaged =
          damageOpenSerials == null ? true : damageOpenSerials.includes(row.serialNumber)
        if (showDamaged) {
          bucket.push({
            id: `u-${sid}-${key}`,
            sortKey: 0,
            kind: 'unit',
            title: `Unit · ${row.serialNumber}`,
            detail: `Damaged unit${row.productName ? ` · ${row.productName}` : ''}`,
          })
        }
      } else if (row.status === 'rented' && !hasBookingOverlapForSerial(timelineBookings, sid, dayStart, dayEnd)) {
        bucket.push({
          id: `u-${sid}-rented-${key}`,
          sortKey: 1,
          kind: 'unit',
          title: `Unit · ${row.serialNumber}`,
          detail: `Marked rented (no overlapping booking in view)${row.productName ? ` · ${row.productName}` : ''}`,
        })
      }
    }

    bucket.sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title))
  }

  return byDay
}
