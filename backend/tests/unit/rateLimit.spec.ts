import { describe, expect, it, vi } from 'vitest'

import { checkRateLimit, clientIp, RATE_LIMITS } from '@/lib/rateLimit'

/**
 * The two branches of the limiter that must not need a database to verify.
 *
 * `checkRateLimit` takes its pool from the Payload instance it is handed, so
 * a stub is enough to drive the failure paths exactly — no table to rename,
 * nothing global to disturb, and no parallel suite to break. (An earlier
 * version of this test proved fail-open by renaming `rate_limits` out of the
 * way, which does work and also removes the table from under every other
 * suite running at the same time.)
 *
 * The counting itself is verified against real Postgres in
 * tests/int/rateLimit.int.spec.ts, because atomicity is precisely the thing a
 * stub cannot demonstrate.
 */

/** Minimal shape of what checkRateLimit actually touches. */
function fakePayload(connect: () => Promise<unknown>) {
  return {
    db: { pool: { connect } },
    logger: { error: vi.fn(), warn: vi.fn() },
  } as unknown as Parameters<typeof checkRateLimit>[0]['payload']
}

describe('clientIp', () => {
  it('prefers the header a client cannot forge', () => {
    const headers = new Headers({
      'cf-connecting-ip': '1.1.1.1',
      'x-forwarded-for': '2.2.2.2, 3.3.3.3',
      'x-real-ip': '4.4.4.4',
    })
    // Behind Cloudflare, cf-connecting-ip is overwritten by the edge, so it
    // is the only one an attacker cannot choose. Trusting x-forwarded-for
    // first would let anyone pick their own bucket and opt out of every limit.
    expect(clientIp(headers)).toBe('1.1.1.1')
  })

  it('takes the left-most forwarded entry, which is the original client', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('2.2.2.2')
  })

  it('returns null rather than a shared bucket when nothing identifies the caller', () => {
    // A shared "unknown" bucket is the dangerous-looking-safe option: if the
    // Cloudflare header ever goes missing, every request in the world lands
    // in one counter and the whole shop starts answering 429.
    expect(clientIp(new Headers())).toBeNull()
  })
})

describe('checkRateLimit', () => {
  it('does not limit a route with no rule', async () => {
    const connect = vi.fn()
    const verdict = await checkRateLimit({
      identifier: '1.2.3.4',
      payload: fakePayload(connect),
      route: '/api/not-in-the-table',
    })
    expect(verdict.allowed).toBe(true)
    // No rule means no reason to touch the database at all.
    expect(connect).not.toHaveBeenCalled()
  })

  it('does not limit an unidentifiable caller', async () => {
    const connect = vi.fn()
    const verdict = await checkRateLimit({
      identifier: null,
      payload: fakePayload(connect),
      route: '/api/checkout',
    })
    expect(verdict.allowed).toBe(true)
    expect(connect).not.toHaveBeenCalled()
  })

  it('allows the request when the counter table cannot be reached', async () => {
    const payload = fakePayload(() => Promise.reject(new Error('relation "rate_limits" does not exist')))
    const verdict = await checkRateLimit({ identifier: '1.2.3.4', payload, route: '/api/checkout' })

    // Fail OPEN. A limiter that fails closed converts a database blip into a
    // total outage — every shopper blocked from checking out because a
    // counter table is briefly unavailable — while none of the real
    // protections (access control, the stock transaction, server-side
    // pricing) depend on it being up.
    expect(verdict.allowed).toBe(true)
    expect(payload.logger.warn).toHaveBeenCalled()
  })

  it('releases the connection even when the query throws', async () => {
    const release = vi.fn()
    const payload = fakePayload(() =>
      Promise.resolve({ query: () => Promise.reject(new Error('deadlock detected')), release }),
    )
    const verdict = await checkRateLimit({ identifier: '1.2.3.4', payload, route: '/api/checkout' })

    expect(verdict.allowed).toBe(true)
    // A limiter that leaked a connection per failure would drain the pool and
    // take the site down by itself — the exact failure it exists to prevent.
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('blocks once the window count passes the rule, with a usable Retry-After', async () => {
    const rule = RATE_LIMITS['/api/checkout']
    const release = vi.fn()
    const payload = fakePayload(() =>
      Promise.resolve({
        // One past the limit, which is what the guarded INSERT would return.
        query: () => Promise.resolve({ rows: [{ hits: rule.limit + 1 }] }),
        release,
      }),
    )

    const verdict = await checkRateLimit({ identifier: '1.2.3.4', payload, route: '/api/checkout' })
    expect(verdict.allowed).toBe(false)
    if (!verdict.allowed) {
      expect(verdict.retryAfterSeconds).toBeGreaterThan(0)
      expect(verdict.retryAfterSeconds).toBeLessThanOrEqual(rule.windowSeconds)
    }
  })

  it('reports the remaining budget while under the limit', async () => {
    const rule = RATE_LIMITS['/api/checkout']
    const payload = fakePayload(() =>
      Promise.resolve({ query: () => Promise.resolve({ rows: [{ hits: 1 }] }), release: vi.fn() }),
    )
    const verdict = await checkRateLimit({ identifier: '1.2.3.4', payload, route: '/api/checkout' })
    expect(verdict.allowed).toBe(true)
    if (verdict.allowed) expect(verdict.remaining).toBe(rule.limit - 1)
  })
})
