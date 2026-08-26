import type { Payload } from 'payload'

/**
 * Fixed-window rate limiting on Postgres.
 *
 * ## Why here at all, with Cloudflare in front
 *
 * Cloudflare stops volumetric abuse — floods, scrapers, obvious bots — and it
 * does it better than any origin can, because it drops the traffic before it
 * costs anything. What it cannot see is *semantics*: forty requests a minute
 * is unremarkable traffic, and it is also someone walking order numbers
 * through /api/orders/track, or probing coupon codes one at a time. Those are
 * the cases this layer exists for, and they are low-volume by nature.
 *
 * So the limits below are not tuned to protect the server from load. They are
 * tuned to be invisible to a real shopper and tedious for a script.
 *
 * ## Why fixed windows
 *
 * A sliding window is more precise and needs a row per request. A fixed
 * window needs a row per bucket per window, and its worst case — a burst
 * straddling a window boundary letting through 2× the limit for a moment — is
 * irrelevant at these thresholds. Precision is not what this is for.
 *
 * ## Why the increment is one statement
 *
 *   INSERT ... ON CONFLICT DO UPDATE SET hits = rate_limits.hits + 1 RETURNING hits
 *
 * Read-then-write would let two concurrent requests both read `hits = 9`,
 * both decide they are under a limit of 10, and both write 10 — which is the
 * same class of bug as a read-then-write stock decrement. `RETURNING` gives
 * back the value *this* caller landed on, so the count can never be shared.
 *
 * ## Failure mode
 *
 * If the table cannot be reached, the request is ALLOWED. A rate limiter that
 * fails closed turns a database blip into a total outage — every shopper
 * blocked from checking out because a counter table is unavailable. Cloudflare
 * is still in front, and the real protections (access control, stock
 * transactions, price recalculation) are untouched by this being briefly
 * unavailable.
 */

