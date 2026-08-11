import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { userHasRole } from '../../../../../access/roles'
import type { ColumnMapping } from '../../../../../lib/dashboardImport/fields'
import { normalizeImportRow } from '../../../../../lib/dashboardImport/normalize'
import { upsertImportRow, type RowOutcome } from '../../../../../lib/dashboardImport/upsert'

export const maxDuration = 60

const MAX_ROWS_PER_REQUEST = 200

type RawRow = { raw: Record<string, unknown>; rowIndex: number; sheet: string }

type RunBody = { rows: RawRow[]; mapping?: ColumnMapping }

/**
 * Commits one batch of rows (the dashboard UI slices a file into batches of
 * 50-100 and calls this endpoint once per batch, accumulating results for
 * the progress bar). Re-normalizes and re-validates every row from its raw
 * data server-side — the client's own preview is never trusted as-is, only
 * used to decide which rows to send.
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !userHasRole(user, 'admin', 'manager', 'stockManager')) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  let body: RunBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return Response.json({ error: 'Aucune ligne à importer.' }, { status: 400 })
  }
  if (body.rows.length > MAX_ROWS_PER_REQUEST) {
    return Response.json({ error: `Trop de lignes en une seule requête (max ${MAX_ROWS_PER_REQUEST}).` }, { status: 400 })
  }

  const normalizedRows = body.rows.map((r) => ({ ...r, normalized: normalizeImportRow(r.raw, body.mapping) }))
  // Postgres text equality is case-sensitive — query with original-case SKUs.
  const skus = [...new Set(normalizedRows.map((r) => r.normalized.sku).filter(Boolean))]
  const existingDocs = skus.length
    ? await payload.find({
        collection: 'products',
        limit: skus.length,
        pagination: false,
        select: { sku: true },
        where: { sku: { in: skus } },
      })
    : { docs: [] }
  const existingSkus = new Set(
    existingDocs.docs.map((d) => (typeof d.sku === 'string' ? d.sku.toLowerCase() : '')).filter(Boolean),
  )

  const results: RowOutcome[] = []
  // Sequential, not parallel: find-or-create on brand/supplier races if two
  // rows creating the *same new* brand run concurrently, and each row's own
  // create-vs-update decision depends on the previous row's write when two
  // rows in one batch share a SKU (see upsertImportRow's own fresh lookup).
  for (const { normalized, rowIndex, sheet } of normalizedRows) {
    results.push(await upsertImportRow(payload, normalized, rowIndex, sheet, existingSkus))
  }

  const summary = {
    created: results.filter((r) => r.status === 'created').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    updated: results.filter((r) => r.status === 'updated').length,
  }

  return Response.json({ results, summary })
}
