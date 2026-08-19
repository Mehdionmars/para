/**
 * Pure, dependency-free field/column metadata for the /dashboard/import bulk
 * importer. Deliberately separate from lib/importFields.ts (the older
 * /admin/import-products feature) — this importer's field set is much wider
 * (stock sync, batch/expiry/supplier, image URLs) and the two features
 * should be free to evolve independently rather than share one mapping UI.
 *
 * CSV/Excel column names match the spec's own vocabulary (title, sku,
 * compareAtPrice, status, featured...) even though several map onto
 * differently-named Product fields (title -> name, compareAtPrice ->
 * oldPrice, status -> isPublished) — see normalize.ts for that mapping.
 */

export const IMPORT_FIELDS = [
  'title',
  'slug',
  'sku',
  'barcode',
  'brand',
  'category',
  'description',
  'price',
  'compareAtPrice',
  'stock',
  'lowStockThreshold',
  'expiryDate',
  'batchNumber',
  'supplier',
  'imageUrl',
  'status',
  'featured',
] as const

export type ImportField = (typeof IMPORT_FIELDS)[number]

export type ColumnMapping = Partial<Record<ImportField, string>>

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  barcode: 'Code-barres',
  batchNumber: 'Numéro de lot',
  brand: 'Marque',
  category: 'Catégorie',
  compareAtPrice: 'Ancien prix (barré)',
  description: 'Description',
  expiryDate: "Date d'expiration",
  featured: 'Mis en avant',
  imageUrl: "URL de l'image",
  lowStockThreshold: 'Seuil de stock faible',
  price: 'Prix (PPH)',
  slug: 'Slug',
  sku: 'SKU',
  status: 'Statut',
  stock: 'Stock',
  supplier: 'Fournisseur',
  title: 'Titre du produit',
}

/** Fields a brand-new product cannot be created without. */
export const REQUIRED_FOR_CREATE: ImportField[] = ['title', 'sku', 'price']

export const COLUMN_ALIASES: Record<ImportField, string[]> = {
  barcode: ['barcode', 'ean', 'code a barres', 'code-barres'],
  batchNumber: ['batchnumber', 'batch number', 'batch', 'numero de lot', 'lot'],
  brand: ['brand', 'marque'],
  category: ['category', 'categorie'],
  compareAtPrice: ['compareatprice', 'compare at price', 'compare_at_price', 'ancien prix', 'oldprice'],
  description: ['description'],
  expiryDate: ['expirydate', 'expiry date', 'expiry_date', 'date expiration', "date d'expiration"],
  featured: ['featured', 'mis en avant'],
  imageUrl: ['imageurl', 'image url', 'image_url', 'image', 'photo'],
  lowStockThreshold: ['lowstockthreshold', 'low stock threshold', 'seuil de stock faible', 'seuil stock'],
  // PPH = Prix Public Homologué/Hospitalier — the regulated public selling
  // price in Moroccan pharmacy catalogs. It maps directly to Product.price:
  // it IS the selling price, never a cost/purchase price to mark up.
  price: ['price', 'prix', 'pph'],
  slug: ['slug'],
  sku: ['sku'],
  status: ['status', 'statut', 'ispublished', 'is_published', 'publie'],
  stock: ['stock', 'quantite', 'quantity'],
  supplier: ['supplier', 'fournisseur'],
  title: ['title', 'titre', 'name', 'nom', 'nom du produit', 'designation'],
}

export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Best-guess raw column header for a target field — mirrors the resolution
 * order findColumn() uses (aliases in priority order), so the mapping UI's
 * "auto-detected" hint always names the column actually used. */
export function suggestColumnForField(columns: string[], field: ImportField): string | undefined {
  const aliases = COLUMN_ALIASES[field] || [field]
  const byNormalizedKey = new Map(columns.map((col) => [normalizeKey(col), col]))
  for (const alias of aliases) {
    const match = byNormalizedKey.get(alias)
    if (match) return match
  }
  return undefined
}
