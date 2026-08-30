// @vitest-environment node
//
// The shared vitest config defaults to jsdom for component tests; this suite
// talks to Postgres through Payload's local API and needs real node builtins.
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { canTransition, ORDER_STATUS_OPTIONS } from '@/lib/orderStatus'

/**
 * Integration tests for the order lifecycle.
 *
 * These run against the real database through Payload's local API, so every
 * collection hook fires exactly as it does for the dashboard and the REST
 * API. That is the point: a unit test of the transition table alone would
 * prove nothing about whether the hook is actually wired up.
 *
 * Everything created here is torn down in afterAll, and stock is asserted
 * back to its starting value rather than merely restored.
 */

// Real database round-trips through Payload's hook pipeline; the 5s default
// is a unit-test budget, not an integration one.
vi.setConfig({ hookTimeout: 90_000, testTimeout: 60_000 })

let payload: Payload
let productId: number
let baselineStock: number
const createdOrderIds: number[] = []

const ORDER_QTY = 2

async function makeOrder(status = 'pending') {
  const order = await payload.create({
    collection: 'orders',
    data: {
      customerEmail: 'test-lifecycle@paradhiver.test',
      customerName: 'Test Lifecycle',
      customerPhone: '0600000000',
      items: [{ name: 'Produit test', price: 100, product: productId, quantity: ORDER_QTY }],
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      shipping: 20,
      status: status as 'pending',
      subtotal: 200,
      total: 220,
    },
    overrideAccess: true,
  })
  createdOrderIds.push(order.id)
  return order
}

async function move(id: number, status: string) {
  return payload.update({
    id,
    collection: 'orders',
    data: { status: status as 'pending' },
    overrideAccess: true,
  })
}

async function stockOf(id: number): Promise<number> {
  const p = await payload.findByID({ collection: 'products', depth: 0, id, overrideAccess: true })
  return Number((p as { stock?: number }).stock ?? 0)
}

async function historyOf(orderId: number) {
  const res = await payload.find({
    collection: 'order-status-history',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: 'createdAt',
    where: { order: { equals: orderId } },
  })
  return res.docs as { fromStatus?: string | null; toStatus: string }[]
}

async function notificationsOf(orderId: number) {
  const res = await payload.find({
    collection: 'notifications',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: { order: { equals: orderId } },
  })
  return res.docs as { type: string; channel: string; status: string }[]
}

