// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

/**
 * Duplicate checkout requests.
 *
 * The concurrency suite proves two *different* shoppers cannot both buy the
 * last unit. This proves the other half: one shopper whose request arrives
 * twice — a double-clicked button, a retry after a dropped response, a
 * browser replaying a POST — gets one order, not two.
 *
 * That case is invisible to the stock transaction, because both requests are
 * individually valid: there is stock, the cart is real, the prices check out.
 * Only the idempotency key can tell them apart.
 *
 * Both shapes are covered, because they fail differently:
 *   - sequential replay  -> the second request reads a completed row
 *   - simultaneous burst -> N requests race the same INSERT, one wins
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
const EMAIL = `idempotency-${Date.now()}@paradhiver.test`

let payload: Payload
let productId: number
const createdOrderIds: number[] = []

/** One address per scenario. Each test is a different shopper retrying, and
 * separating them keeps one test's requests from spending another's rate-limit
 * budget — which would make a failure here look like an idempotency bug when
 * it is really test interference. */
let scenario = 0
const nextClientIp = () => `198.51.100.${(scenario += 1) % 254 || 1}`

async function checkout(qty: number, key?: string, ip = nextClientIp()) {
  const res = await fetch(`${BASE}/api/checkout`, {
    body: JSON.stringify({
      address: '1 rue du Test',
      city: 'Casablanca',
      email: EMAIL,
      lines: [{ id: productId, qty }],
      name: 'Test Idempotence',
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    method: 'POST',
  })
  return {
    body: await res.json().catch(() => ({})),
    replay: res.headers.get('idempotent-replay') === 'true',
    status: res.status,
  }
}

async function stockOf(id: number): Promise<number> {
  const doc = await payload.findByID({ collection: 'products', depth: 0, id })
  return Number((doc as { stock?: number }).stock ?? 0)
}

async function ordersForThisRun() {
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: { customerEmail: { equals: EMAIL } },
  })
  for (const d of docs) if (!createdOrderIds.includes(d.id as number)) createdOrderIds.push(d.id as number)
  return docs
}

beforeAll(async () => {
  payload = await getPayload({ config })
  const brands = await payload.find({ collection: 'brands', limit: 1, overrideAccess: true })
  const product = await payload.create({
    collection: 'products',
    data: {
      brand: brands.docs[0]?.id,
      category: 'Visage',
      description: 'Produit de test idempotence',
      isPublished: true,
      name: `TEST Idempotence ${Date.now()}`,
      price: 100,
      sku: `TEST-IDEM-${Date.now()}`,
      stock: 50,
    },
  })
  productId = product.id as number
})

afterAll(async () => {
  for (const id of createdOrderIds) {
    await deleteScoped(payload, 'order-status-history', 'order', id)
    await payload.delete({ collection: 'orders', id }).catch(() => {})
  }
  await deleteScoped(payload, 'stock-movements', 'product', productId)
  if (Number.isInteger(productId)) await payload.delete({ collection: 'products', id: productId }).catch(() => {})
})

describe('checkout idempotency', () => {
  it('replays the first response instead of placing a second order', async () => {
    const ip = nextClientIp()
    const key = `test-seq-${Date.now()}`
    const before = await stockOf(productId)

    const first = await checkout(2, key, ip)
    const second = await checkout(2, key, ip)

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)

    // Same order number, and the replay says so.
    expect(second.body.orderNumber).toBe(first.body.orderNumber)
    expect(first.replay).toBe(false)
    expect(second.replay).toBe(true)

    // The decisive assertion: stock moved once, for one order's worth.
    expect(await stockOf(productId)).toBe(before - 2)
    expect(await ordersForThisRun()).toHaveLength(1)
  })

  it('serialises a simultaneous burst of the same key into one order', async () => {
    const ip = nextClientIp()
    const key = `test-burst-${Date.now()}`
    const before = await stockOf(productId)

    const results = await Promise.all(Array.from({ length: 10 }, () => checkout(1, key, ip)))

    // Whoever wins the INSERT runs the checkout; everyone else either replays
    // its stored response or is told it is still running. Nothing 500s, and
    // crucially nothing places a second order.
    const created = results.filter((r) => r.status === 200 && !r.replay)
    const replayed = results.filter((r) => r.replay)
    const inFlight = results.filter((r) => r.status === 409)

    console.log(
      `idempotent burst: ${created.length} exécutée, ${replayed.length} rejouée(s), ` +
        `${inFlight.length} en cours, statuts ${JSON.stringify([...new Set(results.map((r) => r.status))])}`,
    )

    expect(created).toHaveLength(1)
    expect(created.length + replayed.length + inFlight.length).toBe(10)
    expect(await stockOf(productId)).toBe(before - 1)
    expect(await ordersForThisRun()).toHaveLength(2)
  })

  it('refuses a key reused for a different cart', async () => {
    const ip = nextClientIp()
    const key = `test-mismatch-${Date.now()}`
    const first = await checkout(1, key, ip)
    expect(first.status).toBe(200)

    // Same key, different quantity — a client bug. Replaying the first
    // response here would tell the shopper an order was placed that never was.
    const reused = await checkout(3, key, ip)
    expect(reused.status).toBe(422)
  })

  it('still works with no key at all', async () => {
    // The header is optional: a client that has not adopted it must keep
    // being able to order, unprotected but functional.
    const res = await checkout(1, undefined, nextClientIp())
    expect(res.status).toBe(200)
    expect(res.body.orderNumber).toBeTruthy()
  })
})
