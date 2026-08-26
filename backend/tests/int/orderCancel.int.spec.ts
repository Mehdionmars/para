// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import type { OrderStatus } from '@/lib/orderStatus'

/**
 * Stock restoration on cancellation.
 *
 * The checkout decrements *two* counters when a variant is bought: the
 * product's own `stock`, which drives catalogue availability, and the variant
 * row's `stock`, which drives whether that option can be picked. The
 * restoration hook on Orders only ever credited the first one back.
 *
 * So every cancelled or refunded order of a variant silently destroyed
 * inventory: the option stayed short by the quantity sold, permanently, with
 * no movement recorded against it and nothing in the UI to suggest anything
 * was wrong. It only becomes visible when an option that should have units
 * reports itself sold out.
 *
 * These tests pin both halves of the fix, and the guard that was already
 * right — that only the *transition* into a releasing status credits stock,
 * so re-saving a cancelled order does not inflate it.
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
const EMAIL = `order-cancel-${Date.now()}@paradhiver.test`

const INITIAL_PRODUCT_STOCK = 20
const INITIAL_VARIANT_STOCK = 8
const BOUGHT = 3

let payload: Payload
let productId: number
let variantRowId: string
let orderId: number
let firstOrderNumber: string

const placedOrderIds: number[] = []

/** Buys `qty` of the variant through the real checkout and returns the new
 * order's id, so each scenario gets its own order rather than reusing one
 * whose status has already moved. */
async function placeOrder(qty: number): Promise<number> {
  const res = await fetch(`${BASE}/api/checkout`, {
    body: JSON.stringify({
      address: '1 rue du Test',
      city: 'Casablanca',
      email: EMAIL,
      lines: [{ id: productId, qty, variantId: variantRowId }],
      name: 'Test Annulation',
    }),
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.44' },
    method: 'POST',
  })
  expect(res.status).toBe(200)
  const { orderNumber } = await res.json()

  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { orderNumber: { equals: orderNumber } },
  })
  const id = docs[0].id as number
  placedOrderIds.push(id)
  if (!firstOrderNumber) firstOrderNumber = orderNumber
  return id
}

async function readStock(): Promise<{ product: number; variant: number }> {
  const doc = await payload.findByID({ collection: 'products', depth: 0, id: productId })
  const typed = doc as { stock?: number; variants?: { id?: string; stock?: number }[] }
  const variant = typed.variants?.find((v) => String(v.id) === variantRowId)
  return { product: Number(typed.stock ?? 0), variant: Number(variant?.stock ?? 0) }
}

async function setStatus(status: OrderStatus) {
  await payload.update({ collection: 'orders', data: { status }, id: orderId, overrideAccess: true })
}

beforeAll(async () => {
  payload = await getPayload({ config })
  const brands = await payload.find({ collection: 'brands', limit: 1, overrideAccess: true })

  const product = await payload.create({
    collection: 'products',
    data: {
      brand: brands.docs[0]?.id,
      category: 'Visage',
      description: 'Produit de test annulation',
      hasVariants: true,
      isPublished: true,
      name: `TEST Annulation ${Date.now()}`,
      price: 120,
      sku: `TEST-CANCEL-${Date.now()}`,
      stock: INITIAL_PRODUCT_STOCK,
      variantOptionType: 'contenance',
      variantPricingMode: 'same-price',
      variants: [{ active: true, optionValue: '200 ml', stock: INITIAL_VARIANT_STOCK }],
    },
  })
  productId = product.id as number
  variantRowId = String((product as { variants?: { id?: string }[] }).variants?.[0]?.id)

  orderId = await placeOrder(BOUGHT)
})

afterAll(async () => {
  for (const id of placedOrderIds) {
    await deleteScoped(payload, 'order-status-history', 'order', id)
    await payload.delete({ collection: 'orders', id }).catch(() => {})
  }
  await deleteScoped(payload, 'stock-movements', 'product', productId)
  if (Number.isInteger(productId)) await payload.delete({ collection: 'products', id: productId }).catch(() => {})
})

