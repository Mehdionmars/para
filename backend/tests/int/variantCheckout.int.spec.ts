// @vitest-environment node
//
// The shared vitest config defaults to jsdom for component tests; this suite
// talks to Postgres through Payload's local API and over real HTTP, and needs
// node builtins.
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

/**
 * Buying a specific variant, end to end.
 *
 * The cart used to be keyed on the product alone, so 50 ml and 100 ml of one
 * cream collapsed into "Produit × 2", the order line recorded neither which
 * option had been sold nor its SKU, and the checkout priced and decremented
 * the product's own stock whatever the shopper had picked. These tests pin
 * the whole path: two options of one product are two order lines, each with
 * its own price, label and SKU, and each drawing on its own stock.
 *
 * They run against the real database and the real HTTP endpoint, so every
 * collection hook and the whole transaction fire exactly as they do for a
 * shopper. Everything created here is torn down in afterAll.
 */

vi.setConfig({ hookTimeout: 90_000, testTimeout: 60_000 })

const BASE = process.env.TEST_CMS_URL || 'http://localhost:3001'
const EMAIL = 'variant-checkout@paradhiver.test'

const V50 = { optionValue: '50 ml', price: 200, sku: 'TEST-VAR-50', stock: 10 }
const V100 = { optionValue: '100 ml', price: 300, sku: 'TEST-VAR-100', stock: 4 }
const V_SOLD_OUT = { optionValue: '200 ml', price: 400, sku: 'TEST-VAR-200', stock: 0 }

let payload: Payload
let productId: number
/** Payload's array-row ids, read back after creation — they are the identity
 * the cart, the checkout and the order line all key on. */
let variantIds: Record<string, string> = {}
const createdOrderIds: number[] = []

type CheckoutLine = { id: number; variantId: string | null; qty: number }

