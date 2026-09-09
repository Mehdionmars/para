import { createHash } from 'crypto'
import type { Payload } from 'payload'

import {
  IdempotencyKeyConflictError,
  IdempotencyKeyInvalidError,
  IdempotencyKeyMissingError,
  IdempotencyRequestInProgressError,
} from './errors/checkout'
import {
  acquireLock,
  clearCachedResponse,
  getCachedResponse,
  isRedisConfigured,
  releaseLock,
  setCachedResponse,
} from '../services/redis'

/**
 * Idempotency for operations that must not happen twice.
 *
 * ## The problem
 *
 * /api/checkout decrements stock and creates an order. Send it twice and it
 * does both twice — and it gets sent twice routinely: an impatient double
 * click, a mobile connection that drops the response after the server has
 * committed, a browser retrying a request it never saw answered. The shopper
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
 *   state = 'failed'      -> the first attempt ended badly and said so; the
 *                            key is spent, and a retry needs a new one
 *
 * This is the same claim-by-unique-index pattern the notification service
 * already uses for "have I sent this?" (lib/notifications/service.ts). A
 * read-then-write "have I seen this key?" would let two concurrent replays
 * both find nothing and both proceed, which is the exact bug being fixed.
 *
 * ## Where Redis sits
 *
 * Above all of that, never underneath it. Redis answers a replay without
 * touching the pool, and its lock lets a loser discover it lost a few
 * milliseconds earlier. Remove Redis entirely and every guarantee in this
 * file still holds, because the guarantee is the composite primary key. See
 * services/redis.ts — every call there fails open for exactly this reason.
 *
 * The ordering rule that makes it safe: **nothing is written to Redis until
 * PostgreSQL has committed.** Caching a response before the commit would hand
 * a retry an order number for an order that may still roll back.
 *
 * ## The request hash, and the scope
 *
 * A key is bound to two things: the body it was first used with, and the
 * identity that used it.
 *
 * Reusing one key for a *different* cart is a client bug, and replaying the
 * first cart's response for it would silently tell the shopper an order was
 * placed that never was. Reusing one key across two *shoppers* is worse — the
 * second would be handed the first one's order number and total. Both are
 * rejected with 409 rather than replayed.
 *
 * The scope is stored and logged as a SHA-256, never in the clear. For guest
 * checkout the natural identity is the email address, and an idempotency
 * table full of plaintext customer emails is a PII store nobody decided to
 * create. Hashing costs nothing here: the column is only ever compared for
 * equality.
 */

export type IdempotencyClaim =
  | {
      outcome: 'claimed'
      finish: (statusCode: number, body: unknown) => Promise<void>
      abandon: () => Promise<void>
      markFailed: (reason: string) => Promise<void>
    }
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

/**
 * Deterministic hash of the request.
 *
 * `JSON.stringify` preserves insertion order, so two bodies that are the same
 * object with keys written in a different order would hash differently and a
 * legitimate retry would be rejected as a conflict. Sorting keys recursively
 * makes the hash a function of the request's *meaning* rather than of how the
 * client happened to serialise it.
 */
export function hashRequest(body: unknown): string {
  return createHash('sha256').update(stableStringify(body ?? null)).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
}

/** One-way, so the table and the logs never hold the identity itself. */
export function hashScope(identity: string | null | undefined): string {
  const value = identity?.trim().toLowerCase()
  if (!value) return ''
  return createHash('sha256').update(value).digest('hex')
}

/**
 * How long a completed key is replayable.
 *
 * Long enough to cover every realistic retry (a phone reconnecting, a user
 * refreshing a stalled tab), short enough that the table stays small. The
 * retention purge in /api/jobs/tick deletes past this, and `expires_at` on
 * the row is what it reads.
 */
export const IDEMPOTENCY_TTL_HOURS = 24

/** Structured, one shape, greppable. Never carries the scope in the clear or
 * anything from the request body — see the header comment. */
function log(
  payload: Payload,
  level: 'info' | 'warn',
  fields: { key: string; endpoint: string; status: string; detail?: string },
): void {
  const line = `[idempotency] key=${fields.key} endpoint=${fields.endpoint} status=${fields.status}${
    fields.detail ? ` detail=${fields.detail}` : ''
  }`
  if (level === 'warn') payload.logger.warn(line)
  else payload.logger.info(line)
}

