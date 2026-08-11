import { CATEGORY_OPTIONS } from '../../collections/Products'
import { normalizeText } from '../textNormalize'
import { COLUMN_ALIASES, type ColumnMapping, type ImportField, normalizeKey } from './fields'

const PLACEHOLDER_VALUES = new Set(['-', '--', 'n/a', 'na', 'none', '/'])

function asText(value: unknown): string {
  const text = normalizeText(value)
  return PLACEHOLDER_VALUES.has(text.toLowerCase()) ? '' : text
}

/** A manual column mapping (typed in or picked by the user) always wins over auto-detection via aliases. */
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

function parseNumber(value: unknown): number | undefined {
  const text = asText(value).replace(/[^\d.,-]/g, '').replace(',', '.')
  if (!text) return undefined
  const n = Number.parseFloat(text)
  return Number.isFinite(n) ? n : undefined
}

const TRUTHY = new Set(['1', 'true', 'yes', 'oui', 'active', 'actif', 'published', 'publie', 'publié', 'en ligne'])
const FALSY = new Set(['0', 'false', 'no', 'non', 'inactive', 'inactif', 'draft', 'brouillon', 'hors ligne'])

/** Undefined means "not specified" (leave existing value alone on update, default on create) — distinct from explicit false. */
function parseBoolean(value: unknown): boolean | undefined {
  const text = asText(value).toLowerCase()
  if (!text) return undefined
  if (TRUTHY.has(text)) return true
  if (FALSY.has(text)) return false
  return undefined
}

/** Excel/SheetJS represents dates as a day-count from 1899-12-30 — 25569 is
 * that epoch's offset from the Unix epoch. SheetJS auto-detects date-looking
 * cells and serializes them this way even for plain CSV input (parsed with
 * `raw: true`, per parseSpreadsheet.ts), so "2027-01-01" in a CSV can arrive
 * here as the string "46388.041..." (the fractional part is a timezone
 * rounding artifact, not a real time-of-day) rather than the literal text. */
function excelSerialToISODate(serial: number): string | undefined {
  if (!Number.isFinite(serial) || serial < 1 || serial > 100000) return undefined
  // Round to the whole day first — expiryDate is date-only, and the
  // fractional part SheetJS adds here is a timezone-rounding artifact of its
  // CSV date auto-detection, not a real time-of-day.
  const d = new Date(Math.round(serial) * 86400 * 1000 - 25569 * 86400 * 1000)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function parseDate(value: unknown): string | undefined {
  if (typeof value === 'number') return excelSerialToISODate(value)
  const text = asText(value)
  if (!text) return undefined
  if (/^\d+(\.\d+)?$/.test(text)) {
    const fromSerial = excelSerialToISODate(Number.parseFloat(text))
    if (fromSerial) return fromSerial
  }
  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

const CATEGORY_KEYWORDS: [RegExp, (typeof CATEGORY_OPTIONS)[number]][] = [
  [/solair|spf|uv/i, 'Solaire'],
  [/cheveux|capillaire|shampoo|shampooing|ampoule/i, 'Cheveux'],
  [/b[ée]b[ée]|maman|grossesse/i, 'Baby & Mom'],
  [/corps|lait corps|gel douche|d[ée]odorant|[ée]pilat/i, 'Corps'],
  [/visage|facial|nettoyant|s[ée]rum|cr[eè]me/i, 'Visage'],
]

/** Exact match against the fixed category enum first (a well-named column
 * usually already contains one of these labels), else best-effort keyword
 * guess from the category text plus the product title. Products.category is
 * a fixed 5-option enum (drives the storefront's category filter) rather
 * than a free-form relationship, so "auto-create category" from the spec is
 * interpreted as "resolve to the closest existing option", not a new
 * per-import taxonomy — see the import route's doc comment for why. */
function resolveCategory(categoryText: string, title: string): (typeof CATEGORY_OPTIONS)[number] | undefined {
  const exact = CATEGORY_OPTIONS.find((opt) => opt.toLowerCase() === categoryText.toLowerCase())
  if (exact) return exact
  const combined = `${categoryText} ${title}`
  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(combined)) return category
  }
  return undefined
}

export type NormalizedImportRow = {
  title: string
  slug: string
  sku: string
  barcode: string
  brandName: string
  category: (typeof CATEGORY_OPTIONS)[number] | undefined
  categoryText: string
  description: string
  price: number | undefined
  compareAtPrice: number | undefined
  stock: number | undefined
  lowStockThreshold: number | undefined
  expiryDate: string | undefined
  batchNumber: string
  supplierName: string
  imageUrl: string
  isPublished: boolean | undefined
  featured: boolean | undefined
}

/** Pure, no-DB-access normalization of one raw spreadsheet row into the
 * shape the upsert step needs. `mapping` carries manual column overrides
 * from the import wizard — always wins over auto-detection. */
export function normalizeImportRow(raw: Record<string, unknown>, mapping?: ColumnMapping): NormalizedImportRow {
  const title = asText(findColumn(raw, 'title', mapping))
  const categoryText = asText(findColumn(raw, 'category', mapping))

  return {
    barcode: asText(findColumn(raw, 'barcode', mapping)).replace(/\.$/, ''),
    batchNumber: asText(findColumn(raw, 'batchNumber', mapping)),
    brandName: asText(findColumn(raw, 'brand', mapping)),
    category: resolveCategory(categoryText, title),
    categoryText,
    compareAtPrice: parseNumber(findColumn(raw, 'compareAtPrice', mapping)),
    description: asText(findColumn(raw, 'description', mapping)),
    expiryDate: parseDate(findColumn(raw, 'expiryDate', mapping)),
    featured: parseBoolean(findColumn(raw, 'featured', mapping)),
    imageUrl: asText(findColumn(raw, 'imageUrl', mapping)),
    isPublished: parseBoolean(findColumn(raw, 'status', mapping)),
    lowStockThreshold: parseNumber(findColumn(raw, 'lowStockThreshold', mapping)),
    price: parseNumber(findColumn(raw, 'price', mapping)),
    sku: asText(findColumn(raw, 'sku', mapping)),
    slug: asText(findColumn(raw, 'slug', mapping)),
    stock: parseNumber(findColumn(raw, 'stock', mapping)),
    supplierName: asText(findColumn(raw, 'supplier', mapping)),
    title,
  }
}