async function checkout(lines: CheckoutLine[]) {
  const res = await fetch(`${BASE}/api/checkout`, {
    body: JSON.stringify({
      address: '1 rue du Test',
      city: 'Casablanca',
      email: EMAIL,
      lines,
      name: 'Variant Test',
      phone: '0600000000',
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const body = await res.json()
  return { body, status: res.status }
}

/** The endpoint answers with the human order number, not the row id — the
 * public contract. Tests resolve through it rather than asking the route to
 * leak an internal id it has no reason to expose. */
async function orderByNumber(orderNumber: string) {
  const found = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { orderNumber: { equals: orderNumber } },
  })
  const order = found.docs[0]
  expect(order).toBeTruthy()
  createdOrderIds.push(order.id)
  return order
}

async function readProduct() {
  return payload.findByID({ collection: 'products', id: productId, overrideAccess: true, depth: 0 })
}

/** The stock currently on one variant row, by its option label. */
async function variantStock(optionValue: string): Promise<number> {
  const doc = (await readProduct()) as unknown as { variants?: { optionValue?: string; stock?: number }[] }
  const row = (doc.variants || []).find((v) => v.optionValue === optionValue)
  return Number(row?.stock ?? -1)
}

beforeAll(async () => {
  payload = await getPayload({ config })

  const brand = await payload.find({ collection: 'brands', limit: 1, overrideAccess: true })
  const created = await payload.create({
    collection: 'products',
    data: {
      brand: brand.docs[0]?.id,
      category: 'Visage',
      description: 'Produit de test pour les variantes.',
      hasVariants: true,
      isPublished: true,
      lowStockThreshold: 2,
      name: 'Produit test variantes',
      // Product-level stock has to cover every option: it is the aggregate the
      // catalogue reads and the ceiling the checkout also enforces.
      price: 250,
      sku: 'TEST-VAR-PARENT',
      slug: 'produit-test-variantes',
      stock: 50,
      variantOptionType: 'contenance',
      variantPricingMode: 'per-variant',
      variants: [V50, V100, V_SOLD_OUT],
    },
    overrideAccess: true,
  })
  productId = created.id

  const doc = created as unknown as { variants?: { id?: string; optionValue?: string }[] }
  variantIds = Object.fromEntries((doc.variants || []).map((v) => [String(v.optionValue), String(v.id)]))
})

afterAll(async () => {
  for (const id of createdOrderIds) {
    await payload.delete({ collection: 'orders', id, overrideAccess: true }).catch(() => {})
  }
  if (productId) {
    await payload.delete({ collection: 'products', id: productId, overrideAccess: true }).catch(() => {})
  }
})

describe('product variants', () => {
  it('gives every active variant a stable id', () => {
    expect(variantIds['50 ml']).toBeTruthy()
    expect(variantIds['100 ml']).toBeTruthy()
    expect(variantIds['50 ml']).not.toBe(variantIds['100 ml'])
  })

  it('keeps each variant its own price, stock and SKU', async () => {
    const doc = (await readProduct()) as unknown as {
      variants?: { optionValue?: string; price?: number; stock?: number; sku?: string }[]
    }
    const rows = Object.fromEntries((doc.variants || []).map((v) => [String(v.optionValue), v]))

    expect(Number(rows['50 ml'].price)).toBe(200)
    expect(Number(rows['100 ml'].price)).toBe(300)
    expect(Number(rows['50 ml'].stock)).toBe(10)
    expect(Number(rows['100 ml'].stock)).toBe(4)
    expect(Number(rows['200 ml'].stock)).toBe(0)
    expect(rows['50 ml'].sku).toBe('TEST-VAR-50')
    expect(rows['100 ml'].sku).toBe('TEST-VAR-100')
  })
})

describe('checkout with variants', () => {
  it('records two options of one product as two distinct order lines', async () => {
    const { body, status } = await checkout([
      { id: productId, qty: 1, variantId: variantIds['50 ml'] },
      { id: productId, qty: 2, variantId: variantIds['100 ml'] },
    ])
    expect(status).toBe(200)

    const order = await orderByNumber(body.orderNumber)
    const items = (order as unknown as {
      items: { variantLabel?: string; variantType?: string; price: number; quantity: number; sku?: string }[]
    }).items

    // Two lines, not one line of quantity 3 — the whole point.
    expect(items).toHaveLength(2)

    const byLabel = Object.fromEntries(items.map((i) => [i.variantLabel, i]))
    expect(Object.keys(byLabel).sort()).toEqual(['100 ml', '50 ml'])

    // Each line carries the price of its own option, not the product's 250.
    expect(byLabel['50 ml'].price).toBe(200)
    expect(byLabel['100 ml'].price).toBe(300)
    expect(byLabel['50 ml'].quantity).toBe(1)
    expect(byLabel['100 ml'].quantity).toBe(2)

    // And its own identifiers, snapshotted so a later edit to the product
    // cannot rewrite what was sold.
    expect(byLabel['50 ml'].sku).toBe('TEST-VAR-50')
    expect(byLabel['100 ml'].sku).toBe('TEST-VAR-100')
    expect(byLabel['50 ml'].variantType).toBe('Contenance')

    expect(order.subtotal).toBe(200 * 1 + 300 * 2)
  })

  it('draws each line from its own variant stock, and the product stock once', async () => {
    const before = { fifty: await variantStock('50 ml'), hundred: await variantStock('100 ml') }
    const productBefore = Number((await readProduct()).stock)

    const { status } = await checkout([
      { id: productId, qty: 2, variantId: variantIds['50 ml'] },
      { id: productId, qty: 1, variantId: variantIds['100 ml'] },
    ])
    expect(status).toBe(200)

    expect(await variantStock('50 ml')).toBe(before.fifty - 2)
    expect(await variantStock('100 ml')).toBe(before.hundred - 1)
    // The product's own count is the aggregate across options, so it falls by
    // the total — never twice, and never only by one line.
    expect(Number((await readProduct()).stock)).toBe(productBefore - 3)
  })

  it('merges the same option sent twice into one line', async () => {
    const { body, status } = await checkout([
      { id: productId, qty: 1, variantId: variantIds['50 ml'] },
      { id: productId, qty: 2, variantId: variantIds['50 ml'] },
    ])
    expect(status).toBe(200)

    const order = await orderByNumber(body.orderNumber)
    const items = (order as unknown as { items: { quantity: number }[] }).items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(3)
  })

  it('refuses a sold-out variant while the product itself still has stock', async () => {
    const productBefore = Number((await readProduct()).stock)

    const { body, status } = await checkout([{ id: productId, qty: 1, variantId: variantIds['200 ml'] }])

    expect(status).toBe(409)
    expect(String(body.error)).toMatch(/rupture de stock/i)
    // Nothing was committed: the transaction rolled back whole.
    expect(Number((await readProduct()).stock)).toBe(productBefore)
    expect(await variantStock('200 ml')).toBe(0)
  })

  it('refuses more than a variant holds, even when other options could cover it', async () => {
    const hundredBefore = await variantStock('100 ml')

    const { body, status } = await checkout([
      { id: productId, qty: hundredBefore + 1, variantId: variantIds['100 ml'] },
    ])

    expect(status).toBe(409)
    expect(body.available).toBe(hundredBefore)
    expect(await variantStock('100 ml')).toBe(hundredBefore)
  })

  it('rejects a variant id that does not belong to the product', async () => {
    const { status } = await checkout([{ id: productId, qty: 1, variantId: 'not-a-real-variant-row' }])
    expect(status).toBe(409)
  })

  it('still sells a product with no option at all', async () => {
    const plain = await payload.create({
      collection: 'products',
      data: {
        category: 'Visage',
        description: 'Produit de test sans variante.',
        isPublished: true,
        name: 'Produit test sans variante',
        price: 120,
        slug: 'produit-test-sans-variante',
        stock: 5,
      },
      overrideAccess: true,
    })

    try {
      const { body, status } = await checkout([{ id: plain.id, qty: 2, variantId: null }])
      expect(status).toBe(200)

      const order = await orderByNumber(body.orderNumber)
      const items = (order as unknown as { items: { price: number; variantLabel?: string | null }[] }).items
      expect(items).toHaveLength(1)
      expect(items[0].price).toBe(120)
      // Null, not an empty label pretending to be an option.
      expect(items[0].variantLabel ?? null).toBeNull()

      const after = await payload.findByID({ collection: 'products', id: plain.id, overrideAccess: true, depth: 0 })
      expect(Number(after.stock)).toBe(3)
    } finally {
      await payload.delete({ collection: 'products', id: plain.id, overrideAccess: true }).catch(() => {})
    }
  })
})
