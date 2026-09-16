// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The routine offer through the real checkout route.
 *
 * lib/routineOffer.ts is tested on its own; this proves the route actually
 * uses it the way the product page promises: the amount the order records is
 * the one the shopper was shown, a coupon and the offer never stack, and a lot
 * the storefront could not have built earns nothing.
 *
 * Same boundaries as checkoutCompensation.spec.ts — the pg pool, the Payload
 * SDK, notifications, and the coupon/shipping pricing — and the routine
 * module is deliberately NOT mocked: it is the code under test.
 */

type PricingFn = (...args: unknown[]) => Promise<unknown>

const h = vi.hoisted(() => ({
  evaluateCoupon: null as unknown as PricingFn,
  payload: null as unknown as Record<string, unknown>,
  resolveShipping: null as unknown as PricingFn,
}))

vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/notifications/service', () => ({ notifyOrderEvent: async () => {} }))
vi.mock('@/lib/notifications/stock', () => ({ notifyStockChange: async () => {} }))
vi.mock('@/lib/pricing', () => ({
  evaluateCoupon: (...args: unknown[]) => h.evaluateCoupon(...args),
  resolveShipping: (...args: unknown[]) => h.resolveShipping(...args),
}))

const { POST } = await import('@/app/api/checkout/route')

type Product = { name: string; price: number; category: string; relatedProducts?: number[] }

function makeEnv(products: Record<number, Product>, routineOffer?: Record<string, unknown>) {
  const created: { collection: string; data?: Record<string, unknown> }[] = []

  const answer = async (sql: string, params: unknown[]) => {
    if (/FROM products WHERE id/.test(sql)) {
      const id = Number(params[0])
      const p = products[id]
      if (!p) return { rowCount: 0, rows: [] }
      return {
        rowCount: 1,
        rows: [
          {
            brand_id: null,
            category: p.category,
            discontinued: false,
            has_variants: false,
            id,
            is_published: true,
            low_stock_threshold: 0,
            name: p.name,
            price: p.price,
            sku: `SKU-${id}`,
            stock: 50,
            variant_option_type: null,
            variant_pricing_mode: 'same-price',
          },
        ],
      }
    }
    if (/UPDATE products SET stock = stock - /.test(sql)) return { rowCount: 1, rows: [{ stock: 40 }] }
    return { rowCount: 0, rows: [] }
  }

  const pool = {
    connect: async () => ({ query: (sql: string, params: unknown[] = []) => answer(sql, params), release: () => {} }),
    query: (sql: string, params: unknown[] = []) => answer(sql, params),
  }

  h.payload = {
    create: async ({ collection, data }: { collection: string; data?: Record<string, unknown> }) => {
      created.push({ collection, data })
      return { id: 4242, orderNumber: 'PDH-TEST' }
    },
    db: { pool },
    // What lib/routineOffer.ts reads: each product's category and its picks.
    find: async ({ collection, where }: { collection: string; where?: { id?: { in?: number[] } } }) => {
      if (collection !== 'products') return { docs: [], totalDocs: 0 }
      const ids = where?.id?.in ?? []
      const docs = ids
        .filter((id) => products[id])
        .map((id) => ({ category: products[id].category, id, relatedProducts: products[id].relatedProducts ?? [] }))
      return { docs, totalDocs: docs.length }
    },
    findGlobal: async () => ({ codEnabled: true, routineOffer }),
    logger: { error: () => {}, info: () => {}, warn: () => {} },
  }

  const orderData = () => created.find((c) => c.collection === 'orders')?.data ?? {}
  return { created, orderData }
}

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/checkout', { body: JSON.stringify(body), method: 'POST' }))

const checkout = (extra: Record<string, unknown>) => ({
  address: '12 rue Test',
  city: 'Casablanca',
  email: 'shopper@example.com',
  lines: [
    { id: 1, qty: 1 },
    { id: 2, qty: 1 },
  ],
  name: 'Test Shopper',
  phone: '0600000000',
  ...extra,
})

