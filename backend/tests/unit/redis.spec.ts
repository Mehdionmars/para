import { describe, expect, it } from 'vitest'

import {
  acquireLock,
  clearCachedResponse,
  getCachedResponse,
  isRedisConfigured,
  lockKey,
  releaseLock,
  responseKey,
  setCachedResponse,
} from '@/services/redis'

/**
 * Redis with no Redis.
 *
 * This suite runs with `REDIS_URL` unset, which is the configuration CI uses
 * and the one a developer gets by default — and that is the point. The whole
 * cache layer is an optimisation over a correct baseline, so "no Redis" has
 * to be a supported mode rather than a degraded one, and the way that breaks
 * in practice is a call site that assumes a client exists and throws inside
 * a checkout.
 *
 * So: every exported function is called here, and none of them may reject.
 * A miss is the answer; an exception is a bug that would take an order down.
 *
 * What this cannot prove without a server is the compare-and-delete in the
 * release script — that lives in tests/int, against a real Redis.
 */

describe('redis, unconfigured', () => {
  it('reports itself as not configured', () => {
    expect(isRedisConfigured()).toBe(false)
  })

  it('returns a miss rather than throwing', async () => {
    await expect(getCachedResponse('/api/checkout', 'k-12345678')).resolves.toBeNull()
  })

  it('swallows a write', async () => {
    await expect(
      setCachedResponse('/api/checkout', 'k-12345678', {
        body: { orderNumber: 'PD-TEST' },
        requestHash: 'a'.repeat(64),
        status: 200,
      }),
    ).resolves.toBeUndefined()
  })

  it('swallows a clear', async () => {
    await expect(clearCachedResponse('/api/checkout', 'k-12345678')).resolves.toBeUndefined()
  })

  it('cannot take a lock, and says so without throwing', async () => {
    // null reads like "someone else holds it", and that is deliberate: the
    // caller never gates on the lock, it proceeds to the Postgres claim
    // either way. A rejection here would be the one outcome that breaks a
    // checkout, which is why the module has no path that produces one.
    await expect(acquireLock('/api/checkout', 'k-12345678')).resolves.toBeNull()
  })

  it('releasing a lock it never held is a no-op', async () => {
    await expect(releaseLock('/api/checkout', 'k-12345678', 'token')).resolves.toBeUndefined()
  })
})

describe('key namespacing', () => {
  it('separates cache from lock', () => {
    expect(responseKey('/api/checkout', 'abc')).not.toBe(lockKey('/api/checkout', 'abc'))
  })

  it('scopes both by endpoint', () => {
    // A key used on /api/checkout must not resolve on another route — the
    // same rule the Postgres primary key enforces, mirrored in the cache so
    // the two can never disagree about what a key means.
    expect(responseKey('/api/checkout', 'abc')).not.toBe(responseKey('/api/payments', 'abc'))
    expect(lockKey('/api/checkout', 'abc')).not.toBe(lockKey('/api/payments', 'abc'))
  })

  it('keeps the documented prefixes', () => {
    expect(responseKey('/api/checkout', 'abc')).toMatch(/^idempotency:response:/)
    expect(lockKey('/api/checkout', 'abc')).toMatch(/^idempotency:lock:/)
  })
})
