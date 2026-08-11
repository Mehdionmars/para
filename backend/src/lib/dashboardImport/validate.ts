import type { NormalizedImportRow } from './normalize'

export type RowValidation = {
  errors: string[]
  warnings: string[]
  /** Whether this SKU already exists in the DB — decides create vs. update, and which fields are strictly required. */
  isUpdate: boolean
}

/** Pure validation of one already-normalized row. `existingSkus` is a single
 * bulk-fetched set (one query for the whole file, not one per row) so the
 * caller can tell creates from updates without a DB round-trip per row —
 * updates don't need to repeat a price/category the product already has. */
export function validateImportRow(row: NormalizedImportRow, existingSkus: Set<string>): RowValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const isUpdate = existingSkus.has(row.sku.toLowerCase())

  if (!row.title) errors.push('Titre manquant')
  if (!row.sku) errors.push('SKU manquant')

  if (row.price === undefined) {
    if (!isUpdate) errors.push('Prix requis pour créer un nouveau produit')
  }

  if (row.stock !== undefined && row.stock < 0) errors.push('Stock invalide (négatif)')
  if (row.lowStockThreshold !== undefined && row.lowStockThreshold < 0) errors.push('Seuil de stock invalide (négatif)')
  if (row.price !== undefined && row.price < 0) errors.push('Prix invalide (négatif)')

  if (!row.category) {
    if (!isUpdate) errors.push('Catégorie non reconnue — requise pour créer un nouveau produit')
    else if (row.categoryText) warnings.push(`Catégorie "${row.categoryText}" non reconnue — catégorie existante conservée`)
  }

  return { errors, isUpdate, warnings }
}