describe('cancelling an order restores stock', () => {
  it('has decremented both counters at purchase time', async () => {
    const stock = await readStock()
    expect(stock.product).toBe(INITIAL_PRODUCT_STOCK - BOUGHT)
    expect(stock.variant).toBe(INITIAL_VARIANT_STOCK - BOUGHT)
  })

  it('credits back the product AND the variant on cancellation', async () => {
    // pending -> confirmed -> cancelled, following the transition table in
    // lib/orderStatus.ts rather than jumping straight to a status the guard
    // would refuse.
    await setStatus('confirmed')
    await setStatus('cancelled')

    const stock = await readStock()

    console.log(
      `après annulation: produit ${stock.product}/${INITIAL_PRODUCT_STOCK}, ` +
        `variante ${stock.variant}/${INITIAL_VARIANT_STOCK}`,
    )

    expect(stock.product).toBe(INITIAL_PRODUCT_STOCK)
    // This is the assertion that failed before the fix: the variant stayed at
    // INITIAL_VARIANT_STOCK - BOUGHT forever.
    expect(stock.variant).toBe(INITIAL_VARIANT_STOCK)
  })

  it('does not credit again when a cancelled order is re-saved', async () => {
    // Editing anything on an already-cancelled order must not put the units
    // back a second time — that would inflate stock every time an operator
    // touches the record.
    await payload.update({
      collection: 'orders',
      data: { notes: 'Vérification anti double-crédit' },
      id: orderId,
      overrideAccess: true,
    })

    const stock = await readStock()
    expect(stock.product).toBe(INITIAL_PRODUCT_STOCK)
    expect(stock.variant).toBe(INITIAL_VARIANT_STOCK)
  })

  it('credits once across returned -> refunded, which are both releasing', async () => {
    // `cancelled` is terminal (ORDER_STATUS_TRANSITIONS), so the real
    // "two releasing statuses in a row" path is delivered -> returned ->
    // refunded. Both statuses release stock, and only the first transition
    // into a releasing one may credit it.
    const second = await placeOrder(2)

    const path: OrderStatus[] = ['confirmed', 'preparing', 'shipped', 'delivered', 'returned']
    for (const status of path) {
      await payload.update({ collection: 'orders', data: { status }, id: second, overrideAccess: true })
    }

    const afterReturn = await readStock()
    expect(afterReturn.product).toBe(INITIAL_PRODUCT_STOCK)
    expect(afterReturn.variant).toBe(INITIAL_VARIANT_STOCK)

    // returned -> refunded: still releasing, must be a no-op for stock.
    await payload.update({ collection: 'orders', data: { status: 'refunded' }, id: second, overrideAccess: true })

    const afterRefund = await readStock()
    expect(afterRefund.product).toBe(INITIAL_PRODUCT_STOCK)
    expect(afterRefund.variant).toBe(INITIAL_VARIANT_STOCK)
  })

  it('records the restoration as a stock movement', async () => {
    // Read with a short bounded retry.
    //
    // The rows are written by the dev server, on its own pool and its own
    // connections; this assertion reads them through a separate Payload
    // instance in the test process. Under the full parallel suite that gap is
    // occasionally wide enough for a single read to miss a row the server has
    // just committed. Retrying for a few seconds removes the race without
    // weakening what is asserted — the expectation below is unchanged, only
    // the number of chances to observe it.
    //
    // (The far larger cause of this test failing was elsewhere and is fixed:
    // orderStatus.int.spec.ts used to tear down with
    // `DELETE FROM stock_movements WHERE reason LIKE '%PDH-%'`, which matched
    // every order-sourced movement in the database and wiped other suites'
    // audit rows mid-run.)
    const deadline = Date.now() + 10_000
    let deltas: number[] = []

    do {
      const movements = await payload.find({
        collection: 'stock-movements',
        limit: 50,
        overrideAccess: true,
        where: { product: { equals: productId } },
      })

      // Matched on the order number rather than on the delta: the suite places
      // a second order in an earlier test, so filtering by quantity alone
      // would depend on the two orders having different quantities — a detail
      // no assertion should rest on.
      deltas = movements.docs
        .filter((m) => String((m as { reason?: string }).reason ?? '').includes(firstOrderNumber))
        .map((m) => Number((m as { delta?: number }).delta))
        .sort((a, b) => a - b)

      if (deltas.length === 2) break
      await new Promise((resolve) => setTimeout(resolve, 250))
    } while (Date.now() < deadline)

    // Exactly two entries, and they cancel out: the sale and its return. An
    // audit trail that does not net to zero for a fully cancelled order is the
    // thing a stock reconciliation would trip over.
    expect(deltas).toEqual([-BOUGHT, BOUGHT])
  })
})
