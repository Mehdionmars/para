import type { Payload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { evaluateCoupon, resolveShipping, type CartLine } from '@/lib/pricing'

/**
 * Adversarial coverage for pricing.ts, written independently of
 * tests/unit/pricing.spec.ts to hunt for gaps that suite's own stub and
 * assertions let through. Every test here was validated against a real
 * mutation of the implementation (temporarily edited, run, reverted) to
 * confirm it actually fails when the behaviour it targets breaks — see the
 * accompanying QA report for the mutation log.
 *
 * Findings this file closes:
 *  1. No existing test asserts `couponId` or `code` on the success payload —
 *     a swapped/dropped identifier survives the whole existing suite.
 *  2. No existing test hits the exact start/end date boundary instant — an
 *     off-by-one (`>` vs `>=`, `<` vs `<=`) on either window edge survives.
 *  3. The shared stub's `coupon-redemptions` handler ignores `where`
 *     entirely and returns a fixed count regardless of which coupon or
 *     customer was queried — a query that filters by the wrong coupon id
 *     (or drops the coupon filter) is invisible to the whole existing
 *     suite. This file uses a stricter stub that actually filters, so the
 *     coupon-id scoping is exercised for real.
 */

type FindArgs = {
  collection: string
  where?: Record<string, any>
  overrideAccess?: boolean
  limit?: number
  depth?: number
}

type CouponRow = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minimumAmount?: number | null
  maximumDiscount?: number | null
  startDate?: string | null
  endDate?: string | null
  usageLimit?: number | null
  perCustomerLimit?: number | null
  usageCount?: number | null
  active?: boolean | null
  eligibility?: {
    products?: (number | { id: number })[] | null
    categories?: (number | { id: number })[] | null
    brands?: (number | { id: number })[] | null
  } | null
}

type ShippingRow = { id: number; city?: string; price?: number; freeFrom?: number | null; isDefault?: boolean }
type RedemptionRow = { coupon: number; customerEmail: string }

type StubData = {
  coupons?: CouponRow[]
  redemptions?: RedemptionRow[]
  categories?: { id: number; name: string }[]
  shippingRules?: ShippingRow[]
}

/**
 * Unlike the sibling suite's stub, this one actually filters
 * `coupon-redemptions` by the coupon id and email in the query — so a bug
 * that queries the wrong coupon (or drops the coupon filter) changes the
 * count returned, instead of being invisible.
 */
function strictStubPayload(data: StubData) {
  const calls: FindArgs[] = []

  const find = async (args: FindArgs) => {
    calls.push(args)

    if (args.collection === 'coupons') {
      const wanted = args.where?.code?.equals
      const docs = (data.coupons || []).filter((c) => c.code === wanted)
      return { docs, totalDocs: docs.length }
    }

    if (args.collection === 'coupon-redemptions') {
      const and: any[] = args.where?.and ?? []
      const couponId = and.find((c) => c.coupon)?.coupon?.equals
      const email = and.find((c) => c.customerEmail)?.customerEmail?.equals
      const matches = (data.redemptions || []).filter((r) => r.coupon === couponId && r.customerEmail === email)
      return { docs: [], totalDocs: matches.length }
    }

    if (args.collection === 'categories') {
      const ids: number[] = args.where?.id?.in ?? []
      const docs = (data.categories || []).filter((c) => ids.includes(c.id))
      return { docs, totalDocs: docs.length }
    }

    if (args.collection === 'shipping-rules') {
      const docs = data.shippingRules || []
      return { docs, totalDocs: docs.length }
    }

    throw new Error(`unexpected collection queried: ${args.collection}`)
  }

  return { calls, payload: { find } as unknown as Payload }
}

const line = (over: Partial<CartLine> = {}): CartLine => ({
  brandId: null,
  categoryValue: null,
  price: 100,
  productId: 1,
  quantity: 1,
  ...over,
})

const coupon = (over: Partial<CouponRow> = {}): CouponRow => ({
  active: true,
  code: 'WELCOME10',
  id: 7,
  type: 'percentage',
  value: 10,
  ...over,
})

describe('evaluateCoupon — success payload identity', () => {
  it('returns the coupon id and stored code, not derived or default values', async () => {
    // Nothing in the existing suite reads `result.couponId` or `result.code`
    // on a successful validation — every assertion uses toMatchObject with a
    // subset that omits them. A checkout that records the wrong couponId
    // against an order would misattribute the redemption and corrupt the
    // usage/perCustomerLimit accounting for a *different* coupon.
    const { payload } = strictStubPayload({ coupons: [coupon({ code: 'SUMMER25', id: 42 })] })
    const result = await evaluateCoupon({ code: 'summer25', lines: [line({ price: 200 })], payload })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected ok')
    expect(result.couponId).toBe(42)
    expect(result.code).toBe('SUMMER25')
  })
})

