import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { IMPORT_FIELDS, type ColumnMapping, suggestColumnForField } from '../../../lib/importFields'
import { normalizeProductRow, resolveBrandId } from '../../../lib/productImportHook'
import { parseSpreadsheet } from '../../../lib/parseSpreadsheet'

export const maxDuration = 60

type PreviewRow = ReturnType<typeof normalizeProductRow> & {
  sheet: string
  rowIndex: number
  issues: string[]
}

function validate(row: ReturnType<typeof normalizeProductRow>): string[] {
  const issues: string[] = []
  if (!row.name) issues.push('Nom manquant')
  if (!row.barcode) issues.push('Code-barres manquant — la ligne sera toujours créée, mais ne pourra pas être mise à jour lors d\'un futur import')
  if (!row.category) issues.push('Catégorie non reconnue automatiquement')
  if (row.price === undefined) issues.push('Prix manquant ou invalide')
  if (!row.brandName) issues.push('Marque manquante')
  return issues
}

async function readRows(request: Request) {
  const form = await request.formData()
  const file = form.get('file')
  const mode = String(form.get('mode') || 'preview')
  const selectedSheets = form.get('sheets') ? JSON.parse(String(form.get('sheets'))) : null
  const mapping: ColumnMapping | undefined = form.get('mapping') ? JSON.parse(String(form.get('mapping'))) : undefined

  if (!(file instanceof Blob)) {
    throw new Error('Aucun fichier reçu.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sheets = parseSpreadsheet(buffer)
  const usedSheets = selectedSheets ? sheets.filter((s) => selectedSheets.includes(s.name)) : sheets

  const rows: { raw: Record<string, unknown>; sheet: string; rowIndex: number }[] = []
  const columns = new Set<string>()
  for (const sheet of usedSheets) {
    sheet.rows.forEach((raw, i) => {
      rows.push({ raw, rowIndex: i + 1, sheet: sheet.name })
      Object.keys(raw).forEach((key) => columns.add(key))
    })
  }

  return { columns: [...columns], mapping, mode, rows, sheetNames: sheets.map((s) => s.name) }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  let parsed: Awaited<ReturnType<typeof readRows>>
  try {
    parsed = await readRows(request)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Fichier invalide.' }, { status: 400 })
  }

  if (parsed.mode === 'preview') {
    const preview: PreviewRow[] = parsed.rows.map(({ raw, rowIndex, sheet }) => {
      const normalized = normalizeProductRow(raw, parsed.mapping)
      // PentaGroup-style sheets: one brand per tab, sometimes with no
      // explicit brand/supplier column — the sheet name is the brand.
      if (!normalized.brandName) normalized.brandName = sheet
      return { ...normalized, issues: validate(normalized), rowIndex, sheet }
    })
    const suggestedMapping: ColumnMapping = {}
    for (const field of IMPORT_FIELDS) {
      const suggestion = suggestColumnForField(parsed.columns, field)
      if (suggestion) suggestedMapping[field] = suggestion
    }
    return Response.json({
      columns: parsed.columns,
      preview,
      sheetNames: parsed.sheetNames,
      suggestedMapping,
      total: preview.length,
      withIssues: preview.filter((r) => r.issues.length > 0).length,
    })
  }

  // --- commit ---
  const brandIdByName = new Map<string, number>()
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: { message: string; row: number; sheet: string }[] = []

  for (const { raw, rowIndex, sheet } of parsed.rows) {
    try {
      const n = normalizeProductRow(raw, parsed.mapping)
      const brandName = n.brandName || sheet
      if (!n.name || !brandName || n.price === undefined) {
        skipped++
        errors.push({ message: 'Ligne ignorée : nom, marque ou prix manquant.', row: rowIndex, sheet })
        continue
      }

      let brandId = brandIdByName.get(brandName)
      if (!brandId) {
        brandId = await resolveBrandId(payload, brandName)
        if (brandId) brandIdByName.set(brandName, brandId)
      }
      if (!brandId) {
        skipped++
        errors.push({ message: 'Impossible de résoudre la marque.', row: rowIndex, sheet })
        continue
      }

      // price comes straight from the PPH column (Prix Public de Vente) —
      // it IS the selling price, never a cost/purchase price to mark up.
      const data: Record<string, unknown> = {
        badge: n.badge,
        brand: brandId,
        description: n.description || n.name,
        name: n.name,
        price: n.price,
        size: n.size || undefined,
        tint: '#F2F2F2',
      }
      if (n.category) data.category = n.category
      if (n.oldPrice) data.oldPrice = n.oldPrice
      if (n.sku) data.sku = n.sku
      if (n.barcode) data.barcode = n.barcode

      const existing = n.barcode
        ? await payload.find({ collection: 'products', limit: 1, where: { barcode: { equals: n.barcode } } })
        : null

      if (existing?.docs[0]) {
        // Updating an already-reviewed product: don't touch isPublished/stock.
        await payload.update({ id: existing.docs[0].id, collection: 'products', data })
        updated++
      } else {
        if (!data.category) data.category = 'Visage'
        // New products always land as an unpublished draft with 0 sellable
        // stock — an administrator must review and publish them before
        // they're live on the storefront.
        data.isPublished = false
        data.stock = 0
        await payload.create({ collection: 'products', data: data as never })
        created++
      }
    } catch (err) {
      skipped++
      errors.push({ message: err instanceof Error ? err.message : 'Erreur inconnue.', row: rowIndex, sheet })
    }
  }

  return Response.json({ created, errors, skipped, total: parsed.rows.length, updated })
}
