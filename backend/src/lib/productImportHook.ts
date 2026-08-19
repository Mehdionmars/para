import type { Payload } from 'payload'

import { CATEGORY_OPTIONS } from '../collections/Products'
import { COLUMN_ALIASES, type ColumnMapping, type ImportField, normalizeKey } from './importFields'
import { normalizeText } from './textNormalize'

const CATEGORY_KEYWORDS: [RegExp, (typeof CATEGORY_OPTIONS)[number]][] = [
  [/solair|spf|uv/i, 'Solaire'],
  [/cheveux|capillaire|shampoo|shampooing|ampoule/i, 'Cheveux'],
  [/b[ée]b[ée]|maman|grossesse/i, 'Baby & Mom'],
  [/maquillage|make-?up|mascara|rouge [aà] l[eè]vres|fond de teint|blush|fard|eyeliner|anticernes|correcteur/i, 'Maquillage'],
  [/dentifrice|dentaire|bucco|buccal|gencive|bain de bouche|haleine/i, 'Bucco-Dentaire'],
  [/compl[ée]ment|vitamine|probiotique|om[ée]ga|g[ée]lule|comprim[ée]|collag[eè]ne/i, 'Compléments alimentaires'],
  [/hygi[eè]ne|savon|gel douche|d[ée]odorant/i, 'Hygiène'],
  [/corps|lait corps|[ée]pilat/i, 'Corps'],
  [/visage|facial|nettoyant|s[ée]rum|cr[eè]me/i, 'Visage'],
]

/** Looks up a field's value in a raw row: a manual column mapping (typed in
 * or picked by the user) always wins over auto-detection via aliases. */
function findColumn(row: Record<string, unknown>, field: ImportField, mapping?: ColumnMapping): unknown {
  const normalizedRow = new Map(Object.entries(row).map(([k, v]) => [normalizeKey(k), v]))

  const manualColumn = mapping?.[field]
  if (manualColumn) {
    const manualValue = row[manualColumn] ?? normalizedRow.get(normalizeKey(manualColumn))
    if (manualValue !== undefined && manualValue !== null && manualValue !== '') return manualValue
  }

  const aliases = COLUMN_ALIASES[field] || [field]
  for (const alias of aliases) {
    const value = normalizedRow.get(alias)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

const PLACEHOLDER_VALUES = new Set(['-', '--', 'n/a', 'na', 'none', '/'])

function asText(value: unknown): string {
  const text = normalizeText(value)
  return PLACEHOLDER_VALUES.has(text.toLowerCase()) ? '' : text
}

function parsePrice(value: unknown): number | undefined {
  const text = asText(value).replace(/[^\d.,]/g, '').replace(',', '.')
  const n = Number.parseFloat(text)
  return Number.isFinite(n) ? n : undefined
}

function guessCategory(...texts: string[]): (typeof CATEGORY_OPTIONS)[number] | undefined {
  // A manually-mapped or well-named category column often already contains
  // one of our exact option labels — try that before falling back to
  // keyword-scanning free text.
  for (const text of texts) {
    const exact = CATEGORY_OPTIONS.find((opt) => opt.toLowerCase() === text.trim().toLowerCase())
    if (exact) return exact
  }
  const combined = texts.filter(Boolean).join(' ')
  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(combined)) return category
  }
  return undefined
}

export async function resolveBrandId(payload: Payload, name: string): Promise<number | undefined> {
  const trimmed = name.trim()
  if (!trimmed) return undefined
  const existing = await payload.find({
    collection: 'brands',
    limit: 1,
    where: { name: { equals: trimmed } },
  })
  if (existing.docs[0]) return existing.docs[0].id as number
  const created = await payload.create({ collection: 'brands', data: { name: trimmed } })
  return created.id as number
}

export type NormalizedProductRow = {
  badges: unknown[]
  barcode: string
  brandName: string
  category: (typeof CATEGORY_OPTIONS)[number] | undefined
  description: string
  name: string
  oldPrice: number | undefined
  price: number | undefined
  size: string
  sku: string
}

