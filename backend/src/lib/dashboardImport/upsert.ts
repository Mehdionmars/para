import type { Payload } from 'payload'

import type { NormalizedImportRow } from './normalize'
import { validateImportRow } from './validate'

export type RowOutcome = {
  row: number
  sheet: string
  sku: string
  status: 'created' | 'updated' | 'skipped' | 'failed'
  message?: string
  warnings?: string[]
}

async function resolveBrandId(payload: Payload, name: string): Promise<number | undefined> {
  const trimmed = name.trim()
  if (!trimmed) return undefined
  const existing = await payload.find({ collection: 'brands', limit: 1, where: { name: { equals: trimmed } } })
  if (existing.docs[0]) return existing.docs[0].id as number
  const created = await payload.create({ collection: 'brands', data: { name: trimmed } })
  return created.id as number
}

async function resolveSupplierId(payload: Payload, name: string): Promise<number | undefined> {
  const trimmed = name.trim()
  if (!trimmed) return undefined
  const existing = await payload.find({ collection: 'suppliers', limit: 1, where: { name: { equals: trimmed } } })
  if (existing.docs[0]) return existing.docs[0].id as number
  const created = await payload.create({ collection: 'suppliers', data: { name: trimmed } })
  return created.id as number
}

const IMAGE_FETCH_TIMEOUT_MS = 8000

/** Downloads an external image URL and creates a Media doc from it. Never
 * throws — a bad/slow/non-image URL just means the product saves without a
 * new image, not a failed row. */
async function fetchImageAsMedia(payload: Payload, url: string, altText: string): Promise<number | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) })
    if (!res.ok) return undefined
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return undefined
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length === 0) return undefined
    const filename = (url.split('/').pop() || 'import-image').split('?')[0].split('#')[0] || 'import-image.jpg'
    const created = await payload.create({
      collection: 'media',
      data: { alt: altText || filename },
      file: { data: buffer, mimetype: contentType, name: filename, size: buffer.length },
    })
    return created.id as number
  } catch {
    return undefined
  }
}

/**
 * Upserts one row by SKU (the source of truth): existing SKU updates that
 * product, a new SKU creates one. Stock changes are logged as a
 * stock-movements audit row; batch/expiry/supplier info also gets its own
 * inventory record. Never throws — every failure path returns a 'failed'
 * RowOutcome instead, so one bad row can't take down the rest of a batch.
 */
export async function upsertImportRow(
  payload: Payload,
  raw: NormalizedImportRow,
  rowIndex: number,
  sheet: string,
  existingSkus: Set<string>,
): Promise<RowOutcome> {
  try {
    const validation = validateImportRow(raw, existingSkus)
    if (validation.errors.length > 0) {
      return { message: validation.errors.join(' · '), row: rowIndex, sheet, sku: raw.sku, status: 'failed' }
    }

    const existing = (await payload.find({ collection: 'products', limit: 1, where: { sku: { equals: raw.sku } } }))
      .docs[0]

    const [brandId, supplierId, imageId] = await Promise.all([
      raw.brandName ? resolveBrandId(payload, raw.brandName) : undefined,
      raw.supplierName ? resolveSupplierId(payload, raw.supplierName) : undefined,
      raw.imageUrl ? fetchImageAsMedia(payload, raw.imageUrl, raw.title || raw.sku) : undefined,
    ])

    const data: Record<string, unknown> = {}
    if (raw.title) data.name = raw.title
    if (raw.slug) data.slug = raw.slug
    if (raw.description) data.description = raw.description
    if (brandId) data.brand = brandId
    if (raw.category) data.category = raw.category
    if (raw.price !== undefined) data.price = raw.price
    if (raw.compareAtPrice !== undefined) data.oldPrice = raw.compareAtPrice
    if (raw.lowStockThreshold !== undefined) data.lowStockThreshold = raw.lowStockThreshold
    if (raw.barcode) data.barcode = raw.barcode
    if (raw.isPublished !== undefined) data.isPublished = raw.isPublished
    if (raw.featured !== undefined) data.featured = raw.featured
    if (imageId) data.image = imageId
    if (raw.stock !== undefined) data.stock = raw.stock

    let productId: number
    let previousStock = 0
    let created = false

    if (existing) {
      productId = existing.id as number
      previousStock = (existing.stock as number | undefined) ?? 0
      if (Object.keys(data).length > 0) {
        await payload.update({ collection: 'products', id: productId, data })
      }
    } else {
      data.name = raw.title
      data.sku = raw.sku
      data.price = raw.price
      data.category = raw.category
      data.description = (data.description as string | undefined) || raw.title
      // New products always land as an unpublished draft with 0 sellable
      // stock, regardless of what the sheet says — an administrator must
      // review and publish them before they're live on the storefront. The
      // sheet's reported quantity is still preserved below as an Inventory
      // record (a receiving reference), just not reflected in live stock or
      // a stock-movement entry yet — there's no real stock change to log
      // when the product starts and stays at 0.
      data.isPublished = false
      data.stock = 0
      const doc = await payload.create({ collection: 'products', data: data as never })
      productId = doc.id as number
      created = true
    }

    const newStock = created ? 0 : raw.stock !== undefined ? raw.stock : previousStock
    const stockChanged = !created && raw.stock !== undefined && raw.stock !== previousStock
    if (stockChanged) {
      await payload.create({
        collection: 'stock-movements',
        data: {
          batchNumber: raw.batchNumber || undefined,
          delta: newStock - previousStock,
          expiryDate: raw.expiryDate || undefined,
          newStock,
          previousStock,
          product: productId,
          reason: `Import — ${sheet} ligne ${rowIndex}`,
          source: 'import',
          supplier: supplierId,
        },
      })
    }

    // A batch/expiry/supplier record without any of those three fields
    // wouldn't say anything an Inventory row doesn't already say via
    // products.stock — only write one when there's real batch-level detail.
    if (raw.batchNumber || raw.expiryDate || supplierId) {
      await payload.create({
        collection: 'inventory',
        data: {
          batchNumber: raw.batchNumber || undefined,
          expiryDate: raw.expiryDate || undefined,
          product: productId,
          quantity: raw.stock ?? 0,
          supplier: supplierId,
        },
      })
    }

    if (!created && Object.keys(data).length === 0 && !stockChanged) {
      return { row: rowIndex, sheet, sku: raw.sku, status: 'skipped', message: 'Aucun changement détecté' }
    }

    return {
      row: rowIndex,
      sheet,
      sku: raw.sku,
      status: created ? 'created' : 'updated',
      warnings: validation.warnings.length ? validation.warnings : undefined,
    }
  } catch (err) {
    return {
      message: err instanceof Error ? err.message : 'Erreur inconnue',
      row: rowIndex,
      sheet,
      sku: raw.sku,
      status: 'failed',
    }
  }
}
