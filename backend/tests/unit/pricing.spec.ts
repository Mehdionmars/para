import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { evaluateCoupon, resolveShipping, type CartLine } from '@/lib/pricing'

/**
 * The rules that decide what a shopper is actually charged.
 *
 * `evaluateCoupon` is used by both the cart's live preview and the binding
 * checkout calculation, so a defect here is quoted to the shopper *and*
 * charged. It reads nothing but ids from the request — every amount comes from
 * the products table — and the tests below are written to fail if that stops
 * being true, if a discount ever exceeds what it applies to, or if the
 * deliberate order of its checks is rearranged.
 *
 * These are unit tests: the only dependency is `payload.find`, which is
 * stubbed at the database boundary. The logic under test is the real thing,
 * not a reimplementation — nothing here duplicates the implementation's
 * arithmetic, it asserts amounts computed by hand.
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

type StubData = {
  coupons?: CouponRow[]
  /** How many times this customer has already redeemed. */
  redemptions?: number
  categories?: { id: number; name: string }[]
  shippingRules?: ShippingRow[]
}

/**
 * A `payload` that answers only `find`, applying the same filters the real
 * one would. The code filter is honoured so that a normalisation test proves
 * something: the stored code is only ever found if the lookup normalised.
 */
function stubPayload(data: StubData) {
  const calls: FindArgs[] = []

  const find = async (args: FindArgs) => {
    calls.push(args)

    if (args.collection === 'coupons') {
      const wanted = args.where?.code?.equals
      const docs = (data.coupons || []).filter((c) => c.code === wanted)
      return { docs, totalDocs: docs.length }
    }

    if (args.collection === 'coupon-redemptions') {
      // Honour the scoping, rather than returning the count for any query:
      // a stub that ignores `where` here cannot tell a correct lookup from
      // one pointed at the wrong coupon, and silently disabling the
      // per-customer limit is precisely the bug worth catching.
      const and: any[] = args.where?.and ?? []
      const couponFilter = and[0]?.coupon?.equals
      const emailFilter = and[1]?.customerEmail?.equals
      const scopedToThisCoupon = (data.coupons || []).some((c) => c.id === couponFilter)
      const total = scopedToThisCoupon && emailFilter ? (data.redemptions ?? 0) : 0
      return { docs: [], totalDocs: total }
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

/** A coupon that passes every gate, so a test can break exactly one thing. */
const coupon = (over: Partial<CouponRow> = {}): CouponRow => ({
  active: true,
  code: 'WELCOME10',
  id: 7,
  type: 'percentage',
  value: 10,
  ...over,
})

const HOUR = 3600 * 1000
const past = () => new Date(Date.now() - 48 * HOUR).toISOString()
const future = () => new Date(Date.now() + 48 * HOUR).toISOString()

describe('evaluateCoupon — code lookup', () => {
  it('normalises case, surrounding space and inner space before looking up', async () => {
    const { calls, payload } = stubPayload({ coupons: [coupon()] })

    const result = await evaluateCoupon({ code: '  wel come10 ', lines: [line()], payload })

    // Only matches because the lookup normalised to the stored code.
    expect(result.ok).toBe(true)
    expect(calls[0].where?.code?.equals).toBe('WELCOME10')
  })

  it('rejects an empty or whitespace-only code without touching the database', async () => {
    const { calls, payload } = stubPayload({ coupons: [coupon()] })

    for (const code of ['', '   ', '\t\n']) {
      const result = await evaluateCoupon({ code, lines: [line()], payload })
      expect(result).toMatchObject({ ok: false, reason: 'not_found' })
    }
    expect(calls).toHaveLength(0)
  })

  it('reports an unknown code as not_found', async () => {
    const { payload } = stubPayload({ coupons: [coupon()] })
    const result = await evaluateCoupon({ code: 'NOPE', lines: [line()], payload })
    expect(result).toMatchObject({ ok: false, reason: 'not_found' })
  })

  it('looks coupons up with overrideAccess so a public checkout can still validate', async () => {
    // `coupons.read` is staff-only so the code list never leaks; dropping this
    // flag would make every checkout fail to find a valid coupon.
    const { calls, payload } = stubPayload({ coupons: [coupon()] })
    await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(calls[0].overrideAccess).toBe(true)
  })
})

describe('evaluateCoupon — validity gates', () => {
  it('rejects an inactive coupon', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ active: false })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(result).toMatchObject({ ok: false, reason: 'inactive' })
  })

  it('rejects a coupon whose window has not opened', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ startDate: future() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(result).toMatchObject({ ok: false, reason: 'not_started' })
  })

  it('rejects an expired coupon', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ endDate: past() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(result).toMatchObject({ ok: false, reason: 'expired' })
  })

  it('accepts a coupon inside its window', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ endDate: future(), startDate: past() })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(result.ok).toBe(true)
  })

  it('rejects once the global usage limit is reached, treating a null count as zero', async () => {
    const atLimit = stubPayload({ coupons: [coupon({ usageCount: 5, usageLimit: 5 })] })
    expect(await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload: atLimit.payload })).toMatchObject({
      ok: false,
      reason: 'usage_limit_reached',
    })

    // A limit of 0 means the coupon can never be used, not "unlimited".
    const zero = stubPayload({ coupons: [coupon({ usageCount: null, usageLimit: 0 })] })
    expect(await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload: zero.payload })).toMatchObject({
      ok: false,
      reason: 'usage_limit_reached',
    })

    // One below the limit still works.
    const under = stubPayload({ coupons: [coupon({ usageCount: 4, usageLimit: 5 })] })
    expect((await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload: under.payload })).ok).toBe(true)
  })

  it('rejects once this customer has hit their own limit', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ perCustomerLimit: 1 })], redemptions: 1 })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      customerEmail: 'Shopper@Example.com',
      lines: [line()],
      payload,
    })
    expect(result).toMatchObject({ ok: false, reason: 'customer_limit_reached' })
  })

  it('matches the customer on a normalised email so casing cannot buy a second use', async () => {
    const { calls, payload } = stubPayload({ coupons: [coupon({ perCustomerLimit: 1 })], redemptions: 0 })
    await evaluateCoupon({ code: 'WELCOME10', customerEmail: '  Shopper@Example.COM ', lines: [line()], payload })

    const redemptionQuery = calls.find((c) => c.collection === 'coupon-redemptions')
    expect(redemptionQuery?.where?.and?.[1]?.customerEmail?.equals).toBe('shopper@example.com')
  })

  it('does not enforce the per-customer limit when no email is supplied', async () => {
    // Documented gap rather than an assertion of correct behaviour: a guest
    // checkout that omits the email skips this check entirely. Pinned so the
    // day it is tightened, this test is the reminder to revisit it.
    const { calls, payload } = stubPayload({ coupons: [coupon({ perCustomerLimit: 1 })], redemptions: 99 })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })

    expect(result.ok).toBe(true)
    expect(calls.some((c) => c.collection === 'coupon-redemptions')).toBe(false)
  })
})

