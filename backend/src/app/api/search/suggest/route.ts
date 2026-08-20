import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 15

/** Deliberately small: an autocomplete panel that needs scrolling to reach
 * "Voir tous les résultats" defeats its own purpose. */
const LIMITS = { brands: 3, categories: 3, products: 6 } as const

type Suggestion = {
  products: { id: number; name: string; slug: string; price: number; image: string | null; brand: string | null }[]
  brands: { name: string; slug: string }[]
  categories: { name: string; slug: string }[]
}

/**
 * Predictive search, answered from Postgres.
 *
 * No separate search service: pg_trgm handles both the leading-wildcard match
 * needed from the first keystroke and the fuzziness ("uriaje" → "Uriage"),
 * and unaccent makes "creme" find "Crème". At this catalogue's size that is
 * comfortably fast, and it adds no infrastructure to run or keep in sync —
 * a Meilisearch index would need its own container plus a replication path
 * from Payload, which is only worth it in the thousands of products.
 *
 * Ranking is explicit rather than left to similarity alone:
 *   1. name starts with the term      — "u" should surface Uriage first
 *   2. name contains the term
 *   3. brand matches
 *   4. trigram similarity             — the typo-tolerant tail
 * A product whose *description* merely mentions the word never outranks one
 * whose name does.
 */
async function handleGET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const url = new URL(request.url)
  const raw = (url.searchParams.get('q') || '').trim()

  // One character is the point — the brief asks for suggestions from the
  // first letter, so there is no minimum-length gate beyond "not empty".
  if (!raw) return Response.json({ brands: [], categories: [], products: [] } satisfies Suggestion)
  if (raw.length > 60) return Response.json({ brands: [], categories: [], products: [] } satisfies Suggestion)

  const term = raw.toLowerCase()
  const like = `%${term}%`
  const prefix = `${term}%`

  const client = await payload.db.pool.connect()
  try {
    // Only sellable products are suggested: proposing something the visitor
    // cannot buy is worse than proposing nothing.
    const products = await client.query(
      `SELECT p.id, p.name, p.slug, p.price, b.name AS brand_name, m.url AS image_url
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN media m ON m.id = p.image_id
        WHERE p.is_published = true
          AND p.discontinued IS NOT TRUE
          AND (
            immutable_unaccent(lower(p.name)) LIKE immutable_unaccent($1)
            OR immutable_unaccent(lower(coalesce(b.name, ''))) LIKE immutable_unaccent($1)
            OR lower(coalesce(p.sku, '')) LIKE $1
            OR lower(coalesce(p.barcode, '')) LIKE $1
            OR immutable_unaccent(lower(p.name)) % immutable_unaccent($3)
          )
        ORDER BY
          CASE
            WHEN immutable_unaccent(lower(p.name)) LIKE immutable_unaccent($2) THEN 0
            -- A brand *prefix* beats a mere substring in the name: typing "u"
            -- should surface Uriage products, not every product whose name
            -- happens to contain the letter u.
            WHEN immutable_unaccent(lower(coalesce(b.name, ''))) LIKE immutable_unaccent($2) THEN 1
            WHEN immutable_unaccent(lower(p.name)) LIKE immutable_unaccent($1) THEN 2
            WHEN immutable_unaccent(lower(coalesce(b.name, ''))) LIKE immutable_unaccent($1) THEN 3
            ELSE 4
          END,
          similarity(immutable_unaccent(lower(p.name)), immutable_unaccent($3)) DESC,
          p.stock > 0 DESC,
          p.name
        LIMIT $4`,
      [like, prefix, term, LIMITS.products],
    )

    const brands = await client.query(
      `SELECT name, slug FROM brands
        WHERE immutable_unaccent(lower(name)) LIKE immutable_unaccent($1)
           OR immutable_unaccent(lower(name)) % immutable_unaccent($2)
        ORDER BY
          CASE WHEN immutable_unaccent(lower(name)) LIKE immutable_unaccent($3) THEN 0 ELSE 1 END,
          similarity(immutable_unaccent(lower(name)), immutable_unaccent($2)) DESC,
          name
        LIMIT $4`,
      [like, term, prefix, LIMITS.brands],
    )

    const categories = await client.query(
      `SELECT name, slug FROM categories
        WHERE immutable_unaccent(lower(name)) LIKE immutable_unaccent($1)
        ORDER BY
          CASE WHEN immutable_unaccent(lower(name)) LIKE immutable_unaccent($2) THEN 0 ELSE 1 END,
          name
        LIMIT $3`,
      [like, prefix, LIMITS.categories],
    )

    return Response.json(
      {
        brands: brands.rows.map((r) => ({ name: r.name, slug: r.slug })),
        categories: categories.rows.map((r) => ({ name: r.name, slug: r.slug })),
        products: products.rows.map((r) => ({
          brand: r.brand_name ?? null,
          id: Number(r.id),
          image: r.image_url ?? null,
          name: r.name,
          price: Number(r.price),
          slug: r.slug,
        })),
      } satisfies Suggestion,
      {
        // Short shared cache: the same prefixes are typed constantly, and 30s
        // is far too short to serve a stale price in any meaningful way. The
        // checkout reads stock and price from the database regardless.
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
      },
    )
  } catch (err) {
    payload.logger.error({ err }, 'Recherche prédictive échouée')
    return Response.json({ error: 'Recherche indisponible.' }, { status: 500 })
  } finally {
    client.release()
  }
}

export const GET = withApiLog('/api/search/suggest', handleGET)
