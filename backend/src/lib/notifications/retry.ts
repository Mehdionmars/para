import type { Payload } from 'payload'

import { runSql, sql } from '../db/exec'
import { emailProvider, pushProvider, whatsappProvider } from './providers'

/**
 * Re-attempts delivery of an existing notification.
 *
 * This never composes a message and never creates a row. It takes a
 * notification that already exists — same id, same dedupeKey, same title and
 * body — and pushes it at the provider again. That is the whole point: a
 * retry must be indistinguishable from the first attempt as far as the
 * recipient is concerned, and must not be able to produce a second alert.
 *
 * It also cannot touch anything outside the notification: no order is
 * created, no stock moves. The only writes are to this one row's delivery
 * fields.
 */

export const MAX_ATTEMPTS = 3

export type RetryOutcome =
  | { ok: true; status: 'sent'; attempts: number }
  | { ok: false; reason: 'not-found' }
  | { ok: false; reason: 'already-sent' }
  | { ok: false; reason: 'max-attempts'; attempts: number }
  | { ok: false; reason: 'internal-channel' }
  | { ok: false; reason: 'no-recipient' }
  | { ok: false; status: 'pending' | 'failed'; attempts: number; error: string; reason: 'delivery-failed' }

type Row = {
  id: number
  channel: string
  status: string
  attempts: string | number | null
  title: string | null
  message: string | null
  customer_email: string | null
  recipient_ref: string | null
  recipient_type: string | null
  type: string
}

export async function retryNotificationDelivery({
  id,
  payload,
}: {
  id: number
  payload: Payload
}): Promise<RetryOutcome> {
  const rows = (await runSql(
    { payload },
    sql`SELECT id, channel, status, attempts, title, message, customer_email, recipient_ref, recipient_type, type
          FROM notifications WHERE id = ${id}`,
  )) as unknown as Row[]

  const row = rows[0]
  if (!row) return { ok: false, reason: 'not-found' }

  // Already delivered: retrying would be a duplicate message to a real
  // person, which is the one outcome this whole design exists to prevent.
  if (row.status === 'sent' || row.status === 'read') return { ok: false, reason: 'already-sent' }

  // The in-app channel has no external delivery — writing the row was the
  // delivery. There is nothing to retry.
  if (row.channel === 'internal') return { ok: false, reason: 'internal-channel' }

  const attempts = Number(row.attempts) || 0
  if (attempts >= MAX_ATTEMPTS) return { attempts, ok: false, reason: 'max-attempts' }

  // recipient_ref is authoritative: it records who this row was actually
  // addressed to when it was created. customer_email is the legacy fallback
  // for rows written before that column existed, and the env var is the last
  // resort for staff alerts whose address was never stored.
  const recipient =
    row.recipient_ref ||
    row.customer_email ||
    (row.recipient_type === 'staff' && row.channel === 'email'
      ? process.env.STOCK_ALERT_EMAIL?.trim() || ''
      : '')

  if (!recipient) return { ok: false, reason: 'no-recipient' }

  const nextAttempt = attempts + 1
  const subject = row.title || 'Para d’Hiver'
  const text = row.message || ''

  let result:
    | { ok: true; skipped?: false }
    | { ok: false; skipped: true; reason: string }
    | { ok: false; skipped?: false; error: string }

  if (row.channel === 'email') {
    result = await emailProvider.send({
      data: { type: row.type },
      subject,
      template: row.type.toLowerCase().replace(/_/g, '-'),
      text,
      to: recipient,
    })
  } else if (row.channel === 'whatsapp') {
    result = await whatsappProvider.send({ phone: recipient, template: row.type.toLowerCase(), variables: {} })
  } else {
    result = await pushProvider.send({
      body: text,
      subscription: { auth: '', endpoint: '', p256dh: '' },
      title: subject,
    })
  }

  if (result.ok) {
    await runSql(
      { payload },
      sql`UPDATE notifications
             SET status = 'sent', sent_at = now(), error = NULL,
                 attempts = ${nextAttempt}, last_attempt_at = now(), updated_at = now()
           WHERE id = ${id}`,
    )
    return { attempts: nextAttempt, ok: true, status: 'sent' }
  }

  // An unconfigured provider is not a failure: nothing was attempted, so the
  // attempt counter still moves (the operator did ask) but the row stays
  // `pending` and is never marked sent.
  const status = result.skipped ? 'pending' : 'failed'
  const error = result.skipped ? result.reason : result.error

  await runSql(
    { payload },
    sql`UPDATE notifications
           SET status = ${status}::"enum_notifications_status", error = ${error},
               attempts = ${nextAttempt}, last_attempt_at = now(), updated_at = now()
         WHERE id = ${id}`,
  )

  return { attempts: nextAttempt, error, ok: false, reason: 'delivery-failed', status }
}