describe('evaluateCoupon — eligibility', () => {
  it('applies to the whole cart when no restriction is configured', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ type: 'percentage', value: 10 })] })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ price: 200, quantity: 2 }), line({ price: 100, productId: 2 })],
      payload,
    })
    // 10% of 500.
    expect(result).toMatchObject({ discount: 50, eligibleSubtotal: 500, ok: true })
  })

  it('restricts to the listed products', async () => {
    const { payload } = stubPayload({
      coupons: [coupon({ eligibility: { products: [2] }, type: 'percentage', value: 50 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ price: 100, productId: 1 }), line({ price: 300, productId: 2 })],
      payload,
    })
    // Only product 2 counts: 50% of 300.
    expect(result).toMatchObject({ discount: 150, eligibleSubtotal: 300, ok: true })
  })

  it('accepts eligibility given as populated relationship objects', async () => {
    const { payload } = stubPayload({
      coupons: [coupon({ eligibility: { products: [{ id: 2 }] }, type: 'percentage', value: 50 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ price: 100, productId: 1 }), line({ price: 300, productId: 2 })],
      payload,
    })
    expect(result).toMatchObject({ eligibleSubtotal: 300, ok: true })
  })

  it('restricts by brand', async () => {
    const { payload } = stubPayload({
      coupons: [coupon({ eligibility: { brands: [42] }, type: 'percentage', value: 10 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ brandId: 42, price: 400 }), line({ brandId: 9, price: 100, productId: 2 })],
      payload,
    })
    expect(result).toMatchObject({ eligibleSubtotal: 400, ok: true })
  })

  it('restricts by category name, case-insensitively', async () => {
    const { payload } = stubPayload({
      categories: [{ id: 3, name: 'Solaires' }],
      coupons: [coupon({ eligibility: { categories: [3] }, type: 'percentage', value: 10 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ categoryValue: 'SOLAIRES', price: 250 }), line({ categoryValue: 'visage', price: 100, productId: 2 })],
      payload,
    })
    expect(result).toMatchObject({ eligibleSubtotal: 250, ok: true })
  })

  it('treats the three eligibility lists as a union, not an intersection', async () => {
    const { payload } = stubPayload({
      categories: [{ id: 3, name: 'Solaires' }],
      coupons: [coupon({ eligibility: { brands: [42], categories: [3], products: [1] }, type: 'percentage', value: 10 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [
        line({ price: 100, productId: 1 }), // by product
        line({ brandId: 42, price: 200, productId: 2 }), // by brand
        line({ categoryValue: 'solaires', price: 300, productId: 3 }), // by category
        line({ price: 400, productId: 4 }), // matches nothing
      ],
      payload,
    })
    expect(result).toMatchObject({ eligibleSubtotal: 600, ok: true })
  })

  it('reports not_applicable when a restricted coupon matches nothing in the cart', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ eligibility: { products: [999] } })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload })
    expect(result).toMatchObject({ ok: false, reason: 'not_applicable' })
  })
})

