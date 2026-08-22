import type { Payload, PayloadRequest } from 'payload'

import { runSql, sql } from '../db/exec'
import { emailProvider } from './providers'
import type { StockNotificationEvent } from './types'

/**
 * Stock alerts, emitted on *threshold crossings* rather than on stock writes.
 *
 * The distinction is the whole point. A product sitting at 3 units with a
 * threshold of 5 is already low; every subsequent sale would otherwise raise
 * another LOW_STOCK, and the operator would learn to ignore the alert. So an
 * event fires only when the stock level moves across a boundary:
 *
 *   LOW_STOCK      previous >  threshold  →  new <= threshold  (and new > 0)
 *   OUT_OF_STOCK   previous >  0          →  new === 0
 *   BACK_IN_STOCK  previous === 0         →  new >  0
 *
 * Because the condition is a transition, it is naturally self-limiting: a
 * product can only cross downward once until something restocks it. The
 * dedupe key adds a second guard against the same *stock movement* being
 * processed twice (a retried request, a replayed hook).
 *
 * Callers just report what changed. They know nothing about channels,
 * templates or providers — that stays here, exactly as it does for order
 * events.
 */

export type StockChange = {
  productId: number
  productName: string
  previousStock: number
  newStock: number
  lowStockThreshold: number
  /** Identifies this specific change, so a replay cannot double-notify.
   * The stock-movement row id where one exists; otherwise a caller-supplied
   * discriminator. */
  occurrenceId: string | number
}

export function detectStockEvent(change: {
  previousStock: number
  newStock: number
  lowStockThreshold: number
}): StockNotificationEvent | null {
  const { lowStockThreshold: threshold, newStock, previousStock } = change

  if (previousStock > 0 && newStock === 0) return 'OUT_OF_STOCK'
  if (previousStock === 0 && newStock > 0) return 'BACK_IN_STOCK'
  // Strictly a crossing: `previous > threshold` excludes a product that was
  // already at or below it.
  if (previousStock > threshold && newStock <= threshold && newStock > 0) return 'LOW_STOCK'
  return null
}

const COPY: Record<StockNotificationEvent, (c: StockChange) => { title: string; message: string }> = {
  BACK_IN_STOCK: (c) => ({
    message: `« ${c.productName} » est de nouveau disponible (${c.newStock} unité${c.newStock > 1 ? 's' : ''}).`,
    title: `Réapprovisionné : ${c.productName}`,
  }),
  LOW_STOCK: (c) => ({
    message: `« ${c.productName} » est passé sous son seuil d'alerte : ${c.newStock} unité${c.newStock > 1 ? 's' : ''} restante${c.newStock > 1 ? 's' : ''} (seuil ${c.lowStockThreshold}).`,
    title: `Stock faible : ${c.productName}`,
  }),
  OUT_OF_STOCK: (c) => ({
    message: `« ${c.productName} » est en rupture de stock et n'est plus vendable.`,
    title: `Rupture : ${c.productName}`,
  }),
}

/**
 * Which channels each stock event uses.
 *
 * There is no vendor role in this project, so "vendor" alerts land on the
 * staff who actually act on stock — the same in-app inbox the order events
 * use. Email is attempted for the two events that need acting on today;
 * BACK_IN_STOCK is informational and stays in-app.
 */
const CHANNELS: Record<StockNotificationEvent, ('internal' | 'email')[]> = {
  BACK_IN_STOCK: ['internal'],
  LOW_STOCK: ['internal', 'email'],
  OUT_OF_STOCK: ['internal', 'email'],
}

/** Where staff stock alerts are emailed. Unset means the email channel is
 * skipped rather than sent somewhere arbitrary. */
const stockAlertRecipient = () => process.env.STOCK_ALERT_EMAIL?.trim() || ''

export async function notifyStockChange({
  change,
  payload,
  req,
}: {
  change: StockChange
  payload: Payload
  req?: PayloadRequest
}): Promise<{ event: string | null; created: number }> {
  const event = detectStockEvent(change)
  if (!event) return { created: 0, event: null }

  const target = req ?? { payload }
  const { message, title } = COPY[event](change)
  const recipient = stockAlertRecipient()
  let created = 0

  for (const channel of CHANNELS[event]) {
    // The occurrence, not the product: a second crossing later must alert
    // again, while a replay of this one must not.
    const dedupeKey = `product:${change.productId}:${event}:${change.occurrenceId}:${channel}`

    try {
      const inserted = await runSql(
        target,
        sql`INSERT INTO notifications
              (product_id, recipient_type, recipient_ref, type, channel, status, title, message,
               metadata, dedupe_key, updated_at, created_at)
            VALUES (${change.productId},
                    -- Stock is always the shop's own business: both channels
                    -- go to staff. The internal inbox is shared (no ref); the
                    -- email goes to the configured alert address.
                    'staff'::"enum_notifications_recipient_type",
                    ${channel === 'internal' ? null : recipient || null},
                    ${event}::"enum_notifications_type",
                    ${channel}::"enum_notifications_channel", 'pending', ${title}, ${message},
                    ${JSON.stringify({
                      newStock: change.newStock,
                      previousStock: change.previousStock,
                      threshold: change.lowStockThreshold,
                    })}::jsonb,
                    ${dedupeKey}, now(), now())
            -- The predicate is repeated on purpose: the dedupe index is a
            -- PARTIAL unique index (WHERE dedupe_key IS NOT NULL), and
            -- Postgres only matches an ON CONFLICT target to a partial index
            -- when the statement restates the same condition.
            ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
            RETURNING id`,
      )

      const row = inserted[0]
      if (!row) continue
      created++
      const id = Number(row.id)

      if (channel === 'internal') {
        await runSql(
          target,
          sql`UPDATE notifications SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = ${id}`,
        )
        continue
      }

      if (!recipient) {
        await runSql(
          target,
          sql`UPDATE notifications
                 SET error = 'STOCK_ALERT_EMAIL non configuré — alerte conservée en interne.', updated_at = now()
               WHERE id = ${id}`,
        )
        continue
      }

      const result = await emailProvider.send({
        data: { newStock: String(change.newStock), product: change.productName },
        subject: title,
        template: event.toLowerCase().replace(/_/g, '-'),
        text: message,
        to: recipient,
      })

      if (result.ok) {
        await runSql(
          target,
          sql`UPDATE notifications SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = ${id}`,
        )
      } else {
        // `skipped` means no provider is configured: the alert is owed but
        // undeliverable, which is `pending` — never `sent`.
        const status = result.skipped ? 'pending' : 'failed'
        const detail = result.skipped ? result.reason : result.error
        await runSql(
          target,
          sql`UPDATE notifications
                 SET status = ${status}::"enum_notifications_status", error = ${detail}, updated_at = now()
               WHERE id = ${id}`,
        )
      }
    } catch (err) {
      // A stock alert must never fail the sale, the restock or the bulk edit
      // that produced it.
      payload.logger.error({ err }, `Alerte stock ${event} non enregistrée pour le produit ${change.productId}`)
    }
  }

  return { created, event }
}
