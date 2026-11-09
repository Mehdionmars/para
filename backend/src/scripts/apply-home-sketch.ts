/**
 * Lays the homepage out as the client's hand-drawn sketch (Nov. 2026):
 *
 *   hero
 *   Les best sellers                      → rail "best"
 *   Les incontournables                   → imageCarousel
 *   Tendances réseaux | Favoris de saison → ctaPair1 (two tiles)
 *   Les coffrets cadeaux                  → coffrets
 *   Remises exceptionnelles               → promotionsGrid (6 products)
 *   Les nouveautés marques                → brandsFeatured
 *   Services et avantages Para d'Hiver    → services + trustBar
 *
 * Every other section is kept but hidden, so the Storefront Builder can bring
 * one back with a click. Only titles and order change: images, products and
 * links already set in the CMS are left as they are. Safe to re-run.
 *
 * Usage: npx tsx src/scripts/apply-home-sketch.ts
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'

const VISIBLE_ORDER = [
  'hero',
  'rail:best',
  'imageCarousel',
  'ctaPair1',
  'coffrets',
  'promotionsGrid',
  'brandsFeatured',
  'services',
  'trustBar',
]

const NEW_BRANDS_COUNT = 5

type Tile = { eyebrow?: string | null; title: string; [k: string]: unknown }

async function run() {
  const payload = await getPayload({ config })
  const home = await payload.findGlobal({ slug: 'home', depth: 0 })

  const stored = ((home.sections as { key: string }[]) || []).map((s) => s.key)
  const hidden = stored.filter((key) => !VISIBLE_ORDER.includes(key))
  const sections = [
    ...VISIBLE_ORDER.map((key) => ({ key, visible: true })),
    ...hidden.map((key) => ({ key, visible: false })),
  ]

  const rails = ((home.rails as { key: string; title: string }[]) || []).map((r) =>
    r.key === 'best' ? { ...r, eyebrow: 'Best sellers', title: 'Les best sellers' } : r,
  )

  // Keep the two existing tiles' pictures and links; only the words change.
  const tiles = ((home.ctaPair1 as Tile[]) || []).slice(0, 2)
  const tileCopy = [
    { eyebrow: 'Tendances', title: 'Tendances sur les réseaux sociaux' },
    { eyebrow: 'Saison', title: 'Nos favoris de la saison' },
  ]
  const ctaPair1 = tileCopy.map((copy, i) => ({ ...(tiles[i] ?? { bg: '#EFE6F3' }), ...copy }))

  // "Les nouveautés marques": the brands most recently added to the shop,
  // unless an editor has already picked some.
  let brandsFeatured = (home.brandsFeatured as unknown[]) || []
  if (brandsFeatured.length === 0) {
    const { docs } = await payload.find({
      collection: 'brands',
      depth: 0,
      limit: 50,
      sort: '-createdAt',
      select: { logo: true, name: true },
    })
    const picked: { brand: number; image?: number; ctaLabel: string }[] = []
    for (const brand of docs) {
      if (picked.length === NEW_BRANDS_COUNT) break
      const { totalDocs } = await payload.count({
        collection: 'products',
        where: { brand: { equals: brand.id }, isPublished: { equals: true } },
      })
      if (totalDocs === 0) continue
      const logo = brand.logo as number | null | undefined
      picked.push({ brand: brand.id as number, ...(logo ? { image: logo } : {}), ctaLabel: 'Découvrir la marque' })
    }
    brandsFeatured = picked
  }

  await payload.updateGlobal({
    slug: 'home',
    depth: 0,
    data: {
      // Home has drafts on: without this the save lands as an unpublished draft.
      _status: 'published',
      brandsFeatured,
      // A gift box left half-filled in the builder has no image, which the
      // schema rejects and would block the whole save.
      coffrets: ((home.coffrets as { image?: unknown }[]) || []).filter((c) => c.image),
      brandsFeaturedCopy: { ...home.brandsFeaturedCopy, eyebrow: 'Nouveautés', title: 'Les nouveautés marques' },
      coffretsCopy: { ...home.coffretsCopy, title: 'Les coffrets cadeaux' },
      ctaPair1,
      imageCarouselCopy: { ...home.imageCarouselCopy, title: 'Les incontournables' },
      promotionsGrid: { ...home.promotionsGrid, limit: 6, title: 'Remises exceptionnelles' },
      rails,
      sections,
      servicesTeaserCopy: { ...home.servicesTeaserCopy, title: "Services et avantages Para d'Hiver" },
    } as never,
  })

  payload.logger.info(
    `Home: ${VISIBLE_ORDER.length} sections visibles, ${hidden.length} masquées, ${brandsFeatured.length} marques en nouveautés.`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error('Home sketch update failed:', err)
  process.exit(1)
})