export async function claimIdempotencyKey({
  body,
  endpoint,
  key,
  payload,
  scope,
  requireKey = false,
}: {
  body: unknown
  endpoint: string
  key: string | null
  payload: Payload
  /** Who is making the request — a user id, or the customer email for guest
   * checkout. Hashed before it is stored or logged. */
  scope?: string | null
  /** When true, a missing or malformed key is a 400 instead of an
   * unprotected pass-through. Off by default so an endpoint can adopt the
   * header without breaking clients that have not. */
  requireKey?: boolean
}): Promise<IdempotencyClaim> {
  if (!key) {
    if (requireKey) throw new IdempotencyKeyMissingError()
    // No key is not an error: the endpoint stays usable by any client that
    // has not adopted the header. It is simply unprotected, exactly as before.
    return { outcome: 'skip' }
  }
  if (!isValidKey(key)) {
    if (requireKey) throw new IdempotencyKeyInvalidError()
    return { outcome: 'skip' }
  }

  const requestHash = hashRequest(body)
  const scopeHash = hashScope(scope)

  // ---- Fast path: a completed response still in cache -------------------
  //
  // Checked before the pool is touched. A hit here is the common case for the
  // retry this whole file exists for — the client's second attempt usually
  // arrives seconds after the first committed.
  if (isRedisConfigured()) {
    const cached = await getCachedResponse(endpoint, key)
    if (cached) {
      if (cached.requestHash !== requestHash) {
        log(payload, 'warn', { endpoint, key, status: 'conflict', detail: 'cache_hash_mismatch' })
        return { outcome: 'mismatch' }
      }
      log(payload, 'info', { endpoint, key, status: 'duplicate', detail: 'redis_hit' })
      return {
        outcome: 'replay',
        response: Response.json(cached.body, {
          headers: { 'Idempotent-Replay': 'true' },
          status: cached.status || 200,
        }),
      }
    }
    log(payload, 'info', { endpoint, key, status: 'redis_miss' })
  }

  // Best-effort. Never gated on: a null token means "someone else holds it"
  // *or* "Redis is unavailable", and the Postgres claim below settles both
  // correctly on its own.
  const lockToken = await acquireLock(endpoint, key)

  let client

  try {
    client = await payload.db.pool.connect()

    const claimed = await client.query(
      `INSERT INTO idempotency_keys (key, endpoint, state, request_hash, scope, expires_at)
            VALUES ($1, $2, 'in_progress', $3, $4, now() + ($5 || ' hours')::interval)
       ON CONFLICT (endpoint, key) DO NOTHING
         RETURNING key`,
      [key, endpoint, requestHash, scopeHash, String(IDEMPOTENCY_TTL_HOURS)],
    )

    if ((claimed.rowCount ?? 0) > 0) {
      log(payload, 'info', { endpoint, key, status: 'processing' })

      const finalise = async (
        state: 'completed' | 'failed',
        statusCode: number | null,
        responseBody: unknown,
      ): Promise<void> => {
        const c = await payload.db.pool.connect()
        try {
          await c.query(
            `UPDATE idempotency_keys
                SET state = $1, status_code = $2, response = $3::jsonb, completed_at = now()
              WHERE endpoint = $4 AND key = $5`,
            [state, statusCode, JSON.stringify(responseBody ?? null), endpoint, key],
          )
        } catch (err) {
          // The operation itself already succeeded and committed. Failing to
          // record that only costs replay protection on a retry; it must
          // never turn a completed order into an error.
          payload.logger.error({ err }, `[idempotency] key=${key} endpoint=${endpoint} status=persist_failed`)
        } finally {
          c.release()
        }
      }

      return {
        outcome: 'claimed',

        /** Records the outcome so a later replay can be answered without
         * re-running anything. Postgres first, then Redis — the cache must
         * never lead the commit. */
        finish: async (statusCode, responseBody) => {
          await finalise('completed', statusCode, responseBody)
          await setCachedResponse(endpoint, key, { body: responseBody, requestHash, status: statusCode })
          if (lockToken) await releaseLock(endpoint, key, lockToken)
          log(payload, 'info', { endpoint, key, status: 'completed' })
        },

        /** Releases the key when the operation did NOT happen — a validation
         * failure, an out-of-stock 409. Without this a shopper who fixes
         * their cart and retries with the same key would be told their
         * original attempt is still in progress, forever. */
        abandon: async () => {
          const c = await payload.db.pool.connect()
          try {
            await c.query(
              `DELETE FROM idempotency_keys WHERE endpoint = $1 AND key = $2 AND state = 'in_progress'`,
              [endpoint, key],
            )
          } catch {
            // Left behind, it expires with the retention purge.
          } finally {
            c.release()
          }
          await clearCachedResponse(endpoint, key)
          if (lockToken) await releaseLock(endpoint, key, lockToken)
          log(payload, 'info', { endpoint, key, status: 'abandoned' })
        },

        /** For a failure the client must not simply retry into — the
         * operation may have partially happened, so the key is kept and
         * marked rather than released. A retry gets 409 and has to use a new
         * key, which is the honest answer when we cannot promise the first
         * attempt left nothing behind. */
        markFailed: async (reason: string) => {
          await finalise('failed', 500, { error: reason })
          if (lockToken) await releaseLock(endpoint, key, lockToken)
          log(payload, 'warn', { endpoint, key, status: 'failed' })
        },
      }
    }

    // Lost the race, or this is a genuine replay.
    const existing = await client.query(
      `SELECT state, status_code, response, request_hash, scope
         FROM idempotency_keys
        WHERE endpoint = $1 AND key = $2`,
      [endpoint, key],
    )
    const row = existing.rows[0]
    if (!row) {
      // The row was purged between the failed insert and this read. Nothing
      // to replay and nothing to conflict with.
      log(payload, 'warn', { endpoint, key, status: 'vanished' })
      return { outcome: 'skip' }
    }

    // Scope before hash: a different customer is a more serious mismatch than
    // a different cart, and conflating them in the log would hide it.
    if ((row.scope ?? '') !== scopeHash) {
      log(payload, 'warn', { endpoint, key, status: 'conflict', detail: 'scope_mismatch' })
      return { outcome: 'mismatch' }
    }
    if (row.request_hash !== requestHash) {
      log(payload, 'warn', { endpoint, key, status: 'conflict', detail: 'hash_mismatch' })
      return { outcome: 'mismatch' }
    }
    if (row.state === 'in_progress') {
      log(payload, 'info', { endpoint, key, status: 'in_progress' })
      return { outcome: 'in_progress' }
    }
    if (row.state !== 'completed') {
      // 'failed'. The first attempt is over and did not succeed; replaying
      // its error would be honest but useless, and letting the retry run
      // would re-enter an operation we could not prove was clean.
      log(payload, 'warn', { endpoint, key, status: 'spent' })
      return { outcome: 'mismatch' }
    }

    log(payload, 'info', { endpoint, key, status: 'duplicate', detail: 'pg_hit' })

    // Warm the cache for the next retry of the same key. Safe: this row is
    // already committed and completed.
    await setCachedResponse(endpoint, key, {
      body: row.response,
      requestHash,
      status: Number(row.status_code) || 200,
    })

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
    payload.logger.warn({ err }, `[idempotency] key=${key} endpoint=${endpoint} status=store_unavailable`)
    return { outcome: 'skip' }
  } finally {
    client?.release()
    // The lock is released on every terminal path above; this covers the
    // throw. Releasing a token we no longer own is a no-op by construction.
    if (lockToken) await releaseLock(endpoint, key, lockToken).catch(() => {})
  }
}

export function inProgressResponse(): Response {
  return new IdempotencyRequestInProgressError().toResponse()
}

/**
 * 409, not the 422 this used to answer.
 *
 * 422 frames a reused key as a validation problem with the cart; it is not —
 * the cart may be perfectly valid. The conflict is with a request that
 * already exists under this key, which is what 409 means and what a client
 * library implementing the Idempotency-Key convention expects to see.
 */
export function mismatchResponse(): Response {
  return new IdempotencyKeyConflictError().toResponse()
}
