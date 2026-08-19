/**
 * Seeds the Products catalogue from a curated list of real, verified
 * dermo-cosmetic products (backend/src/data/seed-products.json) — brand
 * name, category, price, description, image and barcode were all pulled
 * from actual product pages, not invented.
 *
 * Idempotent: matches existing products by `sku` and updates them in place
 * on a second run rather than creating duplicates. Brands are found-or-
 * created by name. Product images are downloaded from `imageUrl` once and
 * turned into a Media doc; a row without a reachable image is seeded
 * without one rather than skipped (matches how imported products already
 * behave elsewhere in this codebase — see lib/dashboardImport/upsert.ts).
 *
 * Usage:
 *   npm run seed:catalogue -- --dry-run   # report only, no writes
 *   npm run seed:catalogue                # create/update for real
 */
import 'dotenv/config'

import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'
import { CATEGORY_OPTIONS } from '../collections/Products'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.resolve(dirname, '../data/seed-products.json')
const IMAGE_FETCH_TIMEOUT_MS = 10000

type Category = (typeof CATEGORY_OPTIONS)[number]

type SeedVariant = {
  optionValue: string
  sku?: string
  barcode?: string
  price: number
  oldPrice?: number
  stock?: number
}

type SeedBadge = {
  type: string
  enabled?: boolean
  text?: string
  priority?: number
  bgColor?: string
  textColor?: string
}

type SeedProduct = {
  badges?: SeedBadge[]
  name: string
  slug: string
  brand: string
  category: Category
  size?: string
  price: number
  oldPrice?: number | null
  description: string
  imageUrl?: string | null
  sku: string
  barcode?: string
  stock: number
  reservedStock?: number
  lowStockThreshold?: number
  featured?: boolean
  discontinued?: boolean
  hasVariants?: boolean
  variantOptionType?: string
  variants?: SeedVariant[]
}

type RowResult = 'created' | 'updated' | 'error'

type CategoryStats = { found: number; new: number; update: number; errors: number }

const isDryRun = process.argv.includes('--dry-run')

function loadProducts(): SeedProduct[] {
  const raw = readFileSync(DATA_FILE, 'utf8')
  const products = JSON.parse(raw) as SeedProduct[]

  const skus = new Set<string>()
  const slugs = new Set<string>()
  for (const p of products) {
    if (skus.has(p.sku)) throw new Error(`Duplicate SKU in seed-products.json: ${p.sku}`)
    skus.add(p.sku)
    if (slugs.has(p.slug)) throw new Error(`Duplicate slug in seed-products.json: ${p.slug}`)
    slugs.add(p.slug)
    if (!CATEGORY_OPTIONS.includes(p.category)) {
      throw new Error(`Unknown category "${p.category}" on ${p.sku} — must be one of ${CATEGORY_OPTIONS.join(', ')}`)
    }
  }
  return products
}

const brandIdCache = new Map<string, number>()

async function resolveBrandId(payload: Payload, name: string, stats: { brandsCreated: number }): Promise<number> {
  const cached = brandIdCache.get(name)
  if (cached) return cached
  const existing = await payload.find({ collection: 'brands', limit: 1, where: { name: { equals: name } } })
  if (existing.docs[0]) {
    const id = existing.docs[0].id as number
    brandIdCache.set(name, id)
    return id
  }
  const created = await payload.create({ collection: 'brands', data: { name } })
  stats.brandsCreated++
  brandIdCache.set(name, created.id as number)
  return created.id as number
}

/** Downloads `url` and creates a Media doc from it. Never throws — a bad or
 * unreachable image URL just means the product is seeded without one. */
async function fetchImageAsMedia(payload: Payload, url: string, altText: string): Promise<number | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) })
    if (!res.ok) return undefined
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) return undefined
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length === 0) return undefined
    const filename = (url.split('/').pop() || 'seed-image').split('?')[0].split('#')[0] || 'seed-image.jpg'
    const created = await payload.create({
      collection: 'media',
      data: { alt: altText },
      file: { data: buffer, mimetype: contentType.startsWith('image/') ? contentType : 'image/jpeg', name: filename, size: buffer.length },
    })
    return created.id as number
  } catch {
    return undefined
  }
}

function emptyStats(): CategoryStats {
  return { errors: 0, found: 0, new: 0, update: 0 }
}