describe('evaluateCoupon — minimum spend', () => {
  it('measures the minimum against the whole cart, not the eligible subset', async () => {
    // "minimum 300 MAD d'achat" is a statement about the order, which is how a
    // shopper reads it — so a 100 MAD eligible line in a 400 MAD cart passes.
    const { payload } = stubPayload({
      coupons: [coupon({ eligibility: { products: [1] }, minimumAmount: 300, type: 'percentage', value: 10 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ price: 100, productId: 1 }), line({ price: 300, productId: 2 })],
      payload,
    })
    expect(result).toMatchObject({ discount: 10, eligibleSubtotal: 100, ok: true })
  })

  it('rejects below the minimum and quotes the amount required', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ minimumAmount: 300 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 299 })], payload })
    expect(result).toMatchObject({ minimumAmount: 300, ok: false, reason: 'minimum_not_met' })
    expect((result as { message: string }).message).toContain('300')
  })

  it('treats the minimum as inclusive', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ minimumAmount: 300 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 300 })], payload })
    expect(result.ok).toBe(true)
  })
})

describe('evaluateCoupon — discount arithmetic', () => {
  it('computes a percentage discount', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ type: 'percentage', value: 15 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 240 })], payload })
    expect(result).toMatchObject({ discount: 36, ok: true })
  })

  it('caps a percentage discount at maximumDiscount', async () => {
    const { payload } = stubPayload({
      coupons: [coupon({ maximumDiscount: 50, type: 'percentage', value: 50 })],
    })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 1000 })], payload })
    expect(result).toMatchObject({ discount: 50, ok: true })
  })

  it('computes a fixed discount', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ type: 'fixed', value: 75 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 240 })], payload })
    expect(result).toMatchObject({ discount: 75, ok: true })
  })

  it('never lets a fixed discount exceed the cart and hand out money', async () => {
    // The failure this guards is a 500 MAD coupon on a 100 MAD cart producing
    // a negative order total.
    const { payload } = stubPayload({ coupons: [coupon({ type: 'fixed', value: 500 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 100 })], payload })
    expect(result).toMatchObject({ discount: 100, ok: true })
  })

  it('never lets a percentage above 100 exceed the eligible subtotal', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ type: 'percentage', value: 150 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 100 })], payload })
    expect(result).toMatchObject({ discount: 100, ok: true })
  })

  it('never lets a restricted coupon discount more than the eligible lines', async () => {
    // A fixed 500 coupon restricted to one 100 MAD product must not eat into
    // the rest of the cart.
    const { payload } = stubPayload({
      coupons: [coupon({ eligibility: { products: [1] }, type: 'fixed', value: 500 })],
    })
    const result = await evaluateCoupon({
      code: 'WELCOME10',
      lines: [line({ price: 100, productId: 1 }), line({ price: 900, productId: 2 })],
      payload,
    })
    expect(result).toMatchObject({ discount: 100, eligibleSubtotal: 100, ok: true })
  })

  it('refuses a coupon that would produce no discount at all', async () => {
    for (const value of [0, -25]) {
      const { payload } = stubPayload({ coupons: [coupon({ type: 'percentage', value })] })
      const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 100 })], payload })
      expect(result).toMatchObject({ ok: false, reason: 'not_applicable' })
    }

    const capped = stubPayload({ coupons: [coupon({ maximumDiscount: 0, type: 'percentage', value: 50 })] })
    expect(await evaluateCoupon({ code: 'WELCOME10', lines: [line()], payload: capped.payload })).toMatchObject({
      ok: false,
      reason: 'not_applicable',
    })
  })

  it('rounds the discount to the centime instead of emitting float drift', async () => {
    // 33% of 0.1 * 3 would otherwise carry a long fractional tail.
    const { payload } = stubPayload({ coupons: [coupon({ type: 'percentage', value: 33 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 10.1, quantity: 3 })], payload })

    const discount = (result as { discount: number }).discount
    expect(discount).toBe(10)
    expect(Number.isInteger(Math.round(discount * 100))).toBe(true)
  })

  it('prices the cart only from the line prices it is given', async () => {
    // Nothing in the request body can influence the amount: the caller passes
    // prices read from the products table, and doubling the quantity is the
    // only way the eligible subtotal moves.
    const { payload } = stubPayload({ coupons: [coupon({ type: 'percentage', value: 10 })] })
    const single = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 100, quantity: 1 })], payload })
    const double = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 100, quantity: 2 })], payload })

    expect((single as { eligibleSubtotal: number }).eligibleSubtotal).toBe(100)
    expect((double as { eligibleSubtotal: number }).eligibleSubtotal).toBe(200)
  })

  it('handles an empty cart without inventing a discount', async () => {
    const { payload } = stubPayload({ coupons: [coupon({ type: 'fixed', value: 50 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [], payload })
    expect(result).toMatchObject({ ok: false, reason: 'not_applicable' })
  })
})

describe('evaluateCoupon — order of checks', () => {
  it('reports expiry rather than the minimum when a coupon fails both', async () => {
    // The cheap, certain "no" comes first; the minimum message quotes an
    // eligible subtotal that only means something once the coupon is valid.
    const { payload } = stubPayload({ coupons: [coupon({ endDate: past(), minimumAmount: 10_000 })] })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 10 })], payload })
    expect(result).toMatchObject({ ok: false, reason: 'expired' })
  })

  it('reports inapplicability rather than the minimum when the coupon matches nothing', async () => {
    const { payload } = stubPayload({
      coupons: [coupon({ eligibility: { products: [999] }, minimumAmount: 10_000 })],
    })
    const result = await evaluateCoupon({ code: 'WELCOME10', lines: [line({ price: 10 })], payload })
    expect(result).toMatchObject({ ok: false, reason: 'not_applicable' })
  })
})