describe('evaluateCoupon — date-window boundary (exact instant)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts a coupon whose startDate is exactly now (inclusive start)', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(now)

    const { payload } = strictStubPayload({ coupons: [coupon({ startDate: now.toISOString() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })

    // now.getTime() > now.getTime() is false, so this must pass. A `>=`
    // mutation on the start check rejects a coupon at the exact instant it
    // becomes valid.
    expect(result.ok).toBe(true)
  })

  it('accepts a coupon whose endDate is exactly now (inclusive end)', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(now)

    const { payload } = strictStubPayload({ coupons: [coupon({ endDate: now.toISOString() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })

    // now.getTime() < now.getTime() is false, so this must still be valid.
    // A `<=` mutation on the end check expires a coupon one instant early.
    expect(result.ok).toBe(true)
  })

  it('rejects a coupon one millisecond before its startDate', async () => {
    const start = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(new Date(start.getTime() - 1))

    const { payload } = strictStubPayload({ coupons: [coupon({ startDate: start.toISOString() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })

    expect(result).toMatchObject({ ok: false, reason: 'not_started' })
  })

  it('rejects a coupon one millisecond after its endDate', async () => {
    const end = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(new Date(end.getTime() + 1))

    const { payload } = strictStubPayload({ coupons: [coupon({ endDate: end.toISOString() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })

    expect(result).toMatchObject({ ok: false, reason: 'expired' })
  })
})

describe('evaluateCoupon — per-customer limit is scoped to the right coupon', () => {
  it('does not let a redemption of one coupon block a different coupon for the same customer', async () => {
    // With the sibling suite's stub, `coupon-redemptions` always returns a
    // fixed count no matter what `where` says — so a bug that hardcodes or
    // drops the coupon-id filter is invisible there. This stub actually
    // filters, so a cross-coupon leak would show up as a false rejection.
    const { payload } = strictStubPayload({
      coupons: [
        coupon({ code: 'COUPONA', id: 1, perCustomerLimit: 1 }),
        coupon({ code: 'COUPONB', id: 2, perCustomerLimit: 1 }),
      ],
      redemptions: [{ coupon: 1, customerEmail: 'shopper@example.com' }],
    })

    const result = await evaluateCoupon({
      code: 'COUPONB',
      customerEmail: 'shopper@example.com',
      lines: [line()],
      payload,
    })

    expect(result.ok).toBe(true)
  })

  it('blocks a second redemption of the same coupon by the same customer', async () => {
    const { payload } = strictStubPayload({
      coupons: [coupon({ code: 'COUPONA', id: 1, perCustomerLimit: 1 })],
      redemptions: [{ coupon: 1, customerEmail: 'shopper@example.com' }],
    })

    const result = await evaluateCoupon({
      code: 'COUPONA',
      customerEmail: 'shopper@example.com',
      lines: [line()],
      payload,
    })

    expect(result).toMatchObject({ ok: false, reason: 'customer_limit_reached' })
  })

  it('does not block a different customer from redeeming the same coupon', async () => {
    const { payload } = strictStubPayload({
      coupons: [coupon({ code: 'COUPONA', id: 1, perCustomerLimit: 1 })],
      redemptions: [{ coupon: 1, customerEmail: 'other@example.com' }],
    })

    const result = await evaluateCoupon({
      code: 'COUPONA',
      customerEmail: 'shopper@example.com',
      lines: [line()],
      payload,
    })

    expect(result.ok).toBe(true)
  })
})

describe('evaluateCoupon — malformed / hostile input', () => {
  it('treats an unparseable startDate/endDate as an invalid Date rather than throwing', async () => {
    // `new Date('not-a-date').getTime()` is NaN; every comparison against
    // NaN is false, so both window checks are silently skipped rather than
    // rejecting or throwing. Documented here so a future tightening of date
    // validation has a pinned baseline to change deliberately.
    const { payload } = strictStubPayload({
      coupons: [coupon({ endDate: 'not-a-date', startDate: 'also-not-a-date' })],
    })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(result.ok).toBe(true)
  })

  it('does not crash on a very long code and still normalises it', async () => {
    const longCode = 'A'.repeat(5000)
    const { payload } = strictStubPayload({ coupons: [coupon({ code: longCode })] })
    const result = await evaluateCoupon({ code: longCode.toLowerCase(), lines: [line()], payload })
    expect(result.ok).toBe(true)
  })

  it('does not throw on a code containing unicode/emoji, and normalises it safely', async () => {
    const { calls, payload } = strictStubPayload({ coupons: [coupon({ code: 'PROMO' })] })
    const result = await evaluateCoupon({ code: '  promo 🎉 ', lines: [line()], payload })
    // Emoji survives uppercasing; the important thing is nothing throws and
    // the lookup is well-formed.
    expect(calls[0].where?.code?.equals).toBe('PROMO🎉')
    expect(result.ok).toBe(false)
  })

  it('propagates a rejected payload.find rather than swallowing the error', async () => {
    // Neither evaluateCoupon nor resolveShipping wraps its DB calls in
    // try/catch. Documented so a caller knows it must handle rejection
    // itself (e.g. the checkout route) rather than assuming a
    // CouponResult is always returned.
    const failing = { find: async () => { throw new Error('connection reset') } } as unknown as Payload
    await expect(
      evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload: failing }),
    ).rejects.toThrow('connection reset')
  })

  it('does not let a negative-price line produce a negative or invented discount', async () => {
    // Prices are documented as always sourced server-side, but the function
    // itself has no guard against a caller passing a negative price. Confirm
    // the Math.max(0, ...) clamp still protects the output even then.
    const { payload } = strictStubPayload({ coupons: [coupon({ type: 'fixed', value: 500 })] })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ price: -50, productId: 1 }), line({ price: 100, productId: 2 })],
      payload,
    })
    // Guard, not `if (result.ok)`: a conditional here would let the whole
    // test pass with no assertions at all the moment the call started
    // failing, which is exactly when it needs to speak up.
    if (!result.ok) throw new Error(`expected a discount, got reason "${result.reason}"`)

    // A negative line lowers the eligible subtotal rather than being skipped:
    // -50 + 100 = 50, and the 500 MAD fixed coupon clamps down to that.
    expect(result.eligibleSubtotal).toBe(50)
    expect(result.discount).toBe(50)
    expect(result.discount).toBeLessThanOrEqual(result.eligibleSubtotal)
  })

  it('accepts eligibility given as populated relationship objects for brands and categories, not just products', async () => {
    // The existing suite only exercises the populated-object form of
    // relIds() via `eligibility.products`. Brands and categories share the
    // same relIds() call but were never proven with the `{ id }` shape.
    const { payload } = strictStubPayload({
      categories: [{ id: 3, name: 'Solaires' }],
      coupons: [
        coupon({ eligibility: { brands: [{ id: 42 }], categories: [{ id: 3 }] }, type: 'percentage', value: 50 }),
      ],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [
        line({ brandId: 42, price: 100, productId: 1 }),
        line({ categoryValue: 'Solaires', price: 200, productId: 2 }),
        line({ price: 300, productId: 3 }),
      ],
      payload,
    })
    expect(result).toMatchObject({ eligibleSubtotal: 300, ok: true })
  })
})

describe('round() — floating point edge case', () => {
  it('rounds a discount that lands exactly on a x.xx5 boundary', async () => {
    // Drives the real round() through the public API rather than asserting on
    // a local copy of it: a re-implementation in the test would keep passing
    // no matter what pricing.ts did. 50% of a 2.01 eligible subtotal is
    // 1.005, whose nearest double is 1.00499999999999989 — so 1 is the
    // correct rounding of the value that exists, not a bug to be fixed.
    const { payload } = strictStubPayload({ coupons: [coupon({ type: 'percentage', value: 50 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 2.01, quantity: 1 })], payload })

    if (!result.ok) throw new Error(`expected a discount, got reason "${result.reason}"`)
    expect(result.eligibleSubtotal).toBe(2.01)
    expect(result.discount).toBe(1)
  })

  it('the discount computed by evaluateCoupon can land on the same boundary', async () => {
    // eligibleSubtotal is itself round()-ed before the percentage is
    // applied, so reaching the exact x.xx5 boundary end-to-end depends on
    // the interaction of both roundings rather than the price alone. This
    // concrete case (2.53 MAD eligible subtotal, 50%) drives the raw
    // discount to 1.265, which is one of the values round() mis-handles.
    const { payload } = strictStubPayload({ coupons: [coupon({ type: 'percentage', value: 50 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 2.53, quantity: 1 })], payload })
    if (!result.ok) throw new Error(`expected a discount, got reason "${result.reason}"`)

    // 1.26 is not a rounding error to be fixed: the double nearest 1.265 is
    // 1.26499999999999990, so 1.26 is the correct rounding of the value that
    // actually exists. Number(n.toFixed(2)) returns 1.26 here too — and for
    // 2.675 / 0.615 it returns the *lower* value where Math.round returns the
    // conventionally expected higher one, so switching would be a regression.
    // Pinned so any future change to round() is deliberate and visible.
    expect(result.discount).toBe(1.26)
  })
})

describe('resolveShipping — malformed input', () => {
  it('does not crash and falls back to default when city is an unusual type of falsy-ish garbage', async () => {
    const rules: ShippingRow[] = [{ id: 3, isDefault: true, price: 45, freeFrom: 800 }]
    const { payload } = strictStubPayload({ shippingRules: rules })
    const result = await resolveShipping({ city: '   ', payload, subtotalAfterDiscount: 100 })
    expect(result.ruleId).toBe(3)
  })

  it('propagates a rejected payload.find', async () => {
    const failing = { find: async () => { throw new Error('db down') } } as unknown as Payload
    await expect(resolveShipping({ payload: failing, subtotalAfterDiscount: 100 })).rejects.toThrow('db down')
  })

  it('treats a huge subtotalAfterDiscount as free when it clears the threshold, without overflow weirdness', async () => {
    const rules: ShippingRow[] = [{ city: 'Casablanca', freeFrom: 500, id: 1, price: 25 }]
    const { payload } = strictStubPayload({ shippingRules: rules })
    const result = await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: Number.MAX_SAFE_INTEGER })
    expect(result.cost).toBe(0)
  })
})
