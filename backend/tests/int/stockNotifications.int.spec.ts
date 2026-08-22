// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { detectStockEvent, notifyStockChange } from '@/lib/notifications/stock'

vi.setConfig({ hookTimeout: 90_000, testTimeout: 60_000 })

let payload: Payload
let productId: number
let productName: string
let baseline: { stock: number; threshold: number }

const KEY_PREFIX = 'stock-test'

async function notificationsFor(event: string) {
  const res = await payload.db.pool.query(
    `SELECT id, type, channel, status, dedupe_key FROM notifications
      WHERE product_id = $1 AND type = $2 ORDER BY id`,
    [productId, event],
  )
  return res.rows as { channel: string; dedupe_key: string; id: number; status: string; type: string }[]
}

describe('Alertes de stock', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const found = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: 'id',
      where: { isPublished: { equals: true } },
    })
    const doc = found.docs[0] as { id: number; name: string; stock: number; lowStockThreshold: number }
    productId = doc.id
    productName = doc.name
    baseline = { stock: doc.stock, threshold: doc.lowStockThreshold }
  })

  afterAll(async () => {
    await payload.db.pool.query(`DELETE FROM notifications WHERE dedupe_key LIKE '%${KEY_PREFIX}%'`)
    await payload.db.pool.query('UPDATE products SET stock = $1, low_stock_threshold = $2 WHERE id = $3', [
      baseline.stock,
      baseline.threshold,
      productId,
    ])
  })

  // ------------------------------------------------ détection pure

  it('LOW_STOCK uniquement au franchissement du seuil', () => {
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 4, previousStock: 6 })).toBe('LOW_STOCK')
    // Déjà sous le seuil : pas de franchissement, donc pas de nouvelle alerte.
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 3, previousStock: 4 })).toBeNull()
    // Pile sur le seuil compte comme un franchissement (<=).
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 5, previousStock: 6 })).toBe('LOW_STOCK')
  })

  it('respecte un seuil supérieur à 100 — le cas que l’ancien filtre manquait', () => {
    expect(detectStockEvent({ lowStockThreshold: 150, newStock: 120, previousStock: 160 })).toBe('LOW_STOCK')
  })

  it('OUT_OF_STOCK et BACK_IN_STOCK', () => {
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 0, previousStock: 3 })).toBe('OUT_OF_STOCK')
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 0, previousStock: 0 })).toBeNull()
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 2, previousStock: 0 })).toBe('BACK_IN_STOCK')
  })

  it('une rupture prime sur un stock faible', () => {
    // 3 -> 0 franchit aussi le seuil, mais la rupture est l'information utile.
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 0, previousStock: 6 })).toBe('OUT_OF_STOCK')
  })

  it('une hausse au-dessus du seuil ne déclenche rien', () => {
    expect(detectStockEvent({ lowStockThreshold: 5, newStock: 40, previousStock: 30 })).toBeNull()
  })

  // ------------------------------------------------ écriture réelle

  it('crée une notification par canal, une seule fois', async () => {
    const change = {
      lowStockThreshold: 5,
      newStock: 4,
      occurrenceId: `${KEY_PREFIX}-1`,
      previousStock: 20,
      productId,
      productName,
    }

    const first = await notifyStockChange({ change, payload })
    expect(first.event).toBe('LOW_STOCK')
    expect(first.created).toBeGreaterThan(0)

    // Rejouer exactement la même occurrence ne doit rien créer.
    const replay = await notifyStockChange({ change, payload })
    expect(replay.created).toBe(0)

    const rows = await notificationsFor('LOW_STOCK')
    const forThisOccurrence = rows.filter((r) => r.dedupe_key.includes(`${KEY_PREFIX}-1`))
    expect(forThisOccurrence.length).toBe(2) // internal + email
    expect(new Set(forThisOccurrence.map((r) => r.channel)).size).toBe(2)
    expect(forThisOccurrence.find((r) => r.channel === 'internal')?.status).toBe('sent')
  })

  it('un second franchissement, plus tard, alerte de nouveau', async () => {
    const before = (await notificationsFor('LOW_STOCK')).length

    await notifyStockChange({
      change: {
        lowStockThreshold: 5,
        newStock: 3,
        occurrenceId: `${KEY_PREFIX}-2`,
        previousStock: 30,
        productId,
        productName,
      },
      payload,
    })

    // L'idempotence porte sur l'occurrence, pas sur le produit : deux
    // franchissements distincts doivent produire deux alertes.
    expect((await notificationsFor('LOW_STOCK')).length).toBeGreaterThan(before)
  })

  it('sans provider email, le canal reste « pending » et jamais « sent »', async () => {
    await notifyStockChange({
      change: {
        lowStockThreshold: 5,
        newStock: 0,
        occurrenceId: `${KEY_PREFIX}-3`,
        previousStock: 8,
        productId,
        productName,
      },
      payload,
    })

    const email = (await notificationsFor('OUT_OF_STOCK')).find(
      (r) => r.channel === 'email' && r.dedupe_key.includes(`${KEY_PREFIX}-3`),
    )
    expect(email).toBeDefined()
    // Aucun provider configuré : l'alerte est due mais non délivrée.
    expect(email!.status).toBe('pending')
    expect(email!.status).not.toBe('sent')
  })

  it('BACK_IN_STOCK reste en interne', async () => {
    await notifyStockChange({
      change: {
        lowStockThreshold: 5,
        newStock: 12,
        occurrenceId: `${KEY_PREFIX}-4`,
        previousStock: 0,
        productId,
        productName,
      },
      payload,
    })

    const rows = (await notificationsFor('BACK_IN_STOCK')).filter((r) =>
      r.dedupe_key.includes(`${KEY_PREFIX}-4`),
    )
    expect(rows.map((r) => r.channel)).toEqual(['internal'])
  })

  it('un non-franchissement n’écrit rien', async () => {
    const before = (await notificationsFor('LOW_STOCK')).length
    const result = await notifyStockChange({
      change: {
        lowStockThreshold: 5,
        newStock: 3,
        occurrenceId: `${KEY_PREFIX}-5`,
        previousStock: 4,
        productId,
        productName,
      },
      payload,
    })
    expect(result.event).toBeNull()
    expect((await notificationsFor('LOW_STOCK')).length).toBe(before)
  })

  it('l’index unique refuse un doublon inséré directement', async () => {
    const key = `product:${productId}:LOW_STOCK:${KEY_PREFIX}-1:internal`
    await expect(
      payload.db.pool.query(
        `INSERT INTO notifications (product_id, type, channel, status, dedupe_key, updated_at, created_at)
         VALUES ($1, 'LOW_STOCK', 'internal', 'sent', $2, now(), now())`,
        [productId, key],
      ),
    ).rejects.toThrow(/duplicate key|unique/i)
  })
})
