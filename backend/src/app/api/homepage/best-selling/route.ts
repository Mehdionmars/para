import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 30

const EXCLUDED_STATUSES = new Set(['cancelled', 'refunded'])
const ORDERS_SAMPLE_SIZE = 300

/**
 * Public, PII-free aggregate: which products actually sold the most, by real
 * order quantity. Orders themselves stay staff-only (customer name/email/
 * phone/address) — this route uses Payload's local API (which bypasses REST
 * access control for trusted server code) to read them, but only ever
 * returns a {productId, quantity} ranking, never order/customer data.
 */
async function handleGET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)

  const payload = await getPayload({ config: configPromise })
  const { docs: orders } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: ORDERS_SAMPLE_SIZE,
    sort: '-createdAt',
    where: { status: { not_in: [...EXCLUDED_STATUSES] } },
  })

  const quantityByProduct = new Map<number, number>()
  for (const order of orders) {
    for (const item of (order.items as { product?: number | { id: number } | null; quantity: number }[]) || []) {
      const productId = typeof item.product === 'object' ? item.product?.id : item.product
      if (!productId) continue
      quantityByProduct.set(productId, (quantityByProduct.get(productId) || 0) + item.quantity)
    }
  }

  const ranked = [...quantityByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, quantity]) => ({ productId, quantity }))

  return Response.json({ ranked })
}

export const GET = withApiLog('/api/homepage/best-selling', handleGET)
