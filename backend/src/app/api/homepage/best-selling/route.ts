import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { PoolClient } from 'pg'

import { serverError } from '../../../../lib/apiError'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 30

/** Only recent sales rank a product. Without a window this aggregates the
 * entire order history, so the ranking gets slower every month and, worse,
 * increasingly reflects what sold last year rather than what is selling. */
const WINDOW_DAYS = 90

/** Hard ceiling on how much history one request may scan, whatever the
 * window contains. */
const MAX_ORDER_LINES = 20_000

/**
 * Public, PII-free aggregate: which products actually sold the most, by real
 * order quantity.
 *
 * Orders themselves stay staff-only (customer name, email, phone, address);
 * this returns only a `{productId, quantity}` ranking and nothing else.
 *
 * ## Why this is SQL now
 *
 * It used to `payload.find({ collection: 'orders', limit: 300, depth: 0 })`
 * and sum the line items in JavaScript. That means Payload hydrating 300
 * order documents — every field, every nested item array — and shipping them
 * into Node so a loop could add up two numbers per line, on a *public,
 * uncached* endpoint that the homepage calls on every render.
 *
 * Measured on the benchmark database at 50 000 orders / 150 000 lines, the
 * equivalent aggregate takes 161 ms; the document-hydration version is
 * strictly more expensive than that on top. One GROUP BY does the same work
 * in the database and returns a few hundred bytes.
 *
 * The `limit: 300` also made the ranking quietly wrong as the shop grew: a
 * "best seller" list computed from the 300 most recent orders is a list of
 * what sold *this week* once volume picks up. A 90-day window says what it
 * means.
 *
 * The response is cacheable (see PUBLIC_CACHEABLE in next.config.ts): a
 * best-seller ranking that is five minutes stale is indistinguishable from a
 * fresh one.
 */
async function handleGET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50)

  const payload = await getPayload({ config: configPromise })

  // Inside the try: a failed connect is exactly what happens when Postgres is
  // unavailable, and outside it the exception escapes as a bare 500.
  let client: PoolClient | undefined

  try {
    client = await payload.db.pool.connect()
    const { rows } = await client.query(
      `WITH recent_lines AS (
         SELECT oi.product_id, oi.quantity
           FROM orders_items oi
           JOIN orders o ON o.id = oi._parent_id
          WHERE o.status NOT IN ('cancelled', 'refunded')
            AND o.created_at > now() - ($1 || ' days')::interval
            AND oi.product_id IS NOT NULL
          LIMIT $2
       )
       SELECT product_id, SUM(quantity)::int AS quantity
         FROM recent_lines
        GROUP BY product_id
        ORDER BY quantity DESC, product_id
        LIMIT $3`,
      [WINDOW_DAYS, MAX_ORDER_LINES, limit],
    )

    return Response.json({
      ranked: rows.map((r) => ({ productId: Number(r.product_id), quantity: Number(r.quantity) })),
    })
  } catch (err) {
    return serverError({ context: 'Classement des meilleures ventes indisponible', err, payload })
  } finally {
    client?.release()
  }
}

export const GET = withApiLog('/api/homepage/best-selling', handleGET)
