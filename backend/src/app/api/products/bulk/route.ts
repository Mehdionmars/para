import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { PoolClient } from 'pg'

import { userHasRole } from '../../../../access/roles'
import { CATEGORY_OPTIONS } from '../../../../collections/Products'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 60

/** Above this, a single request would hold row locks long enough to stall the
 * storefront. The dashboard chunks larger selections. */
const MAX_IDS = 500

type StockOp = { type: 'stock'; mode: 'set' | 'increase' | 'decrease'; value: number; reason?: string }
type PriceOp = { type: 'price'; mode: 'set' | 'increase' | 'decrease'; value: number }
type StatusOp = { type: 'status'; value: 'published' | 'draft' | 'archived' }
type PromotionOp = { type: 'promotion'; mode: 'enable' | 'disable'; percent?: number; price?: number }
type CategoryOp = { type: 'category'; value: string }
type BrandOp = { type: 'brand'; value: number }
type FeaturedOp = { type: 'featured'; value: boolean }

type Operation = StockOp | PriceOp | StatusOp | PromotionOp | CategoryOp | BrandOp | FeaturedOp

type BulkBody = {
  ids?: number[]
  operation?: Operation
  /**
   * Optimistic-concurrency guard. The dashboard sends the newest `updatedAt`
   * it displayed; any product modified after that instant is reported as a
   * conflict instead of being silently overwritten by a value computed from
   * data the operator never saw.
   */
  seenAt?: string
}

type RowResult = { id: number; name: string; before: number | string | null; after: number | string | null }