async function main() {
  const products = loadProducts()
  const statsByCategory = new Map<Category, CategoryStats>()
  for (const c of CATEGORY_OPTIONS) statsByCategory.set(c, emptyStats())

  console.log(isDryRun ? 'DRY RUN — no changes will be written to PostgreSQL.\n' : 'Seeding catalogue...\n')

  const payload = isDryRun ? null : await getPayload({ config })

  const totals = { brandsCreated: 0, created: 0, errors: 0, imagesUploaded: 0, updated: 0, variantsCreated: 0 }

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const stats = statsByCategory.get(p.category)!
    stats.found++
    const progressPrefix = `[${String(i + 1).padStart(3, '0')}/${products.length}]`

    if (isDryRun) {
      let existing: { docs: { id: number }[] } = { docs: [] }
      // Dry-run still needs a payload instance to check found-vs-new, but makes no writes.
      const dryPayload = await getPayload({ config })
      existing = await dryPayload.find({ collection: 'products', limit: 1, where: { sku: { equals: p.sku } } })
      if (existing.docs[0]) stats.update++
      else stats.new++
      console.log(`${progressPrefix} ${existing.docs[0] ? '↻' : '+'} ${p.name} (${p.brand}, ${p.category})`)
      continue
    }

    try {
      const brandId = await resolveBrandId(payload!, p.brand, totals)
      const existing = await payload!.find({ collection: 'products', limit: 1, where: { sku: { equals: p.sku } } })

      // Only fetch+create a Media doc when the product doesn't already have
      // one — re-running the seed must not pile up duplicate orphaned Media
      // rows for the same product every time.
      let imageId: number | undefined
      if (p.imageUrl && !existing.docs[0]?.image) {
        imageId = await fetchImageAsMedia(payload!, p.imageUrl, p.name)
        if (imageId) totals.imagesUploaded++
      }

      const data: Record<string, unknown> = {
        // Colours/labels/priority are left unset on purpose: each badge
        // inherits its type's preset from Products.ts, so re-theming a badge
        // type later updates every seeded product instead of none of them.
        badges: (p.badges || []).map((b) => ({ ...b, enabled: b.enabled ?? true })),
        barcode: p.barcode,
        brand: brandId,
        category: p.category,
        description: p.description,
        discontinued: p.discontinued ?? false,
        featured: p.featured ?? false,
        isPublished: true,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        name: p.name,
        oldPrice: p.oldPrice ?? undefined,
        price: p.price,
        reservedStock: p.reservedStock ?? 0,
        size: p.size,
        sku: p.sku,
        slug: p.slug,
        stock: p.stock,
      }
      if (imageId) data.image = imageId
      if (p.hasVariants && p.variants?.length) {
        data.hasVariants = true
        data.variantOptionType = p.variantOptionType ?? 'contenance'
        data.variants = p.variants
        totals.variantsCreated += p.variants.length
      }

      let result: RowResult
      if (existing.docs[0]) {
        await payload!.update({ id: existing.docs[0].id, collection: 'products', data })
        result = 'updated'
        stats.update++
        totals.updated++
      } else {
        await payload!.create({ collection: 'products', data: data as never })
        result = 'created'
        stats.new++
        totals.created++
      }

      console.log(`${progressPrefix} ${result === 'created' ? '✓' : '↻'} ${p.name}${imageId ? '' : ' (sans image)'}`)
    } catch (err) {
      stats.errors++
      totals.errors++
      console.log(`${progressPrefix} ✗ ${p.name} — ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    }
  }

  if (isDryRun) {
    console.log('\nCATEGORY                          FOUND    NEW    UPDATE    ERRORS')
    console.log('-'.repeat(70))
    for (const [category, s] of statsByCategory) {
      console.log(`${category.padEnd(34)} ${String(s.found).padStart(6)} ${String(s.new).padStart(7)} ${String(s.update).padStart(9)} ${String(s.errors).padStart(9)}`)
    }
    console.log('-'.repeat(70))
    const grand = [...statsByCategory.values()].reduce(
      (acc, s) => ({ errors: acc.errors + s.errors, found: acc.found + s.found, new: acc.new + s.new, update: acc.update + s.update }),
      { errors: 0, found: 0, new: 0, update: 0 },
    )
    console.log(`${'TOTAL'.padEnd(34)} ${String(grand.found).padStart(6)} ${String(grand.new).padStart(7)} ${String(grand.update).padStart(9)} ${String(grand.errors).padStart(9)}`)
    process.exit(0)
  }

  console.log('\n====================================')
  console.log("PARA D'HIVER CATALOGUE SEED")
  console.log('====================================\n')
  console.log(`Products created : ${totals.created}`)
  console.log(`Products updated : ${totals.updated}`)
  console.log(`Brands created   : ${totals.brandsCreated}`)
  console.log(`Images uploaded  : ${totals.imagesUploaded}`)
  console.log(`Variants created : ${totals.variantsCreated}`)
  console.log(`Errors           : ${totals.errors}`)
  console.log('\n====================================')
  process.exit(totals.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