/** Pure, no-DB-access normalization of one raw spreadsheet row (whatever
 * column names the supplier used) into the Products schema shape. Brand name
 * is returned as text — resolving/creating the Brand doc is a separate DB
 * step callers run themselves (once per distinct brand, not once per row).
 * `mapping` carries manual column overrides from the import wizard's mapping
 * step — a user-picked or hand-typed column always wins over auto-detection. */
export function normalizeProductRow(raw: Record<string, unknown>, mapping?: ColumnMapping): NormalizedProductRow {
  const name = asText(findColumn(raw, 'name', mapping))
  const description = asText(findColumn(raw, 'description', mapping))

  return {
    badges: [],
    barcode: asText(findColumn(raw, 'barcode', mapping)).replace(/\.$/, ''),
    brandName: asText(findColumn(raw, 'brand', mapping)),
    // Explicit category column wins; falls back to scanning the name, then
    // the description, since sheets without a category column (e.g.
    // PentaGroup's per-brand tabs) still usually name the use-case in prose.
    category: guessCategory(asText(findColumn(raw, 'category', mapping)), name) ?? guessCategory(description),
    description,
    name,
    oldPrice: parsePrice(findColumn(raw, 'oldPrice', mapping)),
    price: parsePrice(findColumn(raw, 'price', mapping)),
    size: asText(findColumn(raw, 'size', mapping)),
    sku: asText(findColumn(raw, 'sku', mapping)),
  }
}

/**
 * Payload plugin-import-export hook (CSV upload via the Products list view's
 * "Import" button). Prefer the dedicated /admin/import-products page for
 * real supplier files — it handles raw .xlsx directly, including quirks
 * (title rows, scientific-notation barcodes) a plain CSV upload can't. This
 * stays wired up as a fallback for already-clean CSV/JSON files.
 */
export async function productsBeforeImport({
  data,
  req,
}: {
  data: Record<string, unknown>[]
  req: { payload: Payload }
}) {
  return Promise.all(
    data.map(async (row) => {
      const n = normalizeProductRow(row)
      const brand = n.brandName ? await resolveBrandId(req.payload, n.brandName) : undefined

      // This hook doesn't otherwise know create vs. update (the plugin
      // itself decides that from `row.id`) — look the row up the same way
      // the other importers dedupe, so a genuine update to an
      // already-reviewed product doesn't get silently reset to draft/0 stock.
      const existing = n.barcode
        ? await req.payload.find({ collection: 'products', limit: 1, where: { barcode: { equals: n.barcode } } })
        : n.sku
          ? await req.payload.find({ collection: 'products', limit: 1, where: { sku: { equals: n.sku } } })
          : null
      const isUpdate = Boolean(row.id) || Boolean(existing?.docs[0])

      const next: Partial<Record<string, unknown>> = {
        ...row,
        badges: row.badges ?? n.badges,
        description: n.description || undefined,
        name: n.name || undefined,
        // price comes straight from the PPH column (Prix Public de Vente) —
        // it IS the selling price, never a cost/purchase price to mark up.
        price: n.price,
        rating: row.rating ?? 5,
        reviews: row.reviews ?? 0,
        size: n.size || undefined,
        tint: row.tint ?? '#F2F2F2',
      }
      if (n.barcode) next.barcode = n.barcode
      if (n.sku) next.sku = n.sku
      if (brand) next.brand = brand
      if (n.category) next.category = n.category
      if (n.oldPrice) next.oldPrice = n.oldPrice

      // New products always land as an unpublished draft with 0 sellable
      // stock — an administrator must review and publish them before
      // they're live on the storefront. Updates to an existing product
      // leave isPublished/stock untouched.
      if (!isUpdate) {
        next.isPublished = false
        next.stock = 0
      }

      return next
    }),
  )
}
