import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isOrderStatus } from '../../../../lib/orderStatus'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 20

/**
 * Guest order tracking: order number + the email it was placed with.
 *
 * There is no customer account system, so the email is the credential. Order
 * numbers alone are not enough — PDH-YYMMDD-XXXX has only four random
 * characters, which is guessable enough that the number by itself would be a
 * poor gate on someone's name, phone and address.
 *
 * A wrong number and a wrong email return the *same* message, so this cannot
 * be used to discover which order numbers exist.
 *
 * The response is deliberately narrow: status, timeline and totals. It never
 * includes the shipping address, phone, notes, or internal fields.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let body: { orderNumber?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const orderNumber = body.orderNumber?.trim().toUpperCase()
  const email = body.email?.trim().toLowerCase()

  if (!orderNumber || !email) {
    return Response.json({ error: 'Numéro de commande et email requis.' }, { status: 400 })
  }

  const notFound = Response.json(
    { error: 'Aucune commande ne correspond à ce numéro et cet email.' },
    { status: 404 },
  )

  const found = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { orderNumber: { equals: orderNumber } },
  })

  const order = found.docs[0] as
    | {
        id: number
        orderNumber: string
        customerEmail: string
        customerName: string
        status: string
        items?: { name?: string; quantity?: number; price?: number }[]
        subtotal?: number
        discount?: number
        shipping?: number
        total?: number
        createdAt: string
      }
    | undefined

  if (!order) return notFound
  if (String(order.customerEmail || '').toLowerCase() !== email) return notFound

  const history = await payload.find({
    collection: 'order-status-history',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    sort: 'createdAt',
    where: { order: { equals: order.id } },
  })

  return Response.json({
    createdAt: order.createdAt,
    customerName: order.customerName,
    discount: order.discount ?? 0,
    items: (order.items ?? []).map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
    orderNumber: order.orderNumber,
    shipping: order.shipping ?? 0,
    status: order.status,
    subtotal: order.subtotal ?? 0,
    timeline: history.docs
      .map((h) => {
        const row = h as { toStatus?: string; createdAt?: string }
        return { at: row.createdAt, status: row.toStatus }
      })
      .filter((t) => isOrderStatus(t.status)),
    total: order.total ?? 0,
  })
}

export const POST = withApiLog('/api/orders/track', handlePOST)
