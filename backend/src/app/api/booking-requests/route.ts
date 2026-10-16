import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { serverError } from '../../../lib/apiError'
import { slotProblem } from '../../../lib/bookings'
import { notifyBookingRequested } from '../../../lib/notifications/booking'
import { withApiLog } from '../../../lib/withApiLog'

export const maxDuration = 20

type BookingBody = {
  serviceId?: unknown
  date?: unknown
  time?: unknown
  name?: unknown
  phone?: unknown
  email?: unknown
  note?: unknown
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/** The booking hit the slot index (bookings_slot_held_idx): someone else
 * holds that slot. */
function isSlotTaken(err: unknown): boolean {
  const seen = new Set<unknown>()
  let current: unknown = err
  // The Postgres error can sit a few `cause`s deep under Payload's own.
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const e = current as {
      code?: string
      constraint?: string
      message?: string
      cause?: unknown
      data?: { collection?: string; errors?: { message?: string }[] }
    }
    // Payload rethrows the unique violation as its own ValidationError,
    // "Value must be unique", on the bookings table.
    if (e.data?.collection === 'bookings' && e.data.errors?.some((x) => x.message === 'Value must be unique')) return true
    if (e.code === '23505' || e.constraint === 'bookings_slot_held_idx' || e.message?.includes('bookings_slot_held_idx')) {
      return true
    }
    current = e.cause
  }
  return false
}

/**
 * A customer's appointment request.
 *
 * POST /api/booking-requests  { serviceId, date: "YYYY-MM-DD", time: "HH:MM", name, phone, email?, note? }
 *   201 → { ok: true, booking: { id, date, time, serviceTitle, status: "pending" } }
 *   409 → the slot was taken in the meantime
 *
 * The booking is stored as `pending`: the shop confirms or declines it from
 * the dashboard. The slot is checked against the calendar here and against
 * other bookings by the database (bookings_slot_held_idx), so two requests
 * for the same slot cannot both succeed.
 */
async function handlePOST(request: Request) {
  let body: BookingBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide.', ok: false }, { status: 400 })
  }

  const serviceId = Number(body.serviceId)
  const name = text(body.name, 120)
  const phone = text(body.phone, 40)
  const email = text(body.email, 200)
  const note = text(body.note, 1000)

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return Response.json({ error: 'Service invalide.', ok: false }, { status: 400 })
  }
  if (!name) return Response.json({ error: 'Indiquez votre nom.', ok: false }, { status: 400 })
  if (phone.replace(/\D/g, '').length < 8) {
    return Response.json({ error: 'Indiquez un numéro de téléphone valide.', ok: false }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Adresse email invalide.', ok: false }, { status: 400 })
  }
  const problem = slotProblem(body.date, body.time)
  if (problem) return Response.json({ error: problem, ok: false }, { status: 400 })
  const date = body.date as string
  const time = body.time as string

  const payload = await getPayload({ config: configPromise })

  const service = await payload
    .findByID({ collection: 'services', depth: 0, id: serviceId, overrideAccess: true })
    .catch(() => null)
  if (!service) return Response.json({ error: "Ce service n'existe plus.", ok: false }, { status: 404 })

  let booking
  try {
    booking = await payload.create({
      collection: 'bookings',
      data: {
        customerEmail: email || undefined,
        customerName: name,
        customerPhone: phone,
        date,
        note: note || undefined,
        service: serviceId,
        serviceTitle: service.title,
        status: 'pending',
        time,
      },
      depth: 0,
      overrideAccess: true,
    })
  } catch (err) {
    if (isSlotTaken(err)) {
      return Response.json(
        { error: 'Ce créneau vient d’être réservé. Choisissez-en un autre.', ok: false },
        { status: 409 },
      )
    }
    return serverError({ context: 'Réservation : création du rendez-vous', err, payload })
  }

  await notifyBookingRequested(payload, {
    bookingId: booking.id,
    customerEmail: email || null,
    customerName: name,
    customerPhone: phone,
    date,
    note: note || null,
    serviceTitle: service.title,
    time,
  })

  return Response.json(
    { booking: { date, id: booking.id, serviceTitle: service.title, status: 'pending', time }, ok: true },
    { status: 201 },
  )
}

export const POST = withApiLog('/api/booking-requests', handlePOST)
