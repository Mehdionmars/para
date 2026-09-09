import Redis from 'ioredis'

/**
 * Redis, as a cache and a lock — never as a source of truth.
 *
 * ## What this is for, and what it is not for
 *
 * The idempotency guarantee lives in PostgreSQL: `idempotency_keys` has a
 * composite primary key and the claim is a single `INSERT … ON CONFLICT DO
 * NOTHING`, so exactly one concurrent request wins regardless of what Redis
 * does. That is the whole protection, and it is already correct without a
 * line of this file.
 *
 * What Redis adds is a shortcut. A retry that arrives while the response is
 * still cached is answered from memory instead of connecting a pool client
 * and querying, and a lock lets a second request discover "someone is already
 * on this key" without waiting on Postgres. Both are optimisations over a
 * correct baseline.
 *
 * Which is why every function here fails open. An unreachable Redis makes
 * checkout slightly slower; it must never make checkout fail, or refuse an
 * order, or — worst of all — let a duplicate through. If you ever find
 * yourself relying on a value from this module to decide whether an order may
 * be placed, the decision belongs in Postgres instead.
 *
 * ## Optional by construction
 *
 * `REDIS_URL` unset means "no Redis", not "broken config". The module becomes
 * a set of no-ops that report a miss, and the Postgres path carries
 * everything exactly as it did before this file existed. That is what lets
 * the same code run in CI, in a local checkout with no container, and on a
 * box where the Redis service has been stopped.
 */

const REDIS_URL = process.env.REDIS_URL?.trim() || ''

/** How long a completed response stays replayable from cache. Mirrors
 * IDEMPOTENCY_TTL_HOURS in lib/idempotency.ts — Postgres remains replayable
 * for the same window, so an expired cache entry is a miss, never a wrong
 * answer. */
export const IDEMPOTENCY_TTL_SECONDS = Number(process.env.IDEMPOTENCY_TTL_SECONDS) || 86_400

/** How long a lock is held before Redis expires it on its own. Sized above
 * the slowest realistic checkout (stock transaction, order write, coupon
 * redemption) so a live request is never unlocked underneath itself, and low
 * enough that a process killed mid-checkout does not park the key for long.
 * The Postgres row is what actually blocks a duplicate in that window. */
export const REDIS_LOCK_TTL_MS = Number(process.env.REDIS_LOCK_TTL_MS) || 15_000

export const responseKey = (endpoint: string, key: string): string => `idempotency:response:${endpoint}:${key}`
export const lockKey = (endpoint: string, key: string): string => `idempotency:lock:${endpoint}:${key}`

