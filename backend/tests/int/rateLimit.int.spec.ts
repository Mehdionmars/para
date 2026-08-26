// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { RATE_LIMITS } from '@/lib/rateLimit'

/**
 * Rate limiting, and the two properties that matter more than the threshold.
 *
 * 1. It counts atomically. The increment is a single
 *    `INSERT ... ON CONFLICT DO UPDATE ... RETURNING hits`, so a burst of
 *    concurrent requests cannot all read the same count and all decide they
 *    are under the limit — the same class of bug as a read-then-write stock
 *    decrement.
 *
 * 2. It fails OPEN. A limiter that fails closed turns a database blip into a
 *    total outage: every shopper blocked from checking out because a counter
 *    table is briefly unavailable. That trade is never worth it here — the
 *    real protections (access control, the stock transaction, server-side
 *    pricing) are untouched by the limiter being down, and Cloudflare is
 *    still in front.
 *
 * Buckets are per source address, so each test uses its own and none of them
 * can spend another's budget.
 */

vi.setConfig({ hookTimeout: 120_000, testTimeout: 120_000 })

const BASE = process.env.TEST_CMS_URL || 'http://localhost:3001'
const ROUTE = '/api/orders/track'
const LIMIT = RATE_LIMITS[ROUTE].limit

let payload: Payload
let bucketSeq = 0
const nextIp = () => `198.18.${Math.floor(bucketSeq / 254) % 254}.${(bucketSeq++ % 254) + 1}`

/** Tracking a non-existent order: a real request that always 404s, so the
 * only thing varying between calls is the limiter. */
async function track(ip: string) {
  const res = await fetch(`${BASE}${ROUTE}`, {
    body: JSON.stringify({ email: 'nobody@paradhiver.test', orderNumber: 'PDH-000000-ZZZZ' }),
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    method: 'POST',
  })
  return { retryAfter: res.headers.get('retry-after'), status: res.status }
}

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  const client = await payload.db.pool.connect()
  try {
    await client.query(`DELETE FROM rate_limits WHERE bucket LIKE $1`, [`${ROUTE}:198.18.%`])
  } finally {
    client.release()
  }
})

describe('rate limiting', () => {
  it(`allows ${LIMIT} requests then answers 429 with Retry-After`, async () => {
    const ip = nextIp()

    const allowed = []
    for (let i = 0; i < LIMIT; i++) allowed.push((await track(ip)).status)
    expect(allowed.every((s) => s !== 429)).toBe(true)

    const blocked = await track(ip)
    expect(blocked.status).toBe(429)

    // Without Retry-After a client has no way to know when to come back, and
    // a retrying one becomes the load the limiter was meant to shed.
    expect(Number(blocked.retryAfter)).toBeGreaterThan(0)
    expect(Number(blocked.retryAfter)).toBeLessThanOrEqual(RATE_LIMITS[ROUTE].windowSeconds)
  })

  it('counts a concurrent burst exactly once each', async () => {
    const ip = nextIp()
    const burst = LIMIT + 20

    // All at once, so every request races the same row. A read-then-write
    // counter would let far more than LIMIT through here.
    const results = await Promise.all(Array.from({ length: burst }, () => track(ip)))
    const passed = results.filter((r) => r.status !== 429).length
    const rejected = results.filter((r) => r.status === 429).length

    console.log(`rafale ${burst} requêtes, limite ${LIMIT} -> ${passed} passées, ${rejected} bloquées`)

    expect(passed).toBe(LIMIT)
    expect(rejected).toBe(burst - LIMIT)
  })

  it('keeps buckets separate per source address', async () => {
    // One address exhausting its budget must not affect anyone else — this is
    // what makes the limits safe behind carrier-grade NAT only insofar as the
    // addresses genuinely differ, and what stops one abuser blocking a shop.
    const noisy = nextIp()
    for (let i = 0; i <= LIMIT; i++) await track(noisy)
    expect((await track(noisy)).status).toBe(429)

    expect((await track(nextIp())).status).not.toBe(429)
  })

  // The fail-open behaviour is covered by tests/unit/rateLimit.spec.ts.
  //
  // It used to live here and proved itself by renaming `rate_limits` out of
  // the way — which works, and which also removes the table from under every
  // other suite running in parallel. That made unrelated files flaky in a way
  // that pointed nowhere near the cause. Injecting a failing pool needs no
  // database at all and tests exactly the same branch.
})
