import type { Payload } from 'payload'
import { runSql, sql } from '../db/exec'
import { emailProvider } from './providers'

/**
 * Tells the shop a customer asked for an appointment: one entry in the
 * dashboard inbox, one email. Same shape as the stock alerts
 * (lib/notifications/stock.ts) — staff-addressed, deduplicated per booking
 * and channel, and an unconfigured email provider leaves the row `pending`
 * rather than pretending it was sent.
 *
 * The email goes to BOOKING_ALERT_EMAIL, or STOCK_ALERT_EMAIL when that is
 * not set — the shop's one staff mailbox in practice.
 */

export type BookingAlert = {
  bookingId: number
  serviceTitle: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  note?: string | null
}

const recipient = () => process.env.BOOKING_ALERT_EMAIL?.trim() || process.env.STOCK_ALERT_EMAIL?.trim() || ''

/** "2026-10-17" → "samedi 17 octobre". */
export function formatBookingDate(date: string): string {
  return new Intl.DateTimeFormat('fr-MA', { day: 'numeric', month: 'long', timeZone: 'UTC', weekday: 'long' }).format(
    new Date(`${date}T12:00:00Z`),
  )
}

function copy(alert: BookingAlert): { title: string; message: string } {
  const when = `${formatBookingDate(alert.date)} à ${alert.time}`
  const lines = [
    `${alert.customerName} demande un rendez-vous « ${alert.serviceTitle} » le ${when}.`,
    `Téléphone : ${alert.customerPhone}`,
    alert.customerEmail ? `Email : ${alert.customerEmail}` : null,
    alert.note ? `Précision : ${alert.note}` : null,
    'À confirmer ou refuser dans le dashboard, page Rendez-vous.',
  ]
  return {
    message: lines.filter(Boolean).join('\n'),
    title: `Nouveau rendez-vous — ${alert.serviceTitle}, ${when}`,
  }
}

export async function notifyBookingRequested(payload: Payload, alert: BookingAlert): Promise<void> {
  const { message, title } = copy(alert)
  const to = recipient()

  for (const channel of ['internal', 'email'] as const) {
    try {
      const inserted = await runSql(
        { payload },
        sql`INSERT INTO notifications
              (recipient_type, recipient_ref, type, channel, status, title, message, metadata, dedupe_key,
               updated_at, created_at)
            VALUES ('staff'::"enum_notifications_recipient_type",
                    ${channel === 'internal' ? null : to || null},
                    'BOOKING_REQUESTED'::"enum_notifications_type",
                    ${channel}::"enum_notifications_channel", 'pending', ${title}, ${message},
                    ${JSON.stringify({ bookingId: alert.bookingId, date: alert.date, time: alert.time })}::jsonb,
                    ${`booking:${alert.bookingId}:BOOKING_REQUESTED:${channel}`}, now(), now())
            ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
            RETURNING id`,
      )
      const row = inserted[0]
      if (!row) continue
      const id = Number(row.id)

      if (channel === 'internal') {
        await runSql({ payload }, sql`UPDATE notifications SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = ${id}`)
        continue
      }

      if (!to) {
        await runSql(
          { payload },
          sql`UPDATE notifications
                 SET error = 'BOOKING_ALERT_EMAIL non configuré — alerte conservée en interne.', updated_at = now()
               WHERE id = ${id}`,
        )
        continue
      }

      const result = await emailProvider.send({
        data: {
          customer: alert.customerName,
          date: formatBookingDate(alert.date),
          phone: alert.customerPhone,
          service: alert.serviceTitle,
          time: alert.time,
        },
        subject: title,
        template: 'booking-requested',
        text: message,
        to,
      })

      if (result.ok) {
        await runSql({ payload }, sql`UPDATE notifications SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = ${id}`)
      } else {
        const status = result.skipped ? 'pending' : 'failed'
        const detail = result.skipped ? result.reason : result.error
        await runSql(
          { payload },
          sql`UPDATE notifications
                 SET status = ${status}::"enum_notifications_status", error = ${detail}, updated_at = now()
               WHERE id = ${id}`,
        )
      }
    } catch (err) {
      // The booking is already stored; a failed alert must not undo it.
      payload.logger.error({ err }, `Alerte rendez-vous non enregistrée pour la réservation ${alert.bookingId}`)
    }
  }
}
