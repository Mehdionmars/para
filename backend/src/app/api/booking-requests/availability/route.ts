import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { BOOKING_SLOTS, bookableDates, isSlotInFuture, SLOT_HOLDING_STATUSES } from '../../../../lib/bookings'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 20

/**
 * The bookable days and slots of one service, for the booking page.
 *
 * GET /api/booking-requests/availability?serviceId=18
 *   → { days: [{ date: "2026-10-17", slots: [{ time: "09:30", available: true }, …] }, …] }
 *
 * A slot is unavailable when it has passed or a pending or confirmed booking
 * holds it. Says nothing about who holds it: the response carries times only.
 */
async function handleGET(request: Request) {
  const serviceId = Number(new URL(request.url).searchParams.get('serviceId'))
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return Response.json({ error: 'Service invalide.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const dates = bookableDates()

  const held = await payload.find({
    collection: 'bookings',
    depth: 0,
    limit: dates.length * BOOKING_SLOTS.length,
    overrideAccess: true,
    pagination: false,
    select: { date: true, time: true },
    where: {
      and: [
        { service: { equals: serviceId } },
        { date: { in: dates } },
        { status: { in: SLOT_HOLDING_STATUSES } },
      ],
    },
  })
  const taken = new Set(held.docs.map((b) => `${b.date} ${b.time}`))

  const days = dates.map((date) => ({
    date,
    slots: BOOKING_SLOTS.map((time) => ({
      available: !taken.has(`${date} ${time}`) && isSlotInFuture(date, time),
      time,
    })),
  }))

  return Response.json({ days }, { headers: { 'Cache-Control': 'no-store' } })
}

export const GET = withApiLog('/api/booking-requests/availability', handleGET)