/**
 * Releasing a lock is a compare-and-delete, never a bare DEL.
 *
 * A plain `DEL` is a real bug and not a theoretical one: request A takes the
 * lock, stalls past the TTL, Redis expires the key, request B takes a fresh
 * lock — and A then finishes and deletes B's lock, leaving the key
 * unprotected while B is still working. Deleting only when the stored token
 * is still ours closes that, and it has to be one atomic step, which is what
 * the script is for.
 */
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`

export type CachedIdempotentResponse = {
  requestHash: string
  status: number
  body: unknown
}

let client: Redis | null = null
let disabledReason: string | null = REDIS_URL ? null : 'REDIS_URL non défini'

/** Lazily connected, so importing this module never opens a socket — module
 * scope runs during `next build` too, where nothing should dial out. */
function getClient(): Redis | null {
  if (!REDIS_URL || disabledReason) return client
  if (client) return client

  client = new Redis(REDIS_URL, {
    // One retry, then give up and let the caller fall through to Postgres.
    // The default is an unbounded backoff that would hold a checkout request
    // open while it reconnects — precisely the wrong trade for a cache.
    maxRetriesPerRequest: 1,
    connectTimeout: 1_000,
    commandTimeout: 1_000,
    enableOfflineQueue: false,
    lazyConnect: false,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1_000)),
  })

  // An error event with no listener is an unhandled exception in Node, which
  // would take the process down over a cache being unavailable.
  client.on('error', () => {})

  return client
}

/** Every call goes through here: a Redis failure resolves to the fallback
 * rather than rejecting, so no call site needs its own try/catch to stay
 * correct. */
async function safely<T>(fallback: T, run: (redis: Redis) => Promise<T>): Promise<T> {
  const redis = getClient()
  if (!redis) return fallback
  try {
    return await run(redis)
  } catch {
    return fallback
  }
}

export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL)
}

/** Returns the cached response for a key, or null on a miss — and on every
 * kind of Redis failure, which is deliberately indistinguishable from a miss
 * to the caller. A miss costs a Postgres read; there is nothing else to do
 * about it and nothing else the caller would do differently. */
export async function getCachedResponse(
  endpoint: string,
  key: string,
): Promise<CachedIdempotentResponse | null> {
  return safely<CachedIdempotentResponse | null>(null, async (redis) => {
    const raw = await redis.get(responseKey(endpoint, key))
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as CachedIdempotentResponse
      // A cache entry that does not carry the hash cannot be validated
      // against the incoming request, and replaying it unchecked is how a
      // reused key returns the wrong order. Treat it as a miss.
      if (!parsed || typeof parsed.requestHash !== 'string') return null
      return parsed
    } catch {
      return null
    }
  })
}

/** Caches a completed response. Called only after the PostgreSQL transaction
 * has committed — caching before the commit would hand a retry an order
 * number for an order that may still roll back. */
export async function setCachedResponse(
  endpoint: string,
  key: string,
  value: CachedIdempotentResponse,
): Promise<void> {
  await safely<void>(undefined, async (redis) => {
    await redis.set(responseKey(endpoint, key), JSON.stringify(value), 'EX', IDEMPOTENCY_TTL_SECONDS)
  })
}

/** Drops a cached response. Used when the claim is abandoned, so a shopper who
 * fixes their cart is not handed a stale failure. */
export async function clearCachedResponse(endpoint: string, key: string): Promise<void> {
  await safely<void>(undefined, async (redis) => {
    await redis.del(responseKey(endpoint, key))
  })
}

/**
 * Takes the lock, returning the token needed to release it — or null if
 * someone else holds it.
 *
 * `null` is also what an unavailable Redis returns, which reads backwards at
 * first: a failure looks like "locked by someone else". It is the safe
 * direction *because the caller does not gate on it* — the caller proceeds to
 * the Postgres claim either way, and the lock only ever saves work. Making a
 * Redis outage look like "lock free" would be equally correct here; making it
 * *block* a checkout would not be, and neither branch does that.
 */
export async function acquireLock(endpoint: string, key: string): Promise<string | null> {
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return safely<string | null>(null, async (redis) => {
    const ok = await redis.set(lockKey(endpoint, key), token, 'PX', REDIS_LOCK_TTL_MS, 'NX')
    return ok === 'OK' ? token : null
  })
}

/** Releases a lock this process still owns. A token from another holder, or
 * an already-expired key, is a no-op — see RELEASE_SCRIPT. */
export async function releaseLock(endpoint: string, key: string, token: string): Promise<void> {
  await safely<void>(undefined, async (redis) => {
    await redis.eval(RELEASE_SCRIPT, 1, lockKey(endpoint, key), token)
  })
}

/** Closes the connection. For test teardown and graceful shutdown; the app
 * itself never needs to call this. */
export async function disconnectRedis(): Promise<void> {
  if (!client) return
  const c = client
  client = null
  try {
    await c.quit()
  } catch {
    c.disconnect()
  }
}

/** Test seam: forces the module into its "no Redis" mode without unsetting
 * the environment variable, so the Postgres-only path can be exercised. */
export function __disableRedisForTests(reason = 'désactivé pour les tests'): void {
  disabledReason = reason
  if (client) {
    client.disconnect()
    client = null
  }
}

/** Test seam: undoes __disableRedisForTests. */
export function __enableRedisForTests(): void {
  disabledReason = REDIS_URL ? null : 'REDIS_URL non défini'
}
