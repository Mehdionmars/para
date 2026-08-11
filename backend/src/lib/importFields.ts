/**
 * Pure, dependency-free field/column metadata shared between the import API
 * route (server) and the import wizard UI (client) — kept separate from
 * productImportHook.ts so the client bundle never risks pulling in
 * Payload-touching code.
 */

export const IMPORT_FIELDS = [
  'name',
  'brand',
  'category',
  'barcode',
  'price',
  'oldPrice',
  'sku',
  'size',
  'description',
] as const

export type ImportField = (typeof IMPORT_FIELDS)[number]

/** Maps a target product field to the exact raw column header the user picked
 * (or typed in by hand) for it, overriding auto-detection for that field. */
export type ColumnMapping = Partial<Record<ImportField, string>>

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  barcode: 'Code-barres',
  brand: 'Marque',
  category: 'Catégorie',
  description: 'Description',
  name: 'Nom du produit',
  oldPrice: 'Ancien prix',
  price: 'Prix',
  size: 'Contenance',
  sku: 'SKU',
}

/**
 * Real-world supplier catalogs (PentaGroup per-brand sheets, ISDIN PIM
 * exports, hand-cleaned CSVs) each use their own column names. This maps the
 * common variants seen in those files onto the Products schema, rather than
 * forcing every supplier to re-format their spreadsheet by hand.
 */
export const COLUMN_ALIASES: Record<ImportField, string[]> = {
  barcode: ['barcode', 'ean', 'cab', 'codes a barres', 'code a barres', 'code à barre', 'code à barres'],
  brand: ['brand', 'marque', 'supplier', 'fournisseur', 'frs'],
  category: ['category', 'categorie', 'type de soin', 'franchise', 'type'],
  description: ['description'],
  name: ['name', 'title', 'nom produit', 'nom du produit', 'designation'],
  oldPrice: ['oldprice', 'old_price', 'ancien prix'],
  price: ['price', 'pph', 'prix'],
  size: ['size', 'volume', 'contenance'],
  sku: ['sku'],
}

export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Best-guess raw column header for a target field, from the set of headers
 * actually present in the uploaded file — mirrors findColumn's own alias
 * lookup order (productImportHook.ts) so the "Auto détecté" hint shown in
 * the mapping UI always names the column actually used when no manual
 * override is set. A file with both a "Catégorie" and a "Type de soin"
 * column, say, must report the same one findColumn would pick. */
export function suggestColumnForField(columns: string[], field: ImportField): string | undefined {
  const aliases = COLUMN_ALIASES[field] || [field]
  const byNormalizedKey = new Map(columns.map((col) => [normalizeKey(col), col]))
  for (const alias of aliases) {
    const match = byNormalizedKey.get(alias)
    if (match) return match
  }
  return undefined
}
