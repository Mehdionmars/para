import type { Payload, PayloadRequest } from 'payload'

import { runSql, sql } from '../db/exec'
import type { OrderStatus } from '../orderStatus'
import { emailProvider, pushProvider, whatsappProvider } from './providers'
import { renderEmailHtml } from './emailTemplates'
import { renderNotification, templateVariables } from './templates'
import type {
  DeliveryResult,
  NotificationChannel,
  NotificationContext,
  NotificationStatus,
  OrderNotificationEvent,
  Recipient,
} from './types'

/**
 * NotificationService — the one place an order event turns into messages.
 *
 * Callers hand it an order and an event; it decides the channels, records
 * one row per channel, and attempts delivery. Nothing else in the codebase
 * talks to a provider directly.
 *
 * ## Idempotence
 *
 * The guarantee is a unique index on (order_id, type, channel), not an
 * application-level "have I sent this?" lookup — a read-then-write would let
 * two concurrent status changes both find nothing and both send. Each row is
 * claimed with:
 *
 *   INSERT ... ON CONFLICT (order_id, type, channel) DO NOTHING RETURNING id
 *
 * A caller that gets no id lost the race (or is a replay) and sends nothing.
 * Running the status hook twice therefore produces exactly one message per
 * channel, which is the property the whole design turns on.
 *
 * The one deliberate exception is retry: a row already recorded as `failed`
 * is re-claimed, because a transient provider outage should not permanently
 * suppress a customer's notification.
 */

type NotifyArgs = {
  payload: Payload
  order: {
    id: number
    orderNumber?: string | null
    customerName?: string | null
    customerEmail?: string | null
    customerPhone?: string | null
    total?: number | null
    status?: string | null
    items?: { quantity?: number | null }[] | null
  }
  event: OrderNotificationEvent
  /** Which channels to attempt. Defaults to every channel; the unconfigured
   * ones record themselves as pending and cost nothing. */
  channels?: NotificationChannel[]
  /** Present when called from a collection hook. The rows are then written on
   * that request's transaction — see lib/db/exec.ts for why a separate
   * connection deadlocks against the very row being changed. */
  req?: PayloadRequest
  /**
   * Record what is owed, but do not contact any provider.
   *
   * The checkout used to `await` delivery inside the shopper's request, so
   * every order paid for a round trip to Resend before the confirmation page
   * could render — and a slow or unreachable provider stretched that into a
   * timeout on the one request that must never feel unreliable.
   *
   * Deferring writes the same rows, with the same (order, type, channel)
   * uniqueness, and leaves them `pending`. /api/jobs/tick delivers them a
   * moment later. Nothing is lost if the process dies in between: the row is
   * committed in Postgres, which is exactly why the outbox is a table and not
   * a queue in memory.
   *
   * The `internal` channel is still completed inline — writing that row *is*
   * the delivery, so deferring it would only delay the staff inbox.
   */
  defer?: boolean
}

export type NotifyOutcome = {
  channel: NotificationChannel
  status: NotificationStatus | 'duplicate'
  detail?: string
}

const ALL_CHANNELS: NotificationChannel[] = ['internal', 'email', 'whatsapp', 'push']

export async function notifyOrderEvent({
  channels = ALL_CHANNELS,
  defer = false,
  event,
  order,
  payload,
  req,
}: NotifyArgs): Promise<NotifyOutcome[]> {
  const target = req ?? { payload }
  const ctx: NotificationContext = {
    customerEmail: String(order.customerEmail || '').toLowerCase(),
    customerName: String(order.customerName || 'client'),
    customerPhone: order.customerPhone ?? null,
    event,
    itemCount: (order.items ?? []).reduce((n, i) => n + (Number(i?.quantity) || 0), 0),
    orderId: order.id,
    orderNumber: String(order.orderNumber || `#${order.id}`),
    status: (order.status || 'pending') as OrderStatus,
    total: Number(order.total) || 0,
  }

  const rendered = renderNotification(ctx)
  const outcomes: NotifyOutcome[] = []

  /**
   * The recipient differs *per channel* for an order event, which is exactly
   * the conflation the old model could not express: the in-app row is read by
   * the shop's team, while the email and WhatsApp go to the customer. Writing
   * one recipient for all four rows tagged the staff inbox with the
   * customer's address.
   */
  const recipientFor = (channel: NotificationChannel): Recipient =>
    channel === 'internal'
      ? { ref: null, type: 'staff' }
      : { ref: (channel === 'whatsapp' ? ctx.customerPhone : ctx.customerEmail) || null, type: 'customer' }

  for (const channel of channels) {
    // A channel with nowhere to deliver is not an error and not a failure —
    // it simply does not apply to this customer.
    if (channel === 'email' && !ctx.customerEmail) continue
    if (channel === 'whatsapp' && !ctx.customerPhone) continue

    const claim = await claimNotification({
      channel,
      ctx,
      message: rendered.text,
      payload,
      recipient: recipientFor(channel),
      target,
      title: rendered.title,
    })

    if (!claim) {
      outcomes.push({ channel, status: 'duplicate' })
      continue
    }

    // The internal channel has no external delivery: writing the row *is*
    // the delivery. It is unread until someone marks it read.
    if (channel === 'internal') {
      await markNotification({ id: claim, payload, status: 'sent', target })
      outcomes.push({ channel, status: 'sent' })
      continue
    }

    // Deferred: the row is committed and owed, and the drain will carry it.
    // Left at `pending` with no error, which is the state the drain selects.
    if (defer) {
      outcomes.push({ channel, detail: 'differe', status: 'pending' })
      continue
    }

    let result: DeliveryResult
    if (channel === 'email') {
      result = await emailProvider.send({
        data: templateVariables(ctx),
        // Null for an event with no customer-facing design; the provider then
        // sends text only rather than an empty shell.
        html: renderEmailHtml(ctx) ?? undefined,
        subject: rendered.subject,
        template: rendered.emailTemplate,
        text: rendered.text,
        to: ctx.customerEmail,
      })
    } else if (channel === 'whatsapp') {
      result = await whatsappProvider.send({
        phone: String(ctx.customerPhone),
        template: rendered.whatsappTemplate,
        variables: templateVariables(ctx),
      })
    } else {
      result = await pushProvider.send({
        body: rendered.text,
        subscription: { auth: '', endpoint: '', p256dh: '' },
        title: rendered.title,
      })
    }

    if (result.ok) {
      await markNotification({ id: claim, payload, status: 'sent', target })
      outcomes.push({ channel, status: 'sent' })
    } else if (result.skipped) {
      // Stays `pending`, with the reason recorded. This is the honest state:
      // the message was composed and is owed to the customer, but no
      // provider exists to carry it. It is not `sent` and not `failed`.
      await markNotification({ error: result.reason, id: claim, payload, status: 'pending', target })
      outcomes.push({ channel, detail: result.reason, status: 'pending' })
    } else {
      await markNotification({ error: result.error, id: claim, payload, status: 'failed', target })
      outcomes.push({ channel, detail: result.error, status: 'failed' })
      payload.logger.warn(`Notification ${event}/${channel} échouée pour ${ctx.orderNumber}: ${result.error}`)
    }
  }

  return outcomes
}

