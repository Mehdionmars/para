/**
 * Bulk-imports a prepared catalogue file (one JSON array of products) into
 * Payload. Built for the 13k-row supplier catalogue, where the dashboard
 * importer — one HTTP request and one brand lookup per row — would take hours.
 *
 * The file is produced outside the repo and passed by path, so supplier data
 * never lands in git. Each row:
 *   { sku, barcode, name, brand, category, subCategory, size, price, oldPrice,
 *     stock, description, images: string[] }
 *
 * Idempotent, keyed on `sku`:
 *   - a SKU or barcode already in the shop is left alone (curated products are
 *     never overwritten by supplier data);
 *   - a product this script created earlier only gets its missing images
 *     filled in, so an interrupted run can simply be started again.
 *
 * Brands are matched by slug, so "AVENE" in the file lands on the existing
 * "Avène" instead of creating a twin. Images are uploaded as
 * `p-<sku>-<n>.<ext>`: the Cloudinary adapter uses the filename as public_id,
 * so running the same file against another database (local, then prod)
 * overwrites the same assets instead of storing them twice.
 *
 * Usage:
 *   npm run import:catalogue -- <file.json> --dry-run
 *   npm run import:catalogue -- <file.json> [--limit 200] [--no-images] [--concurrency 6]
 */
import 'dotenv/config'

import { readFileSync } from 'fs'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../payload.config'
import { CATEGORY_OPTIONS, SUB_CATEGORY_OPTIONS } from '../collections/Products'

type Row = {
  sku: string
  barcode: string | null
  name: string
  brand: string
  category: (typeof CATEGORY_OPTIONS)[number]
  subCategory: string | null
  size: string | null
  price: number
  oldPrice: number | null
  stock: number
  description: string
  images: string[]
}

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
const isDryRun = flag('dry-run')
const withImages = !flag('no-images')
const limit = Number(option('limit') ?? Infinity)
const concurrency = Number(option('concurrency') ?? 6)
const IMAGE_FETCH_TIMEOUT_MS = 20000
// The catalogue is the shop's standing range, not new arrivals: dating it in
// the past keeps the automatic "Nouveau" badge (createdAt < 30 days) and the
// Nouveautés page for products that really are new.
const IMPORTED_CREATED_AT = '2026-01-01T00:00:00.000Z'
const SUB_VALUES = new Set<string>(SUB_CATEGORY_OPTIONS.map((o) => o.value))

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

async function loadAll<T>(payload: Payload, collection: 'brands' | 'products', select: Record<string, true>) {
  const docs: T[] = []
  for (let page = 1; ; page++) {
    const res = await payload.find({ collection, depth: 0, limit: 1000, page, pagination: true, select } as never)
    docs.push(...(res.docs as T[]))
    if (!res.hasNextPage) return docs
  }
}

/**
 * Share of the image's outer frame that is plain white or near-white.
 *
 * Open data photos are mostly shot on a shelf or in a hand; the storefront
 * only wants studio packshots, which sit on a clean light background. Above
 * 0.5 every sample checked was a packshot, below it almost none were.
 */
const PACKSHOT_MIN_LIGHT_BORDER = 0.5

async function lightBorderShare(data: Buffer): Promise<number> {
  const size = 64
  const px = await sharp(data).resize(size, size, { fit: 'fill' }).removeAlpha().raw().toBuffer()
  let border = 0
  let light = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x > 3 && x < size - 4 && y > 3 && y < size - 4) continue
      const i = (y * size + x) * 3
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]]
      border++
      if (r > 225 && g > 225 && b > 225 && Math.max(r, g, b) - Math.min(r, g, b) < 20) light++
    }
  }
  return light / border
}

async function uploadImage(payload: Payload, url: string, filename: string, alt: string): Promise<number | undefined> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) })
      if (res.status === 404) return undefined
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const mimetype = (res.headers.get('content-type') || '').split(';')[0]
      if (!mimetype.startsWith('image/')) return undefined
      const data = Buffer.from(await res.arrayBuffer())
      if (data.length === 0) return undefined
      if ((await lightBorderShare(data)) < PACKSHOT_MIN_LIGHT_BORDER) return undefined
      const ext = mimetype.split('/')[1].replace('jpeg', 'jpg')
      const created = await payload.create({
        collection: 'media',
        data: { alt },
        depth: 0,
        file: { data, mimetype, name: `${filename}.${ext}`, size: data.length },
      })
      return created.id as number
    } catch {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
    }
  }
  return undefined
}

