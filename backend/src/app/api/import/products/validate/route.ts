import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { userHasRole } from '../../../../../access/roles'
import { IMPORT_FIELDS, type ColumnMapping, suggestColumnForField } from '../../../../../lib/dashboardImport/fields'
import { normalizeImportRow } from '../../../../../lib/dashboardImport/normalize'
import { parseSpreadsheet } from '../../../../../lib/parseSpreadsheet'
import { validateImportRow } from '../../../../../lib/dashboardImport/validate'

export const maxDuration = 60

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

type RawRow = { raw: Record<string, unknown>; rowIndex: number; sheet: string }

async function readRows(request: Request) {
  const form = await request.formData()
  const file = form.get('file')
  const selectedSheets = form.get('sheets') ? JSON.parse(String(form.get('sheets'))) : null
  const mapping: ColumnMapping | undefined = form.get('mapping') ? JSON.parse(String(form.get('mapping'))) : undefined

  if (!(file instanceof Blob)) throw new Error('Aucun fichier reçu.')

  const filename = (file as File).name || ''
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Type de fichier non pris en charge — utilisez .csv, .xlsx ou .xls.')
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo, limite 15 Mo).`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sheets = parseSpreadsheet(buffer)
  const usedSheets = selectedSheets ? sheets.filter((s) => selectedSheets.includes(s.name)) : sheets

  const rows: RawRow[] = []
  const columns = new Set<string>()
  for (const sheet of usedSheets) {
    sheet.rows.forEach((raw, i) => {
      rows.push({ raw, rowIndex: i + 1, sheet: sheet.name })
      Object.keys(raw).forEach((key) => columns.add(key))
    })
  }

  return { columns: [...columns], mapping, rows, sheetNames: sheets.map((s) => s.name) }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !userHasRole(user, 'admin', 'manager', 'stockManager')) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  let parsed: Awaited<ReturnType<typeof readRows>>
  try {
    parsed = await readRows(request)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Fichier invalide.' }, { status: 400 })
  }

  // One bulk lookup for the whole file, not one query per row. Postgres text
  // equality is case-sensitive, so the `in` filter must use SKUs in their
  // original case — only the in-memory Set membership check below is
  // case-insensitive.
  const normalizedBySku = parsed.rows.map((r) => ({ ...r, normalized: normalizeImportRow(r.raw, parsed.mapping) }))
  const skusInFile = [...new Set(normalizedBySku.map((r) => r.normalized.sku).filter(Boolean))]
  const existingDocs = skusInFile.length
    ? await payload.find({
        collection: 'products',
        limit: skusInFile.length,
        pagination: false,
        select: { sku: true },
        where: { sku: { in: skusInFile } },
      })
    : { docs: [] }
  const existingSkus = new Set(
    existingDocs.docs.map((d) => (typeof d.sku === 'string' ? d.sku.toLowerCase() : '')).filter(Boolean),
  )

  const seenSkusInFile = new Set<string>()
  const previewRows = normalizedBySku.map(({ normalized, rowIndex, sheet }) => {
    const validation = validateImportRow(normalized, existingSkus)
    const skuKey = normalized.sku.toLowerCase()
    if (skuKey && seenSkusInFile.has(skuKey)) {
      validation.errors.push('SKU en doublon dans ce fichier')
    } else if (skuKey) {
      seenSkusInFile.add(skuKey)
    }
    return {
      ...normalized,
      errors: validation.errors,
      isUpdate: validation.isUpdate,
      rowIndex,
      sheet,
      warnings: validation.warnings,
    }
  })

  const suggestedMapping: ColumnMapping = {}
  for (const field of IMPORT_FIELDS) {
    const suggestion = suggestColumnForField(parsed.columns, field)
    if (suggestion) suggestedMapping[field] = suggestion
  }

  return Response.json({
    columns: parsed.columns,
    rawRows: parsed.rows,
    rows: previewRows,
    sheetNames: parsed.sheetNames,
    suggestedMapping,
    summary: {
      invalid: previewRows.filter((r) => r.errors.length > 0).length,
      toCreate: previewRows.filter((r) => r.errors.length === 0 && !r.isUpdate).length,
      toUpdate: previewRows.filter((r) => r.errors.length === 0 && r.isUpdate).length,
      total: previewRows.length,
      valid: previewRows.filter((r) => r.errors.length === 0).length,
    },
  })
}
