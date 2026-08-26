// @vitest-environment node
//
// The shared vitest config defaults to jsdom for component tests; this suite
// talks to Postgres through Payload's local API and over real HTTP.
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

/**
 * The oversell test.
 *
 * One product, one unit of stock, N simultaneous shoppers. This is the
 * scenario the whole checkout design exists for, and the one that cannot be
 * verified by reading the code: whether the guard actually holds depends on
 * Postgres row locking, on the transaction boundaries being where they look
 * like they are, and on nothing between the check and the write escaping the
 * transaction.
 *
 * The requests are fired with a single `Promise.all` against the real HTTP
 * endpoint, so every collection hook, the real transaction and the real
 * connection pool are all in play — exactly as they would be for real
 * shoppers arriving at the same instant.
 *
 * What must hold, all of it, every run:
 *
 *   - exactly one 200
 *   - every other request 409, never 500 (a crash is not "handled")
 *   - final stock exactly 0, never negative
 *   - exactly one order created
 *   - exactly one stock movement recorded
 *
 * The last two matter as much as the stock: a system that sells one unit but
 * writes two orders is just as broken, and only shows up under concurrency.
 */

/**
 * Deletes scoped to a real id, and nothing else.
 *
 * `payload.delete({ where: { product: { equals: undefined } } })` does not
 * delete nothing — the undefined constraint drops out of the query and the
 * call matches every row in the collection. When a parallel run left one of
 * these ids unset, a teardown quietly wiped the whole stock-movements table
 * and every other suite lost the audit rows it was about to assert on. The
 * failure surfaced somewhere else entirely, which is what made it worth a
 * helper rather than a comment.
 */
async function deleteScoped(
  payload: Payload,
  collection: 'stock-movements' | 'order-status-history',
  field: 'product' | 'order',
  id: number | undefined,
) {
  if (!Number.isInteger(id)) return
  await payload.delete({ collection, where: { [field]: { equals: id } } }).catch(() => {})
}

vi.setConfig({ hookTimeout: 120_000, testTimeout: 120_000 })

const BASE = process.env.TEST_CMS_URL || 'http://localhost:3001'
/** Unique per run. The order assertions count rows by customer email, so a
 * fixed address makes every run see the orders left by the previous one — the
 * suite would report an oversell that never happened, and a genuine one would
 * be indistinguishable from residue. */
const EMAIL = `concurrent-stock-${Date.now()}@paradhiver.test`

/** High enough that the pool (max 5) is genuinely contended and requests
 * queue, which is where a lock-ordering bug would surface. */
const CONCURRENCY = 100

let payload: Payload
let productId: number
let variantProductId: number
let variantRowId: string
const createdOrderIds: number[] = []

/**
 * Each simulated shopper gets their own source address.
 *
 * This is not a way around the rate limiter — it is what the scenario
 * actually is. A hundred people racing for the last unit are a hundred
 * different clients; a hundred checkouts from *one* address is a different
 * test (rateLimit.int.spec.ts), and the limiter is supposed to stop that one.
 * Sending them all from one IP here would only ever prove the limiter works,
 * while saying nothing about the oversell guard underneath it.
 */
let shopper = 0
function nextClientIp(): string {
  shopper += 1
  return `203.0.113.${shopper % 254 || 1}`
}

async function checkout(
  lines: { id: number; variantId?: string | null; qty: number }[],
  { ip = nextClientIp(), key }: { ip?: string; key?: string } = {},
) {
  const res = await fetch(`${BASE}/api/checkout`, {
    body: JSON.stringify({
      address: '1 rue du Test',
      city: 'Casablanca',
      email: EMAIL,
      lines,
      name: 'Test Concurrent',
    }),
    headers: {
      'Content-Type': 'application/json',
      // Read by lib/rateLimit.ts `clientIp`. In production Cloudflare sets
      // cf-connecting-ip and this header is not trusted first — see the note
      // there on why the order matters.
      'X-Forwarded-For': ip,
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    method: 'POST',
  })
  return { body: await res.json().catch(() => ({})), status: res.status }
}

async function stockOf(id: number): Promise<number> {
  const doc = await payload.findByID({ collection: 'products', depth: 0, id })
  return Number((doc as { stock?: number }).stock ?? 0)
}

async function collectOrders() {
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: { customerEmail: { equals: EMAIL } },
  })
  for (const d of docs) if (!createdOrderIds.includes(d.id as number)) createdOrderIds.push(d.id as number)
  return docs
}