async function main() {
  if (!file) throw new Error('Usage: npm run import:catalogue -- <file.json> [--dry-run] [--limit N] [--no-images]')
  const rows = (JSON.parse(readFileSync(file, 'utf8')) as Row[]).slice(0, limit)
  for (const r of rows) {
    if (!CATEGORY_OPTIONS.includes(r.category)) throw new Error(`Unknown category "${r.category}" on ${r.sku}`)
    if (r.subCategory && !SUB_VALUES.has(r.subCategory)) throw new Error(`Unknown subCategory "${r.subCategory}" on ${r.sku}`)
  }

  const payload = await getPayload({ config })

  const brands = await loadAll<{ id: number; name: string; slug?: string | null }>(payload, 'brands', { name: true, slug: true })
  const brandBySlug = new Map(brands.map((b) => [b.slug || slugify(b.name), b.id]))
  const products = await loadAll<{ id: number; sku?: string | null; barcode?: string | null; slug?: string | null; image?: number | null }>(
    payload,
    'products',
    { sku: true, barcode: true, slug: true, image: true },
  )
  const bySku = new Map(products.filter((p) => p.sku).map((p) => [p.sku!, p]))
  const barcodes = new Set(products.map((p) => p.barcode).filter(Boolean))
  const slugs = new Set(products.map((p) => p.slug).filter(Boolean))

  const totals = { brandsCreated: 0, created: 0, errors: 0, images: 0, imagesAdded: 0, kept: 0 }
  const errors: string[] = []

  // Brands first, sequentially: two workers must never race to create the same one.
  for (const name of new Set(rows.map((r) => r.brand))) {
    const slug = slugify(name)
    if (brandBySlug.has(slug)) continue
    totals.brandsCreated++
    if (isDryRun) continue
    const created = await payload.create({ collection: 'brands', data: { name, slug }, depth: 0 })
    brandBySlug.set(slug, created.id as number)
  }

  const uniqueSlug = (row: Row) => {
    const base = slugify([row.brand, row.name, row.size].filter(Boolean).join(' ')).slice(0, 90) || slugify(row.sku)
    let slug = base
    for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`
    slugs.add(slug)
    return slug
  }

  const attachImages = async (row: Row) => {
    const ids: number[] = []
    for (const [i, url] of row.images.entries()) {
      const id = await uploadImage(payload, url, `p-${slugify(row.sku)}-${i + 1}`, row.name)
      if (id) ids.push(id)
    }
    totals.images += ids.length
    return ids.length ? { gallery: ids.slice(1).map((image) => ({ image })), image: ids[0] } : {}
  }

  let done = 0
  const handle = async (row: Row) => {
    const existing = bySku.get(row.sku)
    try {
      if (existing || (row.barcode && barcodes.has(row.barcode))) {
        // Only fill in images on a product an earlier run of this script created.
        if (existing && !existing.image && row.images.length && withImages && !isDryRun) {
          const media = await attachImages(row)
          if (media.image) {
            await payload.update({ collection: 'products', id: existing.id, data: media, depth: 0 })
            totals.imagesAdded++
          }
        }
        totals.kept++
        return
      }
      totals.created++
      if (isDryRun) return
      const media = withImages && row.images.length ? await attachImages(row) : {}
      // Whole dirhams on the storefront: the supplier's 100.62 reads as a
      // computed discount, not a shelf price.
      const price = Math.round(row.price)
      const oldPrice = row.oldPrice ? Math.round(row.oldPrice) : undefined
      await payload.create({
        collection: 'products',
        depth: 0,
        data: {
          barcode: row.barcode || undefined,
          brand: brandBySlug.get(slugify(row.brand)),
          category: row.category,
          createdAt: IMPORTED_CREATED_AT,
          description: row.description,
          isPublished: true,
          lowStockThreshold: 5,
          name: row.name,
          oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
          price,
          size: row.size || undefined,
          sku: row.sku,
          slug: uniqueSlug(row),
          stock: row.stock,
          subCategory: row.subCategory || undefined,
          ...media,
        } as never,
      })
    } catch (err) {
      totals.errors++
      errors.push(`${row.sku} ${row.name} — ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      done++
      if (done % 250 === 0 || done === rows.length) {
        console.log(`[${done}/${rows.length}] créés ${totals.created} · gardés ${totals.kept} · images ${totals.images} · erreurs ${totals.errors}`)
      }
    }
  }

  console.log(`${isDryRun ? 'DRY RUN — ' : ''}${rows.length} lignes, ${concurrency} en parallèle, images ${withImages ? 'oui' : 'non'}`)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (next < rows.length) await handle(rows[next++])
    }),
  )

  console.log('\n====================================')
  console.log(`Produits créés      : ${totals.created}`)
  console.log(`Déjà présents       : ${totals.kept} (dont ${totals.imagesAdded} complétés en images)`)
  console.log(`Marques créées      : ${totals.brandsCreated}`)
  console.log(`Images importées    : ${totals.images}`)
  console.log(`Erreurs             : ${totals.errors}`)
  for (const e of errors.slice(0, 50)) console.log(`  ✗ ${e}`)
  if (errors.length > 50) console.log(`  … et ${errors.length - 50} autres`)
  process.exit(totals.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