/**
 * Bulk catalogue operations.
 *
 * Every number that ends up in the database is computed **here**, from the
 * row as it exists in this transaction. The request body only ever carries an
 * *instruction* ("decrease price by 10%"), never a resulting price or stock.
 * A tampered client can therefore change which products are touched and by
 * what rule — both of which the role check gates — but cannot dictate an
 * arbitrary final value, and cannot drive stock negative.
 *
 * Everything runs in one transaction: a selection either applies completely
 * or not at all, so a half-applied price change can never be left behind.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  let body: BulkBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const operation = body.operation
  if (!operation || typeof operation.type !== 'string') {
    return Response.json({ error: 'Opération manquante.' }, { status: 400 })
  }

  // stockManager may only move stock; everything else is a content edit.
  const isStockOnly = userHasRole(user, 'stockManager') && !userHasRole(user, 'admin', 'manager', 'editor')
  const allowed = isStockOnly
    ? operation.type === 'stock'
    : userHasRole(user, 'admin', 'manager', 'editor')

  if (!allowed) {
    return Response.json({ error: 'Votre rôle ne permet pas cette opération.' }, { status: 403 })
  }

  const ids = [...new Set((body.ids ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0))]
  if (ids.length === 0) return Response.json({ error: 'Aucun produit sélectionné.' }, { status: 400 })
  if (ids.length > MAX_IDS) {
    return Response.json({ error: `Maximum ${MAX_IDS} produits par opération.` }, { status: 400 })
  }

  const invalid = validateOperation(operation)
  if (invalid) return Response.json({ error: invalid }, { status: 400 })

  const client = await payload.db.pool.connect()
  try {
    await client.query('BEGIN')

    // Ascending id order, as in the checkout: a deterministic lock order
    // across all writers is what keeps two overlapping bulk edits from
    // deadlocking against each other.
    const sorted = [...ids].sort((a, b) => a - b)
    const locked = await client.query(
      `SELECT id, name, price, old_price, stock, category, brand_id, is_published, discontinued, featured, updated_at
         FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE`,
      [sorted],
    )

    if (locked.rowCount === 0) {
      await client.query('ROLLBACK')
      return Response.json({ error: 'Aucun des produits sélectionnés n’existe encore.' }, { status: 404 })
    }

    if (body.seenAt) {
      const seen = new Date(body.seenAt)
      const stale = locked.rows.filter((r) => new Date(r.updated_at) > seen)
      if (stale.length > 0) {
        await client.query('ROLLBACK')
        return Response.json(
          {
            conflicts: stale.map((r) => ({ id: r.id, name: r.name })),
            error:
              stale.length === 1
                ? `« ${stale[0].name} » a été modifié entre-temps. Rafraîchissez avant de réappliquer.`
                : `${stale.length} produits ont été modifiés entre-temps. Rafraîchissez avant de réappliquer.`,
          },
          { status: 409 },
        )
      }
    }

    const results: RowResult[] = []
    for (const row of locked.rows) {
      const applied = await applyOperation({ client, operation, row, userId: user.id })
      if (applied) results.push(applied)
    }

    await client.query('COMMIT')

    return Response.json({
      // Selections can outlive the products in them (another operator deleted
      // one mid-edit); reported rather than silently ignored.
      missing: ids.length - locked.rows.length,
      ok: true,
      results,
      updated: results.length,
    })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    payload.logger.error({ err }, 'Opération bulk produits échouée')
    return Response.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de l’opération.' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

function validateOperation(op: Operation): string | null {
  switch (op.type) {
    case 'stock': {
      if (!Number.isInteger(op.value) || op.value < 0) return 'La quantité doit être un entier positif.'
      if (op.value > 1_000_000) return 'Quantité irréaliste.'
      return null
    }
    case 'price': {
      if (!Number.isFinite(op.value) || op.value < 0) return 'Le prix doit être un nombre positif.'
      if (op.mode !== 'set' && op.value > 100) return 'Le pourcentage doit être compris entre 0 et 100.'
      if (op.mode === 'set' && op.value > 1_000_000) return 'Prix irréaliste.'
      return null
    }
    case 'status':
      return ['published', 'draft', 'archived'].includes(op.value) ? null : 'Statut inconnu.'
    case 'promotion': {
      if (op.mode === 'disable') return null
      if (op.percent !== undefined) {
        return Number.isFinite(op.percent) && op.percent > 0 && op.percent < 100
          ? null
          : 'La réduction doit être comprise entre 1 et 99 %.'
      }
      if (op.price !== undefined) {
        return Number.isFinite(op.price) && op.price >= 0 ? null : 'Prix promotionnel invalide.'
      }
      return 'Indiquez un pourcentage ou un prix promotionnel.'
    }
    case 'category':
      // Checked against the collection's own list rather than left to the
      // Postgres enum: an invalid value would otherwise abort the whole
      // transaction with a raw type error instead of a usable message.
      return (CATEGORY_OPTIONS as readonly string[]).includes(op.value) ? null : 'Catégorie inconnue.'
    case 'brand':
      return Number.isInteger(op.value) && op.value > 0 ? null : 'Marque invalide.'
    case 'featured':
      return typeof op.value === 'boolean' ? null : 'Valeur invalide.'
    default:
      return 'Opération inconnue.'
  }
}

type ProductRow = {
  id: number
  name: string
  price: string | number
  old_price: string | number | null
  stock: number
  category: string | null
  brand_id: number | null
  is_published: boolean
  discontinued: boolean
  featured: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

async function applyOperation({
  client,
  operation,
  row,
  userId,
}: {
  client: PoolClient
  operation: Operation
  row: ProductRow
  userId: number
}): Promise<RowResult | null> {
  switch (operation.type) {
    case 'stock': {
      const before = Number(row.stock)
      const after =
        operation.mode === 'set'
          ? operation.value
          : operation.mode === 'increase'
            ? before + operation.value
            // Floored at zero rather than refused: an operator removing 10
            // units from a product that only has 4 means "empty it", and
            // failing the whole batch over it would be worse than useless.
            : Math.max(0, before - operation.value)

      if (after === before) return null

      await client.query('UPDATE products SET stock = $1, updated_at = now() WHERE id = $2', [after, row.id])

      // Same audit trail as the restock endpoint, so bulk edits are as
      // traceable as single ones.
      await client.query(
        `INSERT INTO stock_movements
           (product_id, previous_stock, new_stock, delta, source, reason, created_by_id, updated_at, created_at)
         VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, now(), now())`,
        [row.id, before, after, after - before, operation.reason?.trim() || 'Modification groupée', userId],
      )

      return { after, before, id: row.id, name: row.name }
    }

    case 'price': {
      const before = Number(row.price)
      const after =
        operation.mode === 'set'
          ? round2(operation.value)
          : operation.mode === 'increase'
            ? round2(before * (1 + operation.value / 100))
            : round2(before * (1 - operation.value / 100))

      if (after === before) return null
      await client.query('UPDATE products SET price = $1, updated_at = now() WHERE id = $2', [after, row.id])
      return { after, before, id: row.id, name: row.name }
    }

    case 'status': {
      const isPublished = operation.value === 'published'
      const discontinued = operation.value === 'archived'
      const before = row.discontinued ? 'archived' : row.is_published ? 'published' : 'draft'
      if (before === operation.value) return null

      await client.query(
        'UPDATE products SET is_published = $1, discontinued = $2, updated_at = now() WHERE id = $3',
        [isPublished, discontinued, row.id],
      )
      return { after: operation.value, before, id: row.id, name: row.name }
    }

    case 'promotion': {
      const price = Number(row.price)
      const oldPrice = row.old_price === null ? null : Number(row.old_price)

      if (operation.mode === 'disable') {
        // Restoring means putting the struck-through price back as the real
        // one. Without an oldPrice there was no promotion to undo.
        if (oldPrice === null) return null
        await client.query(
          'UPDATE products SET price = $1, old_price = NULL, updated_at = now() WHERE id = $2',
          [oldPrice, row.id],
        )
        return { after: oldPrice, before: price, id: row.id, name: row.name }
      }

      // Enabling twice must not compound: the reference is the existing
      // oldPrice when there already is one, so "-20%" always means 20% off
      // the original, never 20% off an already-discounted price.
      const reference = oldPrice ?? price
      const next =
        operation.percent !== undefined
          ? round2(reference * (1 - operation.percent / 100))
          : round2(Number(operation.price))

      if (next >= reference) {
        throw new Error(`« ${row.name} » : le prix promotionnel doit être inférieur au prix de référence.`)
      }
      if (next === price && oldPrice === reference) return null

      await client.query('UPDATE products SET price = $1, old_price = $2, updated_at = now() WHERE id = $3', [
        next,
        reference,
        row.id,
      ])
      return { after: next, before: price, id: row.id, name: row.name }
    }

    case 'category': {
      if (row.category === operation.value) return null
      await client.query('UPDATE products SET category = $1, updated_at = now() WHERE id = $2', [
        operation.value,
        row.id,
      ])
      return { after: operation.value, before: row.category, id: row.id, name: row.name }
    }

    case 'brand': {
      if (row.brand_id === operation.value) return null
      await client.query('UPDATE products SET brand_id = $1, updated_at = now() WHERE id = $2', [
        operation.value,
        row.id,
      ])
      return { after: operation.value, before: row.brand_id, id: row.id, name: row.name }
    }

    case 'featured': {
      if (row.featured === operation.value) return null
      await client.query('UPDATE products SET featured = $1, updated_at = now() WHERE id = $2', [
        operation.value,
        row.id,
      ])
      return { after: String(operation.value), before: String(row.featured), id: row.id, name: row.name }
    }
  }
}

export const POST = withApiLog('/api/products/bulk', handlePOST)
