import { createHash } from 'crypto'
import type { Payload } from 'payload'

/**
 * Idempotency for operations that must not happen twice.
 *
 * ## The problem
 *
 * /api/checkout decrements stock and creates an order. Send it twice and it
 * does both twice — and it gets sent twice routinely: an impatient double
 * click, a mobile connection that drops the response after the
 * server has committed, a browser retrying a request it never saw answered. The shopper
 * sees one failure and one charge, or two orders and twice the stock gone.
 * No amount of care inside the transaction helps, because both requests are
 * individually valid.
 *
 * ## The mechanism
 *
 * The client sends an `Idempotency-Key` it generates once per checkout
 * attempt. The server claims it:
 *
 *   INSERT INTO idempotency_keys (...) VALUES (...) ON CONFLICT DO NOTHING RETURNING key
 *
 * Exactly one caller gets a row back — that one runs the operation and stores
 * its response. Everyone else lost the race and reads the existing row:
 *
 *   state = 'completed'   -> replay the stored response verbatim
 *   state = 'in_progress' -> the first attempt is still running; answer 409
 *                            rather than let a second checkout race it
 *
 * This is the same claim-by-unique-index pattern the notification service
 * already uses for "have I sent this?" (lib/notifications/service.ts). A
 * read-then-write "have I seen this key?" would let two concurrent replays
 * both find nothing and both proceed, which is the exact bug being fixed.
 *
 * ## The request hash
 *
 * A key is also bound to the body it was first used with. Reusing one key for
 * a *different* cart is a client bug, and replaying the first cart's response
 * for it would silently tell the shopper an order was placed that never was.
 * That case is rejected loudly instead.
 */

export type IdempotencyClaim =
  | { outcome: 'claimed'; finish: (statusCode: number, body: unknown) => Promise<void>; abandon: () => Promise<void> }
  | { outcome: 'replay'; response: Response }
  | { outcome: 'in_progress' }
  | { outcome: 'mismatch' }
  /** No key supplied, or the store is unavailable — proceed unprotected. */
  | { outcome: 'skip' }

/** Keys are opaque to us; only their length and shape are constrained, so a
 * client cannot use the column as storage or collide by accident. */
export function isValidKey(key: string): boolean {
  return key.length >= 8 && key.length <= 200 && /^[A-Za-z0-9_.:-]+$/.test(key)
}

function hashRequest(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex').slice(0, 64)
}

/**
 * How long a completed key is replayable.
 *
 * Long enough to cover every realistic retry (a phone reconnecting, a user
 * refreshing a stalled tab), short enough that the table stays small. The
 * retention purge in /api/jobs/tick deletes past this.
 */
export const IDEMPOTENCY_TTL_HOURS = 24

export async function claimIdempotencyKey({
  body,
  endpoint,
  key,
  payload,
}: {
  body: unknown
  endpoint: string
  key: string | null
  payload: Payload
}): Promise<IdempotencyClaim> {
  // No key is not an error: the endpoint stays usable by any client that has
  // not adopted the header. It is simply unprotected, exactly as before.
  if (!key || !isValidKey(key)) return { outcome: 'skip' }

  const requestHash = hashRequest(body)
  let client

  try {
    client = await payload.db.pool.connect()

    const claimed = await client.query(
      `INSERT INTO idempotency_keys (key, endpoint, state, request_hash)
            VALUES ($1, $2, 'in_progress', $3)
       ON CONFLICT (endpoint, key) DO NOTHING
         RETURNING key`,
      [key, endpoint, requestHash],
    )

    if ((claimed.rowCount ?? 0) > 0) {
      return {
        outcome: 'claimed',

        /** Records the outcome so a later replay can be answered without
         * re-running anything. */
        finish: async (statusCode, responseBody) => {
          const c = await payload.db.pool.connect()
          try {
            await c.query(
              `UPDATE idempotency_keys
                  SET state = 'completed', status_code = $1, response = $2::jsonb, completed_at = now()
                WHERE endpoint = $3 AND key = $4`,
              [statusCode, JSON.stringify(responseBody), endpoint, key],
            )
          } catch (err) {
            // The operation itself already succeeded and committed. Failing
            // to record that only costs replay protection on a retry; it must
            // never turn a completed order into an error.
            payload.logger.error({ err }, `Idempotency: réponse non enregistrée pour ${endpoint}/${key}`)
          } finally {
            c.release()
          }
        },

        /** Releases the key when the operation did NOT happen — a validation
         * failure, an out-of-stock 409. Without this a shopper who fixes
         * their cart and retries with the same key would be told their
         * original attempt is still in progress, forever. */
        abandon: async () => {
          const c = await payload.db.pool.connect()
          try {
            await c.query(`DELETE FROM idempotency_keys WHERE endpoint = $1 AND key = $2 AND state = 'in_progress'`, [
              endpoint,
              key,
            ])
          } catch {
            // Left behind, it expires with the retention purge.
          } finally {
            c.release()
          }
        },
      }
    }

    // Lost the race, or this is a genuine replay.
    const existing = await client.query(
      `SELECT state, status_code, response, request_hash FROM idempotency_keys WHERE endpoint = $1 AND key = $2`,
      [endpoint, key],
    )
    const row = existing.rows[0]
    if (!row) return { outcome: 'skip' }

    if (row.request_hash !== requestHash) return { outcome: 'mismatch' }
    if (row.state !== 'completed') return { outcome: 'in_progress' }

    return {
      outcome: 'replay',
      response: Response.json(row.response, {
        // Marked so a client (and anyone reading a HAR) can tell a replay
        // from a fresh execution.
        headers: { 'Idempotent-Replay': 'true' },
        status: Number(row.status_code) || 200,
      }),
    }
  } catch (err) {
    // Fail open, like the rate limiter: an unavailable idempotency table must
    // not stop people ordering. The window it protects is seconds wide and
    // the pre-existing behaviour is what they fall back to.
    payload.logger.warn({ err }, `Idempotency indisponible pour ${endpoint}`)
    return { outcome: 'skip' }
  } finally {
    client?.release()
  }
}

export function inProgressResponse(): Response {
  return Response.json(
    { error: 'Cette commande est déjà en cours de traitement. Patientez quelques instants.' },
    { status: 409 },
  )
}

export function mismatchResponse(): Response {
  return Response.json(
    { error: 'Clé d’idempotence déjà utilisée pour un panier différent.' },
    { status: 422 },
  )
}
