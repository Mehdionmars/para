/**
 * The booking calendar: which days and times a service can be booked.
 *
 * Fixed for now — Monday to Saturday, the eight slots the booking page has
 * always shown — and kept here, in one place, so the availability endpoint,
 * the create endpoint and the Bookings collection can never disagree about
 * what a valid slot is. When the institute's real hours are known they change
 * here and nowhere else.
 *
 * Every date is a calendar day in Casablanca, as "YYYY-MM-DD", and every time
 * a wall-clock "HH:MM" there. The server's own time zone (UTC in Docker) is
 * never used to decide what "today" is.
 */

export const BOOKING_TIME_ZONE = 'Africa/Casablanca'

export const BOOKING_SLOTS = ['09:30', '10:00', '11:00', '12:00', '14:00', '15:30', '16:30', '17:30'] as const

/** Days of the week that take bookings, 0 = Sunday. */
export const BOOKING_OPEN_DAYS = new Set([1, 2, 3, 4, 5, 6])

/** How many open days ahead a customer can book. */
export const BOOKING_DAYS_AHEAD = 7

export const BOOKING_STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'done'] as const
export type BookingStatus = (typeof BOOKING_STATUS_OPTIONS)[number]

/** Statuses that hold a slot. A cancelled booking frees it again. */
export const SLOT_HOLDING_STATUSES: BookingStatus[] = ['pending', 'confirmed']

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** "Now" in Casablanca, as a calendar date and minutes since midnight. */
export function casablancaNow(now: Date = new Date()): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
      month: '2-digit',
      timeZone: BOOKING_TIME_ZONE,
      year: 'numeric',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

/** Day of the week of a "YYYY-MM-DD" date, 0 = Sunday. Computed at noon UTC,
 * which falls on the same calendar day in any zone the shop is in. */
function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay()
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const slotMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

/** The next BOOKING_DAYS_AHEAD open days, starting today. Today is left out
 * once its last slot has passed. */
export function bookableDates(now: Date = new Date()): string[] {
  const today = casablancaNow(now)
  const lastSlot = slotMinutes(BOOKING_SLOTS[BOOKING_SLOTS.length - 1])
  const out: string[] = []
  let date = today.date
  // Bounded: at most two weeks are scanned to find seven open days.
  for (let i = 0; out.length < BOOKING_DAYS_AHEAD && i < 21; i++) {
    const isToday = date === today.date
    if (BOOKING_OPEN_DAYS.has(weekday(date)) && !(isToday && today.minutes >= lastSlot)) out.push(date)
    date = addDays(date, 1)
  }
  return out
}

/** Whether a slot is still in the future. A slot that has started cannot be
 * booked, even if nobody holds it. */
export function isSlotInFuture(date: string, time: string, now: Date = new Date()): boolean {
  const today = casablancaNow(now)
  if (date > today.date) return true
  if (date < today.date) return false
  return slotMinutes(time) > today.minutes
}

/**
 * Why a requested slot is not bookable, or null when it is. Checks the shape
 * and the calendar only; whether someone already holds it is the database's
 * call (a partial unique index), so two people cannot both win the race.
 */
export function slotProblem(date: unknown, time: unknown, now: Date = new Date()): string | null {
  if (typeof date !== 'string' || !DATE_RE.test(date)) return 'Date invalide.'
  if (typeof time !== 'string' || !(BOOKING_SLOTS as readonly string[]).includes(time)) return 'Horaire invalide.'
  if (!bookableDates(now).includes(date)) return "Cette date n'est pas ouverte à la réservation."
  if (!isSlotInFuture(date, time, now)) return 'Ce créneau est déjà passé.'
  return null
}
