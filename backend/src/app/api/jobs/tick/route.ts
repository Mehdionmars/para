import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { serverError } from '../../../../lib/apiError'
import { IDEMPOTENCY_TTL_HOURS } from '../../../../lib/idempotency'
import { emailProvider, pushProvider, whatsappProvider } from '../../../../lib/notifications/providers'
import { MAX_ATTEMPTS, retryNotificationDelivery } from '../../../../lib/notifications/retry'

export const maxDuration = 60

/**
 * The background worker, as an endpoint.
 *
 * There is no long-lived process to put a worker in: the backend is deployed
 * to Vercel, where every request is a fresh serverless invocation and nothing
 * survives between them. `setInterval` in module scope would run on whichever
 * instances happened to be warm, zero of them when traffic is quiet, and
 * several at once when it is not.
 *
 * So the loop lives outside and calls in. This endpoint is idempotent, bounded
 * and safe to invoke concurrently — every unit of work it does is claimed
 * with a guarded UPDATE, so two overlapping ticks cannot send the same email
 * twice or process the same row twice. Point Vercel Cron at it, or Cloudflare,
 * or a plain `curl` in a crontab; none of them need to know anything about it
 * beyond the schedule.
 *
 *   POST /api/jobs/tick
 *   Authorization: Bearer $JOBS_SECRET
 *
 * Same bearer-secret shape as /api/instagram-sync, which already exists for
 * exactly this reason.
 *
 * ## What it does, and why each piece is bounded
 *
 * Every batch has a hard ceiling. A tick that tried to drain everything would
 * eventually exceed the platform's 60-second limit and be killed *midway*,
 * which is the one shape of failure worth designing against: work must be
 * resumable, so it is better to finish 50 items and return than to attempt
 * 5000 and be terminated at an unknown point.
 */

/** Enough to keep up with a busy shop at a one-minute schedule, small enough
 * to finish comfortably inside maxDuration even if the provider is slow. */
const NOTIFICATION_BATCH = 50

/** Request logs are diagnostic, not records. A month is longer than any
 * incident investigation and short enough that the table stays small. */
const API_LOG_RETENTION_DAYS = 30

type TickResult = {
  notifications: { attempted: number; failed: number; sent: number }
  purged: { apiLogs: number; idempotencyKeys: number; rateLimits: number }
}

/**
 * Delivers what the checkout deferred.
 *
 * Rows are selected `FOR UPDATE SKIP LOCKED`, which is what makes concurrent
 * ticks safe: a row another tick is already working on is skipped rather than
 * waited on, so two overlapping runs split the queue instead of duplicating
 * it or deadlocking on it.
 *
 * `attempts < MAX_ATTEMPTS` is the poison-message guard. Without it, an
 * address that will never accept mail is retried on every tick forever, and
 * one bad row starves the rest of the batch.
 */