const OFFER_ON = { enabled: true, minItems: 2, percent: 15 }
const BB_AND_SUN: Record<number, Product> = {
  1: { category: 'Solaire', name: 'BB Cream SPF 30', price: 400 },
  2: { category: 'Solaire', name: 'Solar Defense 50', price: 370 },
}

beforeEach(() => {
  h.evaluateCoupon = vi.fn(async () => ({ ok: false, reason: 'not_found', message: 'Code promo invalide.' }))
  h.resolveShipping = vi.fn(async () => ({ cost: 0, freeFrom: 399, label: 'Livraison', ruleId: 1 }))
})

describe('the routine offer at checkout', () => {
  it('charges the lot total the product page showed', async () => {
    const env = makeEnv(BB_AND_SUN, OFFER_ON)

    const res = await post(checkout({ routines: [{ anchorId: 1, productIds: [1, 2] }] }))
    const body = await res.json()

    // 400 + 370 = 770, 15% = 115.5, total 654.5 — the figures in the block.
    expect(res.status).toBe(200)
    expect(body).toMatchObject({ discount: 115.5, routineDiscount: 115.5, subtotal: 770, total: 654.5 })
    expect(env.orderData()).toMatchObject({ discount: 115.5, routineDiscount: 115.5, total: 654.5 })
  })

  it('grants nothing while the offer is switched off in the CMS', async () => {
    const env = makeEnv(BB_AND_SUN, { ...OFFER_ON, enabled: false })

    const body = await (await post(checkout({ routines: [{ anchorId: 1, productIds: [1, 2] }] }))).json()

    expect(body).toMatchObject({ discount: 0, routineDiscount: 0, total: 770 })
    expect(env.orderData()).toMatchObject({ discount: 0, routineDiscount: 0 })
  })

  it('refuses a lot the storefront could not have built', async () => {
    // Two unrelated products from different categories, posted as a lot.
    const env = makeEnv(
      {
        1: { category: 'Solaire', name: 'BB Cream SPF 30', price: 400 },
        2: { category: 'Cheveux', name: 'Ampoules cheveux', price: 370 },
      },
      OFFER_ON,
    )

    const body = await (await post(checkout({ routines: [{ anchorId: 1, productIds: [1, 2] }] }))).json()

    expect(body).toMatchObject({ discount: 0, routineDiscount: 0, total: 770 })
    expect(env.orderData()).toMatchObject({ routineDiscount: 0 })
  })

  it('applies the coupon instead when it is worth more, and records no routine discount', async () => {
    const env = makeEnv(BB_AND_SUN, OFFER_ON)
    h.evaluateCoupon = vi.fn(async () => ({ code: 'HIVER30', couponId: 9, discount: 231, eligibleSubtotal: 770, ok: true }))

    const body = await (
      await post(checkout({ couponCode: 'HIVER30', routines: [{ anchorId: 1, productIds: [1, 2] }] }))
    ).json()

    expect(body).toMatchObject({ couponApplied: 'HIVER30', discount: 231, routineDiscount: 0 })
    expect(env.orderData()).toMatchObject({ couponCode: 'HIVER30', discount: 231, routineDiscount: 0 })
  })

  it('applies the routine instead when it is worth more, and burns no coupon redemption', async () => {
    const env = makeEnv(BB_AND_SUN, OFFER_ON)
    h.evaluateCoupon = vi.fn(async () => ({ code: 'BIENVENUE', couponId: 9, discount: 20, eligibleSubtotal: 770, ok: true }))

    const body = await (
      await post(checkout({ couponCode: 'BIENVENUE', routines: [{ anchorId: 1, productIds: [1, 2] }] }))
    ).json()

    expect(body).toMatchObject({ couponApplied: null, discount: 115.5, routineDiscount: 115.5 })
    expect(env.orderData().couponCode).toBeUndefined()
    // A coupon that did not discount this order must not count as used.
    expect(env.created.some((c) => c.collection === 'coupon-redemptions')).toBe(false)
  })
})
