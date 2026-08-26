import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { PoolClient } from 'pg'

import { serverError } from '../../../../lib/apiError'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 20

/**
 * The catalogue's facet counts, in three SQL aggregates.
 *
 * The storefront used to build these in Node: `fetchVisibleDocs()` pulled
 * **1000 products at depth=1 with `cache: "no-store"`** on every single
 * /catalogue and /marques request, then counted them in memory with a
 * `filter()` per category and a `filter()` per brand. That is O(products ×
 * facets) of JavaScript per page view, a multi-megabyte response from Payload
 * each time, and — worst of all — silently wrong above 1000 products, because
 * the limit truncates without saying so.
 *
 * Counting is what a database does. One GROUP BY replaces the whole thing.
 *
 * Two properties make this endpoint cheap:
 *
 *   - The counts are over *all* sellable products, not the current filter.
 *     That is what the previous implementation computed too (facets came from
 *     `all`, before any filter was applied), and it is what the filter bar
 *     needs: the count next to "Solaire" tells you how many there are, not
 *     how many survive your other filters.
 *   - Because they do not depend on the query, the answer is identical for
 *     every visitor, so Cloudflare can hold one copy for everyone. The
 *     Cache-Control header is set in next.config.ts.
 *
 * Backed by `products_sellable_idx` (migration 20260826_100000), which the
 * planner uses as an index-only scan for the category aggregate.
 */

type Facets = {
  brands: { count: number; id: number; logo: string | null; name: string; slug: string }[]
  categories: { count: number; value: string }[]
  inStockCount: number
  totalCount: number
}

/** Mirrors Products.access.read for anonymous callers, and the storefront's
 * own `VISIBLE` clause. Anything that is not sellable is not counted. */
const SELLABLE = `p.is_published = true AND p.discontinued IS NOT TRUE`

async function handleGET() {
  const payload = await getPayload({ config: configPromise })

  // `pool.connect()` inside the try, not before it. When Postgres is down the
  // connect itself is what throws, and outside the try that exception escapes
  // the handler entirely: Next answers a bare 500 with an empty body, so the
  // storefront gets nothing it can render and the server logs nothing useful.
  let client: PoolClient | undefined

  try {
    client = await payload.db.pool.connect()
    const [categories, brands, totals] = await Promise.all([
      client.query(`SELECT p.category AS value, count(*)::int AS count
                      FROM products p
                     WHERE ${SELLABLE} AND p.category IS NOT NULL
                     GROUP BY p.category`),

      // Brands carry their logo, because /marques renders one card per brand
      // and previously paid for a second full catalogue fetch to get counts.
      // Brands with no sellable product are dropped: a brand page with zero
      // products is a dead end, and the old code filtered them out too.
      client.query(`SELECT b.id, b.name, b.slug, m.url AS logo, count(p.id)::int AS count
                      FROM brands b
                      JOIN products p ON p.brand_id = b.id AND ${SELLABLE}
                 LEFT JOIN media m ON m.id = b.logo_id
                     WHERE b.slug IS NOT NULL
                     GROUP BY b.id, b.name, b.slug, m.url
                     ORDER BY b.name`),

      // `stock > 0` rather than the stockStatus() helper: "in stock" for the
      // availability filter means "can be bought", and low stock still can.
      client.query(`SELECT count(*)::int AS total,
                           count(*) FILTER (WHERE p.stock > 0)::int AS in_stock
                      FROM products p
                     WHERE ${SELLABLE}`),
    ])

    return Response.json({
      brands: brands.rows.map((r) => ({
        count: Number(r.count),
        id: Number(r.id),
        logo: r.logo ?? null,
        name: String(r.name),
        slug: String(r.slug),
      })),
      categories: categories.rows.map((r) => ({ count: Number(r.count), value: String(r.value) })),
      inStockCount: Number(totals.rows[0].in_stock),
      totalCount: Number(totals.rows[0].total),
    } satisfies Facets)
  } catch (err) {
    return serverError({ context: 'Facettes catalogue indisponibles', err, payload })
  } finally {
    client?.release()
  }
}

export const GET = withApiLog('/api/catalogue/facets', handleGET)