/**
 * Claims the (order, event, channel) slot, returning the row id, or null if
 * another writer already holds it.
 *
 * Raw SQL rather than payload.create: only the database can settle the race,
 * and ON CONFLICT is how it does so in a single statement.
 */
type SqlTarget = Parameters<typeof runSql>[0]

async function claimNotification({
  channel,
  ctx,
  message,
  payload,
  recipient,
  target,
  title,
}: {
  channel: NotificationChannel
  ctx: NotificationContext
  message: string
  payload: Payload
  recipient: Recipient
  target: SqlTarget
  title: string
}): Promise<number | null> {
  const metadata = JSON.stringify({ orderNumber: ctx.orderNumber, status: ctx.status, total: ctx.total })

  try {
    const inserted = await runSql(
      target,
      sql`INSERT INTO notifications
            (order_id, customer_email, recipient_type, recipient_ref, type, channel, status,
             title, message, metadata, updated_at, created_at)
          VALUES (${ctx.orderId}, ${ctx.customerEmail},
                  ${recipient.type}::"enum_notifications_recipient_type", ${recipient.ref},
                  ${ctx.event}::"enum_notifications_type",
                  ${channel}::"enum_notifications_channel", 'pending', ${title}, ${message},
                  ${metadata}::jsonb, now(), now())
          ON CONFLICT (order_id, type, channel) DO NOTHING
          RETURNING id`,
    )

    if (inserted[0]) return Number(inserted[0].id)

    // Nothing inserted: either an identical notification already went out, or
    // a previous attempt failed. Retry only the failure.
    const retry = await runSql(
      target,
      sql`UPDATE notifications
             SET status = 'pending', error = NULL, updated_at = now()
           WHERE order_id = ${ctx.orderId}
             AND type = ${ctx.event}::"enum_notifications_type"
             AND channel = ${channel}::"enum_notifications_channel"
             AND status = 'failed'
           RETURNING id`,
    )
    if (retry[0]) return Number(retry[0].id)

    return null
  } catch (err) {
    payload.logger.error({ err }, `Notification non enregistrée (${ctx.event}/${channel})`)
    return null
  }
}

async function markNotification({
  error,
  id,
  payload,
  status,
  target,
}: {
  error?: string
  id: number
  payload: Payload
  status: NotificationStatus
  target: SqlTarget
}): Promise<void> {
  try {
    await runSql(
      target,
      sql`UPDATE notifications
             SET status = ${status}::"enum_notifications_status",
                 error = ${error ?? null},
                 sent_at = CASE WHEN ${status} = 'sent' THEN now() ELSE sent_at END,
                 updated_at = now()
           WHERE id = ${id}`,
    )
  } catch (err) {
    payload.logger.error({ err }, `Statut de notification ${id} non mis à jour`)
  }
}

/** Which channels currently have a working provider — surfaced in the admin
 * so an operator can see at a glance what is actually being delivered. */
export function channelAvailability(): { channel: NotificationChannel; configured: boolean; reason?: string }[] {
  return [
    { channel: 'internal', configured: true },
    {
      channel: 'email',
      configured: emailProvider.isConfigured(),
      reason: emailProvider.isConfigured() ? undefined : emailProvider.disabledReason(),
    },
    {
      channel: 'whatsapp',
      configured: whatsappProvider.isConfigured(),
      reason: whatsappProvider.isConfigured() ? undefined : whatsappProvider.disabledReason(),
    },
    {
      channel: 'push',
      configured: pushProvider.isConfigured(),
      reason: pushProvider.isConfigured() ? undefined : pushProvider.disabledReason(),
    },
  ]
}
