import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { userHasRole } from '../../../../access/roles'
import { withApiLog } from '../../../../lib/withApiLog'

export const maxDuration = 30

type RestockBody = {
  productId?: number
  quantity?: number
  supplierId?: number
  supplierName?: string
  batchNumber?: string
  expiryDate?: string
  reference?: string
  note?: string
}

/**
 * Atomically adds stock to a product and records the movement — never a
 * blind `stock = <value from the client>` overwrite. `stock = stock +
 * quantity` runs as a single UPDATE...RETURNING statement inside a real
 * Postgres transaction, so two concurrent restocks of the same product both
 * land (8 + 50 + 20 = 78), never a lost update (28). previousStock/newStock
 * are derived from that one atomic result — never a separate read that
 * could race with another request.
 */
async function handlePOST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || !userHasRole(user, 'admin', 'manager', 'stockManager')) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  let body: RestockBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const productId = Number(body.productId)
  const quantity = Number(body.quantity)

  if (!Number.isInteger(productId) || productId <= 0) {
    return Response.json({ error: 'Produit invalide.' }, { status: 400 })
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return Response.json({ error: 'La quantité doit être un nombre entier positif.' }, { status: 400 })
  }

  const batchNumber = body.batchNumber?.trim() || null
  const expiryDate = body.expiryDate ? new Date(body.expiryDate).toISOString() : null
  const reference = body.reference?.trim() || null
  const note = body.note?.trim() || null

  const pool = payload.db.pool
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Resolve/create the supplier inside the same transaction — "+ Nouveau
    // fournisseur" never leaves the restock workflow, and never creates a
    // duplicate for a name that already exists.
    let supplierId: number | null = body.supplierId ? Number(body.supplierId) : null
    if (!supplierId && body.supplierName?.trim()) {
      const name = body.supplierName.trim()
      const existing = await client.query('SELECT id FROM suppliers WHERE name = $1 LIMIT 1', [name])
      if (existing.rows[0]) {
        supplierId = existing.rows[0].id
      } else {
        const created = await client.query('INSERT INTO suppliers (name) VALUES ($1) RETURNING id', [name])
        supplierId = created.rows[0].id
      }
    }

    const productRes = await client.query(
      'UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2 RETURNING id, name, stock',
      [quantity, productId],
    )
    const productRow = productRes.rows[0]
    if (!productRow) {
      await client.query('ROLLBACK')
      return Response.json({ error: 'Produit introuvable.' }, { status: 404 })
    }

    const newStock = Number(productRow.stock)
    const previousStock = newStock - quantity

    const movementRes = await client.query(
      `INSERT INTO stock_movements
        (product_id, previous_stock, new_stock, delta, source, reason, batch_number, expiry_date, supplier_id, reference, created_by_id, updated_at, created_at)
       VALUES ($1, $2, $3, $4, 'restock', $5, $6, $7, $8, $9, $10, now(), now())
       RETURNING id`,
      [productId, previousStock, newStock, quantity, note || 'Réapprovisionnement', batchNumber, expiryDate, supplierId, reference, user.id],
    )

    // Batch tracking is only touched when the restock actually carries batch
    // info — a product not using batches just gets the stock-movements audit
    // row above. An existing batch (same product + batch number) accumulates
    // quantity; a new batch number creates a new row, per-batch expiry
    // preserved rather than overwritten.
    if (batchNumber) {
      const existingBatch = await client.query(
        'SELECT id FROM inventory WHERE product_id = $1 AND batch_number = $2 LIMIT 1 FOR UPDATE',
        [productId, batchNumber],
      )
      if (existingBatch.rows[0]) {
        await client.query('UPDATE inventory SET quantity = quantity + $1, updated_at = now() WHERE id = $2', [
          quantity,
          existingBatch.rows[0].id,
        ])
      } else {
        await client.query(
          `INSERT INTO inventory (product_id, batch_number, expiry_date, supplier_id, quantity, received_at, updated_at, created_at)
           VALUES ($1, $2, $3, $4, $5, now(), now(), now())`,
          [productId, batchNumber, expiryDate, supplierId, quantity],
        )
      }
    }

    await client.query('COMMIT')

    return Response.json({
      movementId: movementRes.rows[0].id,
      newStock,
      previousStock,
      productName: productRow.name,
    })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return Response.json(
      { error: err instanceof Error ? err.message : 'Erreur lors du réapprovisionnement.' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

export const POST = withApiLog('/api/inventory/restock', handlePOST)