describe('resolveShipping', () => {
  const rules: ShippingRow[] = [
    { city: 'Casablanca', freeFrom: 500, id: 1, price: 25 },
    { city: 'Rabat', freeFrom: null, id: 2, price: 35 },
    { id: 3, isDefault: true, price: 45, freeFrom: 800 },
  ]

  it('matches the city rule', async () => {
    const { payload } = stubPayload({ shippingRules: rules })
    const result = await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 100 })
    expect(result).toMatchObject({ cost: 25, freeFrom: 500, ruleId: 1 })
    expect(result.label).toContain('Casablanca')
  })

  it('matches a city regardless of case and accents', async () => {
    const { payload } = stubPayload({ shippingRules: rules })
    for (const city of ['casablanca', 'CASABLANCA', '  Casablanca  ']) {
      const result = await resolveShipping({ city, payload, subtotalAfterDiscount: 100 })
      expect(result.ruleId).toBe(1)
    }
  })

  it('strips accents on both sides of the comparison', async () => {
    const { payload } = stubPayload({ shippingRules: [{ city: 'Témara', freeFrom: null, id: 9, price: 30 }] })
    const result = await resolveShipping({ city: 'temara', payload, subtotalAfterDiscount: 100 })
    expect(result.ruleId).toBe(9)
  })

  it('falls back to the default rule for an unknown city', async () => {
    const { payload } = stubPayload({ shippingRules: rules })
    const result = await resolveShipping({ city: 'Tanger', payload, subtotalAfterDiscount: 100 })
    expect(result).toMatchObject({ cost: 45, ruleId: 3 })
  })

  it('falls back to the default rule when no city is given', async () => {
    const { payload } = stubPayload({ shippingRules: rules })
    for (const city of [null, undefined, '']) {
      const result = await resolveShipping({ city, payload, subtotalAfterDiscount: 100 })
      expect(result.ruleId).toBe(3)
    }
  })

  it('delivers free rather than inventing an amount when nothing is configured', async () => {
    const { payload } = stubPayload({ shippingRules: [] })
    const result = await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 100 })
    expect(result).toEqual({ cost: 0, freeFrom: null, label: 'Livraison', ruleId: null })
  })

  it('charges nothing once the free-shipping threshold is reached', async () => {
    const { payload } = stubPayload({ shippingRules: rules })
    expect((await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 500 })).cost).toBe(0)
    expect((await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 501 })).cost).toBe(0)
    expect((await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 499 })).cost).toBe(25)
  })

  it('never gives free delivery on a rule that has no threshold', async () => {
    const { payload } = stubPayload({ shippingRules: rules })
    const result = await resolveShipping({ city: 'Rabat', payload, subtotalAfterDiscount: 100_000 })
    expect(result.cost).toBe(35)
  })

  it('measures the threshold after the discount, so a coupon cannot buy shipping too', async () => {
    // A 600 MAD cart with a 150 MAD coupon is a 450 MAD order: below the 500
    // threshold, so delivery is charged again.
    const { payload } = stubPayload({ shippingRules: rules })
    const beforeDiscount = await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 600 })
    const afterDiscount = await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 450 })

    expect(beforeDiscount.cost).toBe(0)
    expect(afterDiscount.cost).toBe(25)
  })

  it('treats a rule with no price as free rather than as NaN', async () => {
    const { payload } = stubPayload({ shippingRules: [{ city: 'Fès', id: 4 }] })
    const result = await resolveShipping({ city: 'Fès', payload, subtotalAfterDiscount: 10 })
    expect(result.cost).toBe(0)
  })

  it('only considers enabled rules', async () => {
    const { calls, payload } = stubPayload({ shippingRules: rules })
    await resolveShipping({ city: 'Casablanca', payload, subtotalAfterDiscount: 10 })
    expect(calls[0].where?.enabled?.equals).toBe(true)
  })
})
