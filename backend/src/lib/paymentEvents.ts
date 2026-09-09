import { createHash } from 'crypto'
import type { Payload } from 'payload'

import type { PaymentEventProvider } from '../collections/PaymentEvents'

/**
 * The once-and-only-once guard for payment webhooks.
 *
 * A provider delivering `evt_123` three times must produce one confirmed
 * payment, one invoice, one status change, one email — and two no-ops. This
 * is the only place that decision is made, so a second provider added later
 * inherits it instead of reimplementing it.
 *
 * ## Insert first, ask later
 *
 * The claim is the insert:
 *
 *   INSERT INTO payment_events (provider, provider_event_id, ...)
 *   ON CONFLICT (provider, provider_event_id) DO NOTHING RETURNING id
 *
 * A row back means this delivery is the first and the caller owns the work.
 * No row means someone else already claimed it — possibly milliseconds ago,
 * on another instance, which is exactly the case a `SELECT` first would miss.
 * Two simultaneous deliveries of one event would both find nothing and both
 * proceed; the unique index is what makes that impossible rather than
 * unlikely.
 *
 * Raw SQL rather than `payload.create`, for the same reason lib/idempotency.ts
 * uses it: the Local API has no way to express ON CONFLICT, so the alternative
 * is to create and catch a unique-violation — which works, but leaves a
 * failed transaction and an error log for every ordinary duplicate. A retry
 * is not an error.
 */

export type WebhookClaim =
  | { outcome: 'claimed'; eventId: number; markProcessed: (orderId?: number) => Promise<void>; markFailed: (reason: string) => Promise<void> }
  | { outcome: 'duplicate' }

/** Proves two deliveries carried the same body without storing either. */
export function hashPayload(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/** The answer a provider gets for a delivery that was already handled. 200,
 * always: a 4xx here tells the provider to keep retrying an event we have
 * fully processed, and most of them will, for hours. */
export function duplicateWebhookResponse(): Response {
  return Response.json({ received: true, duplicate: true }, { status: 200 })
}

export async function claimPaymentEvent({
  eventType,
  payload,
  provider,
  providerEventId,
  rawBody,
}: {
  eventType?: string | null
  payload: Payload
  provider: PaymentEventProvider
  providerEventId: string
  /** The exact bytes received, hashed and discarded — never stored. */
  rawBody?: string
}): Promise<WebhookClaim> {
  const client = await payload.db.pool.connect()

  try {
    const claimed = await client.query(
      `INSERT INTO payment_events (provider, provider_event_id, event_type, status, payload_hash, received_at, created_at, updated_at)
            VALUES ($1, $2, $3, 'received', $4, now(), now(), now())
       ON CONFLICT (provider, provider_event_id) DO NOTHING
         RETURNING id`,
      [provider, providerEventId, eventType ?? null, rawBody ? hashPayload(rawBody) : null],
    )

    if ((claimed.rowCount ?? 0) === 0) {
      payload.logger.info(
        `[payment-event] provider=${provider} event=${providerEventId} status=duplicate`,
      )
      return { outcome: 'duplicate' }
    }

    const eventId = Number(claimed.rows[0].id)
    payload.logger.info(`[payment-event] provider=${provider} event=${providerEventId} status=claimed`)

    return {
      outcome: 'claimed',
      eventId,

      markProcessed: async (orderId?: number) => {
        const c = await payload.db.pool.connect()
        try {
          await c.query(
            `UPDATE payment_events
                SET status = 'processed', processed_at = now(), updated_at = now(), order_id = COALESCE($1, order_id)
              WHERE id = $2`,
            [orderId ?? null, eventId],
          )
          payload.logger.info(
            `[payment-event] provider=${provider} event=${providerEventId} status=processed`,
          )
        } catch (err) {
          // The side effects already happened. Losing the bookkeeping means a
          // later delivery of the same event still short-circuits on the
          // unique index — the row exists, which is what dedup reads.
          payload.logger.error({ err }, `[payment-event] event=${providerEventId} status=persist_failed`)
        } finally {
          c.release()
        }
      },

      markFailed: async (reason: string) => {
        const c = await payload.db.pool.connect()
        try {
          await c.query(
            `UPDATE payment_events
                SET status = 'failed', failure_reason = $1, processed_at = now(), updated_at = now()
              WHERE id = $2`,
            // Truncated to the column width, and it is a reason we wrote —
            // never a provider string, which can carry merchant identifiers.
            [reason.slice(0, 500), eventId],
          )
        } catch {
          // Nothing further to do: the claim row stands, which is what stops
          // a redelivery from re-running the work.
        } finally {
          c.release()
        }
        payload.logger.warn(`[payment-event] provider=${provider} event=${providerEventId} status=failed`)
      },
    }
  } finally {
    client.release()
  }
}