beforeAll(async () => {
  payload = await getPayload({ config })

  // A brand is required to build a coherent product; reuse whatever exists
  // rather than creating one, so the test leaves less behind.
  const brands = await payload.find({ collection: 'brands', limit: 1, overrideAccess: true })
  const brandId = brands.docs[0]?.id

  const base = {
    brand: brandId,
    category: 'Visage' as const,
    description: 'Produit de test concurrence',
    isPublished: true,
    price: 100,
    stock: 1,
  }

  const product = await payload.create({
    collection: 'products',
    data: { ...base, name: `TEST Concurrence ${Date.now()}`, sku: `TEST-CONC-${Date.now()}` },
  })
  productId = product.id as number

  const withVariant = await payload.create({
    collection: 'products',
    data: {
      ...base,
      hasVariants: true,
      name: `TEST Concurrence Variante ${Date.now()}`,
      sku: `TEST-CONCV-${Date.now()}`,
      variantOptionType: 'contenance',
      variantPricingMode: 'same-price',
      variants: [{ active: true, optionValue: '100 ml', stock: 1 }],
    },
  })
  variantProductId = withVariant.id as number
  variantRowId = String((withVariant as { variants?: { id?: string }[] }).variants?.[0]?.id)
})

afterAll(async () => {
  for (const id of createdOrderIds) {
    await deleteScoped(payload, 'order-status-history', 'order', id)
    await payload.delete({ collection: 'orders', id }).catch(() => {})
  }
  for (const id of [productId, variantProductId]) {
    await deleteScoped(payload, 'stock-movements', 'product', id)
    if (Number.isInteger(id)) await payload.delete({ collection: 'products', id }).catch(() => {})
  }
})

describe('concurrent checkout on the last unit', () => {
  it(`sells exactly one unit to ${CONCURRENCY} simultaneous buyers`, async () => {
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, () => checkout([{ id: productId, qty: 1 }])),
    )

    const ok = results.filter((r) => r.status === 200)
    const conflict = results.filter((r) => r.status === 409)
    const other = results.filter((r) => r.status !== 200 && r.status !== 409)

    // Reported before the assertions so a failure shows the real distribution
    // rather than just "expected 1, got 2".
    console.log(
      `concurrent checkout: ${ok.length} x 200, ${conflict.length} x 409, ` +
        `${other.length} x other ${JSON.stringify([...new Set(other.map((o) => o.status))])}`,
    )

    expect(ok).toHaveLength(1)
    expect(other).toHaveLength(0)
    expect(conflict).toHaveLength(CONCURRENCY - 1)
  })

  it('leaves stock at exactly zero, never negative', async () => {
    expect(await stockOf(productId)).toBe(0)
  })

  it('creates exactly one order and one stock movement', async () => {
    const orders = await collectOrders()
    expect(orders).toHaveLength(1)

    const movements = await payload.find({
      collection: 'stock-movements',
      limit: 50,
      overrideAccess: true,
      where: { product: { equals: productId } },
    })
    expect(movements.docs).toHaveLength(1)
    expect(Number((movements.docs[0] as { delta?: number }).delta)).toBe(-1)
  })

  it('applies the same guarantee to a variant’s own stock', async () => {
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, () =>
        checkout([{ id: variantProductId, qty: 1, variantId: variantRowId }]),
      ),
    )

    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
    expect(results.filter((r) => r.status !== 200 && r.status !== 409)).toHaveLength(0)

    // Both counters the checkout decrements have to land on zero: the
    // product's own stock and the variant row's.
    expect(await stockOf(variantProductId)).toBe(0)

    const doc = await payload.findByID({ collection: 'products', depth: 0, id: variantProductId })
    const variant = (doc as { variants?: { id?: string; stock?: number }[] }).variants?.find(
      (v) => String(v.id) === variantRowId,
    )
    expect(Number(variant?.stock)).toBe(0)
  })
})