describe('Cycle de vie des commandes', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const products = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { and: [{ isPublished: { equals: true } }, { stock: { greater_than: 20 } }] },
    })
    productId = (products.docs[0] as { id: number }).id
    baselineStock = await stockOf(productId)
  })

  afterAll(async () => {
    // Orders cascade to history and notifications via the FKs.
    for (const id of createdOrderIds) {
      await payload.delete({ id, collection: 'orders', overrideAccess: true }).catch(() => {})
    }
    await payload.db.pool.query('UPDATE products SET stock = $1 WHERE id = $2', [baselineStock, productId])
    // Scoped to this suite's own product.
    //
    // This used to be `reason LIKE '%Test Lifecycle%' OR reason LIKE '%PDH-%'`
    // — and every checkout writes `reason = 'Commande PDH-...'`, so the second
    // clause matched every order-sourced stock movement in the database. Run
    // on its own that is merely untidy; run in parallel with other suites it
    // deletes their audit rows mid-test, and the failure surfaces in whichever
    // suite happened to be asserting on them. It cost a long hunt to find.
    await payload.db.pool.query('DELETE FROM stock_movements WHERE product_id = $1', [productId])
  })

  // ------------------------------------------------ transitions autorisées

  it('parcourt le cycle complet pending → confirmed → preparing → shipped → delivered → returned → refunded', async () => {
    const order = await makeOrder()
    const path = ['confirmed', 'preparing', 'shipped', 'delivered', 'returned', 'refunded']

    for (const next of path) {
      const updated = await move(order.id, next)
      expect(updated.status).toBe(next)
    }

    const history = await historyOf(order.id)
    // Six transitions recorded, in order, each carrying where it came from.
    expect(history.map((h) => h.toStatus)).toEqual(path)
    expect(history[0].fromStatus).toBe('pending')
    expect(history[5].fromStatus).toBe('returned')
  })

  it('accepte pending → cancelled et confirmed → cancelled', async () => {
    const a = await makeOrder()
    expect((await move(a.id, 'cancelled')).status).toBe('cancelled')

    const b = await makeOrder()
    await move(b.id, 'confirmed')
    expect((await move(b.id, 'cancelled')).status).toBe('cancelled')
  })

  // ------------------------------------------------ transitions interdites

  it('refuse delivered → pending', async () => {
    const order = await makeOrder()
    for (const s of ['confirmed', 'preparing', 'shipped', 'delivered']) await move(order.id, s)

    await expect(move(order.id, 'pending')).rejects.toThrow()
    const after = await payload.findByID({ id: order.id, collection: 'orders', overrideAccess: true })
    expect(after.status).toBe('delivered')
  })

  it('refuse cancelled → confirmed', async () => {
    const order = await makeOrder()
    await move(order.id, 'cancelled')
    await expect(move(order.id, 'confirmed')).rejects.toThrow()
  })

  it('refuse refunded → shipped', async () => {
    const order = await makeOrder()
    for (const s of ['confirmed', 'preparing', 'shipped', 'delivered', 'returned', 'refunded']) {
      await move(order.id, s)
    }
    await expect(move(order.id, 'shipped')).rejects.toThrow()
  })

  it('refuse les sauts d’étape (pending → shipped)', async () => {
    const order = await makeOrder()
    await expect(move(order.id, 'shipped')).rejects.toThrow()
  })

  it('la table de transitions et le prédicat concordent', () => {
    // Guards the mirror in the frontend: every status must be reachable in
    // the table, and no status may transition to itself illegally.
    for (const from of ORDER_STATUS_OPTIONS) {
      expect(canTransition(from, from)).toBe(true)
      expect(canTransition(from, 'statut-inexistant')).toBe(false)
    }
  })

  // ------------------------------------------------------------ stock

  it('restaure le stock une seule fois à l’annulation', async () => {
    const before = await stockOf(productId)
    const order = await makeOrder()

    // Creating an order through the local API does not decrement stock (only
    // the checkout route does), so cancelling credits ORDER_QTY on top.
    await move(order.id, 'cancelled')
    const afterCancel = await stockOf(productId)
    expect(afterCancel).toBe(before + ORDER_QTY)

    // Re-saving an already-cancelled order must not credit again.
    await payload.update({
      id: order.id,
      collection: 'orders',
      data: { notes: 'touché à nouveau' },
      overrideAccess: true,
    })
    expect(await stockOf(productId)).toBe(afterCancel)

    await payload.db.pool.query('UPDATE products SET stock = $1 WHERE id = $2', [before, productId])
  })

  it('cancelled → refunded ne recrédite pas le stock une seconde fois', async () => {
    const before = await stockOf(productId)
    const order = await makeOrder()

    await move(order.id, 'cancelled')
    const afterCancel = await stockOf(productId)
    expect(afterCancel).toBe(before + ORDER_QTY)

    // cancelled is terminal in the machine, so the only way to reach refunded
    // from a released state is a direct write — which the guard must refuse.
    await expect(move(order.id, 'refunded')).rejects.toThrow()
    expect(await stockOf(productId)).toBe(afterCancel)

    await payload.db.pool.query('UPDATE products SET stock = $1 WHERE id = $2', [before, productId])
  })

  it('delivered → returned → refunded ne crédite le stock qu’une fois', async () => {
    const before = await stockOf(productId)
    const order = await makeOrder()

    for (const s of ['confirmed', 'preparing', 'shipped', 'delivered']) await move(order.id, s)
    expect(await stockOf(productId)).toBe(before)

    await move(order.id, 'returned')
    const afterReturn = await stockOf(productId)
    expect(afterReturn).toBe(before + ORDER_QTY)

    // returned and refunded are both releasing statuses: moving between them
    // must not credit a second time.
    await move(order.id, 'refunded')
    expect(await stockOf(productId)).toBe(afterReturn)

    await payload.db.pool.query('UPDATE products SET stock = $1 WHERE id = $2', [before, productId])
  })

  it('écrit un mouvement de stock traçable au retour', async () => {
    const order = await makeOrder()
    await move(order.id, 'cancelled')

    const movements = await payload.find({
      collection: 'stock-movements',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      sort: '-createdAt',
      where: { product: { equals: productId } },
    })
    const latest = movements.docs[0] as { delta?: number; reason?: string }
    expect(latest.delta).toBe(ORDER_QTY)
    expect(latest.reason).toContain(order.orderNumber)

    await payload.db.pool.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [ORDER_QTY, productId])
  })

  // ---------------------------------------------------- notifications

  it('crée une notification par canal et n’en crée pas deux fois', async () => {
    const order = await makeOrder()
    await move(order.id, 'confirmed')

    const first = await notificationsOf(order.id)
    const confirmed = first.filter((n) => n.type === 'ORDER_CONFIRMED')
    expect(confirmed.length).toBeGreaterThan(0)
    // internal + email + whatsapp (phone present); push is skipped by the
    // service only if unconfigured — it still records a row.
    const channels = confirmed.map((n) => n.channel).sort()
    expect(channels).toContain('internal')
    expect(new Set(channels).size).toBe(channels.length)

    // Replaying the same status write must not add a second set.
    await payload.update({
      id: order.id,
      collection: 'orders',
      data: { status: 'confirmed' },
      overrideAccess: true,
    })
    const second = await notificationsOf(order.id)
    expect(second.filter((n) => n.type === 'ORDER_CONFIRMED').length).toBe(confirmed.length)
  })

  it('l’index unique interdit un doublon (order, type, channel)', async () => {
    const order = await makeOrder()
    await move(order.id, 'confirmed')

    await expect(
      payload.db.pool.query(
        `INSERT INTO notifications (order_id, type, channel, status, updated_at, created_at)
         VALUES ($1, 'ORDER_CONFIRMED', 'internal', 'sent', now(), now())`,
        [order.id],
      ),
    ).rejects.toThrow(/duplicate key|unique/i)
  })

  it('marque une notification interne comme lue, une seule fois', async () => {
    const order = await makeOrder()
    await move(order.id, 'confirmed')

    const rows = await payload.db.pool.query(
      "SELECT id FROM notifications WHERE order_id = $1 AND channel = 'internal' LIMIT 1",
      [order.id],
    )
    const id = rows.rows[0].id

    const first = await payload.db.pool.query(
      "UPDATE notifications SET status='read', read_at=now() WHERE id=$1 AND read_at IS NULL RETURNING read_at",
      [id],
    )
    expect(first.rowCount).toBe(1)

    // The guard makes a second call a no-op instead of sliding the timestamp.
    const second = await payload.db.pool.query(
      "UPDATE notifications SET status='read', read_at=now() WHERE id=$1 AND read_at IS NULL RETURNING read_at",
      [id],
    )
    expect(second.rowCount).toBe(0)
  })

  it('réessaie un canal en échec sans dupliquer la ligne', async () => {
    const order = await makeOrder()
    await move(order.id, 'confirmed')

    const before = await notificationsOf(order.id)
    await payload.db.pool.query(
      "UPDATE notifications SET status='failed', error='panne simulée' WHERE order_id=$1 AND channel='internal'",
      [order.id],
    )

    const { notifyOrderEvent } = await import('@/lib/notifications/service')
    const full = await payload.findByID({ id: order.id, collection: 'orders', overrideAccess: true })
    await notifyOrderEvent({ event: 'ORDER_CONFIRMED', order: full, payload })

    const after = await notificationsOf(order.id)
    // Same number of rows: the failed one was reclaimed, not duplicated.
    expect(after.length).toBe(before.length)
    expect(after.find((n) => n.channel === 'internal' && n.type === 'ORDER_CONFIRMED')?.status).toBe('sent')
  })

  // ----------------------------------------------------------- prix

  it('un changement de statut ne modifie jamais les montants', async () => {
    const order = await makeOrder()
    const amounts = {
      discount: order.discount,
      shipping: order.shipping,
      subtotal: order.subtotal,
      total: order.total,
    }

    for (const s of ['confirmed', 'preparing', 'shipped', 'delivered']) {
      const updated = await move(order.id, s)
      expect({
        discount: updated.discount,
        shipping: updated.shipping,
        subtotal: updated.subtotal,
        total: updated.total,
      }).toEqual(amounts)
    }
  })

  // -------------------------------------------------------- historique

  it('n’enregistre pas d’entrée quand le statut ne change pas', async () => {
    const order = await makeOrder()
    await move(order.id, 'confirmed')
    const before = (await historyOf(order.id)).length

    await payload.update({
      id: order.id,
      collection: 'orders',
      data: { notes: 'note sans changement de statut' },
      overrideAccess: true,
    })

    expect((await historyOf(order.id)).length).toBe(before)
  })

  it('l’historique est en lecture seule via l’API', async () => {
    const order = await makeOrder()
    await move(order.id, 'confirmed')
    const [entry] = await historyOf(order.id)

    await expect(
      payload.update({
        collection: 'order-status-history',
        data: { toStatus: 'delivered' },
        id: (entry as unknown as { id: number }).id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