export type RateLimitRule = {
  /** Requests allowed per window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export type RateLimitVerdict =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number }

/** Per-route rules. See the note inside on why these are deliberately loose. */
export const RATE_LIMITS: Record<string, RateLimitRule> = {
  // NOTE ON THRESHOLDS AND SHARED ADDRESSES
  //
  // These are per source address, and in Morocco a large share of mobile
  // traffic arrives through carrier-grade NAT: hundreds of unrelated shoppers
  // can present the same IP. A limit tuned to "how many orders would one
  // person place" would therefore reject real customers at peak, which is a
  // far worse outcome than the abuse it prevents.
  //
  // So every threshold below is set well above one person's plausible rate
  // and well below a script's. Correctness does not depend on any of them:
  // oversell is prevented by the stock transaction, duplicate orders by the
  // idempotency key, and price tampering by recalculating server-side. These
  // limits only make abuse tedious.

  // A busy minute behind one CGNAT address can genuinely produce a dozen
  // orders; a script scraping or hammering checkout produces hundreds.
  '/api/checkout': { limit: 30, windowSeconds: 60 },

  // A coupon field is an oracle: without a limit the whole code space can be
  // enumerated for a working discount. Well above real typing, far below
  // enumeration.
  '/api/coupons/validate': { limit: 40, windowSeconds: 60 },

  // Tracking used to be genuinely guessable — four random characters in the
  // order number. It no longer is (numbers come from a sequence and the email
  // must match), so this exists to cap enumeration rather than to prevent it.
  '/api/orders/track': { limit: 30, windowSeconds: 60 },

  // Autocomplete fires per keystroke, so this has to be loose or it breaks
  // the feature it is protecting. It exists only to cap a scraper.
  '/api/search/suggest': { limit: 120, windowSeconds: 60 },

  // Public, and it registers a row per call.
  '/api/push/subscribe': { limit: 10, windowSeconds: 60 },

  // File-parsing endpoints. Staff-only and role-gated, but each request
  // loads a spreadsheet into memory, so the ceiling bounds a runaway client
  // rather than an attacker. Well above what a real import performs.
  '/api/import-products': { limit: 120, windowSeconds: 60 },
  '/api/import/products/validate': { limit: 120, windowSeconds: 60 },
  '/api/import/products/run': { limit: 600, windowSeconds: 60 },

  // NOT limited, deliberately: /api/products/bulk and /api/inventory/restock.
  //
  // Both are authenticated and role-gated, and both are used in loops by
  // people doing their job — a stock take, a seasonal repricing, a delivery
  // being booked in. A limit there mostly means an operator being told to
  // come back later in the middle of a task.
  //
  // The threat it would address is a compromised staff account making bulk
  // changes, and a rate limit does not address it: the same account can do
  // the same damage through the admin UI, more slowly. What actually
  // contains that is the role split (a stockManager cannot touch prices),
  // the transaction (a batch applies fully or not at all), the optimistic
  // `seenAt` guard, and the stock-movement audit trail. Those are real; a
  // limit here would only be theatre with an operational cost.

  // Credential stuffing. Payload already locks an *account* after 5 failures
  // (maxLoginAttempts), which does nothing against one attempt each on a
  // thousand accounts from one source — that is what this covers.
  'login': { limit: 10, windowSeconds: 300 },
}

/**
 * The caller's address, or null when it cannot be established.
 *
 * `cf-connecting-ip` first and deliberately: behind Cloudflare it is the only
 * header a client cannot forge, because Cloudflare overwrites it. Trusting
 * `x-forwarded-for` first would let anyone choose their own bucket key and
 * opt out of every limit here by sending a new value each request.
 *
 * Null — rather than a shared "unknown" bucket — when no header identifies
 * the caller. A shared bucket sounds like the cautious choice and is the
 * dangerous one: the moment the Cloudflare header goes missing (a
 * misconfigured proxy, a rule change, an origin health check path), *every*
 * request in the world collapses into one counter and the entire shop starts
 * answering 429. The failure would look exactly like an outage and would be
 * caused by the protection itself.
 *
 * The safety of returning null rests on a deployment property, not on this
 * code: the origin must accept traffic only from Cloudflare. See
 * PRODUCTION-READINESS.md — without that firewall rule, an attacker reaching
 * the origin directly is unlimited here regardless of what this function
 * returns, because they could equally send a fresh forged X-Forwarded-For on
 * every request.
 */
export function clientIp(headers: Headers): string | null {
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const real = headers.get('x-real-ip')?.trim()
  if (real) return real

  // Left-most entry is the original client; the rest are proxies.
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded

  return null
}

/** Window start, floored — every request in the same window derives the same
 * value, which is what makes the primary key collide on purpose. */
function windowStart(windowSeconds: number): Date {
  const ms = windowSeconds * 1000
  return new Date(Math.floor(Date.now() / ms) * ms)
}

/**
 * Counts one request against `identifier` and says whether it may proceed.
 *
 * `rule` may be passed explicitly; otherwise it is looked up in RATE_LIMITS
 * by route. An unknown route is not limited — adding a route to the table is
 * a deliberate act, and silently limiting something at a guessed threshold is
 * worse than not limiting it.
 */
export async function checkRateLimit({
  identifier,
  payload,
  route,
  rule = RATE_LIMITS[route],
}: {
  identifier: string | null
  payload: Payload
  route: string
  rule?: RateLimitRule
}): Promise<RateLimitVerdict> {
  if (!rule) return { allowed: true, remaining: Number.POSITIVE_INFINITY }
  // No identifiable caller: see clientIp above for why this is not lumped
  // into a shared bucket.
  if (!identifier) return { allowed: true, remaining: Number.POSITIVE_INFINITY }

  const start = windowStart(rule.windowSeconds)
  const bucket = `${route}:${identifier}`

  let client
  try {
    client = await payload.db.pool.connect()
    const res = await client.query(
      `INSERT INTO rate_limits (bucket, window_start, hits)
            VALUES ($1, $2, 1)
       ON CONFLICT (bucket, window_start)
       DO UPDATE SET hits = rate_limits.hits + 1
         RETURNING hits`,
      [bucket, start],
    )

    const hits = Number(res.rows[0].hits)
    if (hits > rule.limit) {
      const resetAt = start.getTime() + rule.windowSeconds * 1000
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
      }
    }
    return { allowed: true, remaining: rule.limit - hits }
  } catch (err) {
    // Fail open. See the note at the top: a limiter that fails closed
    // converts a database blip into a full outage.
    payload.logger.warn({ err }, `Rate limit non appliqué pour ${route} (table indisponible)`)
    return { allowed: true, remaining: Number.POSITIVE_INFINITY }
  } finally {
    client?.release()
  }
}

/** The 429 body. French, like every other client-facing message here, and
 * carrying no detail about the limit itself. */
export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { error: 'Trop de requêtes. Réessayez dans un instant.' },
    { headers: { 'Retry-After': String(retryAfterSeconds) }, status: 429 },
  )
}