async function drainNotifications(payload: Payload): Promise<TickResult['notifications']> {
  // Only channels that can actually deliver.
  //
  // `retryNotificationDelivery` treats an unconfigured provider as a
  // consumed attempt — correct for the dashboard's manual retry button,
  // where an operator did ask and deserves to see the reason, but wrong
  // here. An automatic drain running every minute against an unconfigured
  // provider would burn all MAX_ATTEMPTS within three minutes and mark the
  // entire backlog permanently undeliverable — so the day the keys are
  // finally added, every message owed up to that point would already have
  // been written off. Skipping the channel leaves those rows untouched and
  // still owed.
  const deliverable = [
    emailProvider.isConfigured() ? 'email' : null,
    whatsappProvider.isConfigured() ? 'whatsapp' : null,
    pushProvider.isConfigured() ? 'push' : null,
  ].filter((c): c is string => c !== null)

  if (deliverable.length === 0) return { attempted: 0, failed: 0, sent: 0 }

  // Staff alerts store no address of their own — they fall back to
  // STOCK_ALERT_EMAIL. When that is unset they can never resolve a recipient.
  const staffAddressConfigured = Boolean(process.env.STOCK_ALERT_EMAIL?.trim())

  const client = await payload.db.pool.connect()
  let ids: number[] = []

  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT id FROM notifications
        -- channel is a Postgres enum (enum_notifications_channel), so it has
        -- to be cast before comparing against a text array. Without the cast
        -- the predicate matches nothing and the drain reports a clean, empty
        -- run forever.
        WHERE channel::text = ANY($1::text[])
          AND status IN ('pending', 'failed')
          AND COALESCE(attempts, 0) < $2
          -- Only rows that can actually resolve a recipient, mirroring the
          -- fallback chain in notifications/retry.ts. A row with nowhere to
          -- go returns 'no-recipient' WITHOUT consuming an attempt, so it
          -- would be re-selected on every tick forever — and because the
          -- batch is ordered oldest-first, a backlog of them permanently
          -- starves every deliverable message behind it. Excluding them here
          -- is what keeps the queue moving; they become deliverable again the
          -- moment STOCK_ALERT_EMAIL is set.
          AND (
            COALESCE(NULLIF(recipient_ref, ''), NULLIF(customer_email, '')) IS NOT NULL
            OR (recipient_type = 'staff' AND channel = 'email' AND $4::boolean)
          )
        ORDER BY created_at
          FOR UPDATE SKIP LOCKED
        LIMIT $3`,
      [deliverable, MAX_ATTEMPTS, NOTIFICATION_BATCH, staffAddressConfigured],
    )
    ids = rows.map((r) => Number(r.id))
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    payload.logger.error({ err }, 'Drain des notifications : sélection échouée')
    return { attempted: 0, failed: 0, sent: 0 }
  } finally {
    client.release()
  }

  let sent = 0
  let failed = 0

  // Sequential on purpose. The pool is deliberately small for serverless
  // (see payload.config.ts), and firing 50 concurrent provider calls would
  // both exhaust it and hand the provider a burst it may rate-limit.
  for (const id of ids) {
    const outcome = await retryNotificationDelivery({ id, payload }).catch((err) => {
      payload.logger.error({ err }, `Drain: notification ${id} en erreur`)
      return null
    })
    if (outcome?.ok) sent += 1
    else failed += 1
  }

  return { attempted: ids.length, failed, sent }
}

/**
 * Retention.
 *
 * All three tables here grow with traffic and none of them holds anything of
 * record: request logs are diagnostics, rate-limit rows are counters for a
 * window that has closed, and idempotency keys stop being replayable once
 * their window passes. Left alone they grow without limit — `api_request_logs`
 * fastest of all, since it gains a row per sampled request.
 */
async function purge(payload: Payload): Promise<TickResult['purged']> {
  const client = await payload.db.pool.connect()
  try {
    const logs = await client.query(
      `DELETE FROM api_request_logs WHERE created_at < now() - ($1 || ' days')::interval`,
      [API_LOG_RETENTION_DAYS],
    )
    // Anything older than one window can never be read again: the bucket key
    // includes its own window start.
    const limits = await client.query(`DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour'`)
    const keys = await client.query(
      `DELETE FROM idempotency_keys WHERE created_at < now() - ($1 || ' hours')::interval`,
      [IDEMPOTENCY_TTL_HOURS],
    )
    return {
      apiLogs: logs.rowCount ?? 0,
      idempotencyKeys: keys.rowCount ?? 0,
      rateLimits: limits.rowCount ?? 0,
    }
  } catch (err) {
    // A failed purge is a housekeeping problem, not a reason to fail the
    // tick — the notification drain above has already done the useful work.
    payload.logger.error({ err }, 'Purge de rétention échouée')
    return { apiLogs: 0, idempotencyKeys: 0, rateLimits: 0 }
  } finally {
    client.release()
  }
}

async function handlePOST(request: Request) {
  const secret = process.env.JOBS_SECRET?.trim()

  // Refuses outright rather than defaulting to open. An unauthenticated drain
  // endpoint lets anyone force provider traffic and delete retention data.
  if (!secret) {
    return Response.json({ error: 'JOBS_SECRET non configuré.' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const notifications = await drainNotifications(payload)
    const purged = await purge(payload)

    // Logged as one structured line so a scheduler's history doubles as a
    // record of what the background work has been doing.
    payload.logger.info(
      { notifications, purged },
      `Tick: ${notifications.sent} notification(s) envoyée(s), ${notifications.failed} échec(s)`,
    )

    return Response.json({ notifications, ok: true, purged } satisfies TickResult & { ok: true })
  } catch (err) {
    return serverError({ context: 'Tick des jobs échoué', err, payload })
  }
}

export const POST = handlePOST

/** GET is accepted too: several schedulers (Vercel Cron among them) only
 * issue GET requests. Same secret, same work. */
export const GET = handlePOST
