// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { notifyOrderEvent } from '@/lib/notifications/service'
import { notifyStockChange } from '@/lib/notifications/stock'

vi.setConfig({ hookTimeout: 90_000, testTimeout: 60_000 })

let payload: Payload
let orderId: number
let productId: number
let productName: string
const KEY = 'recipient-test'

async function rowsForOrder() {
  const res = await payload.db.pool.query(
    `SELECT channel, recipient_type, recipient_ref, customer_email
       FROM notifications WHERE order_id = $1 ORDER BY channel`,
    [orderId],
  )
  return res.rows as { channel: string; customer_email: string | null; recipient_ref: string | null; recipient_type: string }[]
}

describe('Destinataire des notifications', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const products = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: 'id',
      where: { isPublished: { equals: true } },
    })
    const p = products.docs[0] as { id: number; name: string }
    productId = p.id
    productName = p.name

    const order = await payload.create({
      collection: 'orders',
      data: {
        customerEmail: 'client-recipient@paradhiver.test',
        customerName: 'Client Destinataire',
        customerPhone: '0600112233',
        items: [{ name: 'Article', price: 100, product: productId, quantity: 1 }],
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending',
        shipping: 0,
        status: 'pending',
        subtotal: 100,
        total: 100,
      },
      overrideAccess: true,
    })
    orderId = order.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'orders', id: orderId, overrideAccess: true }).catch(() => {})
    await payload.db.pool.query(`DELETE FROM notifications WHERE dedupe_key LIKE '%${KEY}%'`)
  })

  it('un même événement adresse l’équipe en interne et le client à l’extérieur', async () => {
    await notifyOrderEvent({ event: 'ORDER_CONFIRMED', order: await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true }), payload })

    const rows = await rowsForOrder()
    const internal = rows.find((r) => r.channel === 'internal')
    const email = rows.find((r) => r.channel === 'email')

    // C'est précisément la confusion que le modèle ne savait pas exprimer.
    expect(internal?.recipient_type).toBe('staff')
    expect(internal?.recipient_ref).toBeNull()

    expect(email?.recipient_type).toBe('customer')
    expect(email?.recipient_ref).toBe('client-recipient@paradhiver.test')
  })

  it('WhatsApp est adressé au téléphone, pas à l’email', async () => {
    const rows = await rowsForOrder()
    const whatsapp = rows.find((r) => r.channel === 'whatsapp')
    expect(whatsapp?.recipient_type).toBe('customer')
    expect(whatsapp?.recipient_ref).toBe('0600112233')
  })

  it('customer_email reste renseigné — le champ hérité n’est pas cassé', async () => {
    const rows = await rowsForOrder()
    rows.forEach((r) => expect(r.customer_email).toBe('client-recipient@paradhiver.test'))
  })

  it('une alerte de stock est toujours adressée à l’équipe', async () => {
    await notifyStockChange({
      change: {
        lowStockThreshold: 5,
        newStock: 2,
        occurrenceId: `${KEY}-1`,
        previousStock: 40,
        productId,
        productName,
      },
      payload,
    })

    const res = await payload.db.pool.query(
      `SELECT channel, recipient_type, recipient_ref FROM notifications
        WHERE dedupe_key LIKE '%${KEY}-1%' ORDER BY channel`,
    )
    const rows = res.rows as { channel: string; recipient_ref: string | null; recipient_type: string }[]

    expect(rows.length).toBeGreaterThan(0)
    // Le stock est une affaire interne : jamais adressé au client.
    rows.forEach((r) => expect(r.recipient_type).toBe('staff'))
    expect(rows.find((r) => r.channel === 'internal')?.recipient_ref).toBeNull()
  })

  it('aucune ligne ne reste sans destinataire', async () => {
    const res = await payload.db.pool.query(
      'SELECT count(*)::int AS n FROM notifications WHERE recipient_type IS NULL',
    )
    expect(res.rows[0].n).toBe(0)
  })

  it('le backfill n’a étiqueté aucune ligne interne avec une adresse client', async () => {
    const res = await payload.db.pool.query(
      `SELECT count(*)::int AS n FROM notifications
        WHERE channel = 'internal' AND recipient_type = 'customer'`,
    )
    expect(res.rows[0].n).toBe(0)
  })
})
