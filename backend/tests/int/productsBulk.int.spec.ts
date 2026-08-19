// @vitest-environment node
//
// Exercises /api/products/bulk over real HTTP against the running container,
// with a real staff session. Calling the handler directly would skip the
// auth check and the JSON transport, which is where half the risk lives.
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

vi.setConfig({ hookTimeout: 90_000, testTimeout: 60_000 })

const BASE = process.env.TEST_CMS_URL || 'http://localhost:3001'
const STAFF = { email: 'bulk-test-admin@paradhiver.test', password: 'BulkTest!2026' }
const STOCK_ONLY = { email: 'bulk-test-stock@paradhiver.test', password: 'BulkTest!2026' }

let payload: Payload
let adminToken = ''
let stockToken = ''
let productIds: number[] = []
/** Everything created here is restored from this snapshot in afterAll. */
let baseline: { id: number; price: number; oldPrice: number | null; stock: number; category: string; isPublished: boolean; discontinued: boolean; featured: boolean }[] = []

async function login(creds: { email: string; password: string }): Promise<string> {
  const res = await fetch(`${BASE}/api/users/login`, {
    body: JSON.stringify(creds),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await res.json()
  if (!data.token) throw new Error(`Connexion échouée: ${JSON.stringify(data).slice(0, 200)}`)
  return data.token
}

async function bulk(token: string, body: unknown) {
  const res = await fetch(`${BASE}/api/products/bulk`, {
    body: JSON.stringify(body),
    headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return { data: await res.json().catch(() => null), status: res.status }
}

async function readProducts() {
  const res = await payload.find({
    collection: 'products',
    depth: 0,
    limit: productIds.length,
    overrideAccess: true,
    sort: 'id',
    where: { id: { in: productIds } },
  })
  return res.docs as unknown as typeof baseline
}

describe('Opérations groupées sur les produits', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    for (const [creds, roles] of [
      [STAFF, ['admin']],
      [STOCK_ONLY, ['stockManager']],
    ] as const) {
      await payload.delete({ collection: 'users', where: { email: { equals: creds.email } } }).catch(() => {})
      await payload.create({
        collection: 'users',
        data: { email: creds.email, password: creds.password, roles: [...roles] },
        overrideAccess: true,
      })
    }

    adminToken = await login(STAFF)
    stockToken = await login(STOCK_ONLY)

    const found = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 3,
      overrideAccess: true,
      sort: 'id',
      where: { isPublished: { equals: true } },
    })
    productIds = found.docs.map((d) => (d as { id: number }).id)
    baseline = await readProducts()
  })

  afterAll(async () => {
    for (const p of baseline) {
      await payload.db.pool.query(
        `UPDATE products SET price=$1, old_price=$2, stock=$3, category=$4,
                             is_published=$5, discontinued=$6, featured=$7 WHERE id=$8`,
        [p.price, p.oldPrice, p.stock, p.category, p.isPublished, p.discontinued, p.featured, p.id],
      )
    }
    await payload.db.pool.query("DELETE FROM stock_movements WHERE reason LIKE '%groupée%' OR reason = 'test-bulk'")
    for (const creds of [STAFF, STOCK_ONLY]) {
      await payload.delete({ collection: 'users', where: { email: { equals: creds.email } } }).catch(() => {})
    }
  })

  // ------------------------------------------------------------- accès

  it('refuse une requête sans session', async () => {
    const res = await fetch(`${BASE}/api/products/bulk`, {
      body: JSON.stringify({ ids: productIds, operation: { mode: 'increase', type: 'stock', value: 1 } }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    expect(res.status).toBe(401)
  })

  it('un stockManager peut modifier le stock mais pas les prix', async () => {
    const okStock = await bulk(stockToken, {
      ids: [productIds[0]],
      operation: { mode: 'increase', type: 'stock', value: 1 },
    })
    expect(okStock.status).toBe(200)

    const refused = await bulk(stockToken, {
      ids: [productIds[0]],
      operation: { mode: 'decrease', type: 'price', value: 10 },
    })
    expect(refused.status).toBe(403)

    await bulk(stockToken, { ids: [productIds[0]], operation: { mode: 'decrease', type: 'stock', value: 1 } })
  })

  // ------------------------------------------------------------- stock

  it('ajoute, retire et remplace le stock', async () => {
    const before = await readProducts()

    await bulk(adminToken, { ids: productIds, operation: { mode: 'increase', type: 'stock', value: 10 } })
    let after = await readProducts()
    after.forEach((p, i) => expect(p.stock).toBe(before[i].stock + 10))

    await bulk(adminToken, { ids: productIds, operation: { mode: 'decrease', type: 'stock', value: 4 } })
    after = await readProducts()
    after.forEach((p, i) => expect(p.stock).toBe(before[i].stock + 6))

    await bulk(adminToken, { ids: productIds, operation: { mode: 'set', type: 'stock', value: 33 } })
    after = await readProducts()
    after.forEach((p) => expect(p.stock).toBe(33))
  })

  it('ne descend jamais le stock sous zéro', async () => {
    await bulk(adminToken, { ids: [productIds[0]], operation: { mode: 'set', type: 'stock', value: 3 } })
    const res = await bulk(adminToken, {
      ids: [productIds[0]],
      operation: { mode: 'decrease', type: 'stock', value: 999 },
    })
    expect(res.status).toBe(200)
    const after = await readProducts()
    expect(after[0].stock).toBe(0)
  })

  it('trace chaque modification de stock dans les mouvements', async () => {
    await bulk(adminToken, {
      ids: [productIds[0]],
      operation: { mode: 'increase', reason: 'test-bulk', type: 'stock', value: 7 },
    })
    const movements = await payload.find({
      collection: 'stock-movements',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: '-createdAt',
      where: { product: { equals: productIds[0] } },
    })
    const latest = movements.docs[0] as { delta?: number; reason?: string }
    expect(latest.delta).toBe(7)
    expect(latest.reason).toBe('test-bulk')
  })

  // -------------------------------------------------------------- prix

  it('calcule les prix côté serveur et ignore toute valeur du client', async () => {
    const before = await readProducts()

    // A tampered client sending its own "after" price alongside the
    // instruction: the extra field is simply not read.
    await bulk(adminToken, {
      ids: productIds,
      operation: { mode: 'decrease', price: 1, type: 'price', value: 10 },
    })

    const after = await readProducts()
    after.forEach((p, i) => {
      expect(Number(p.price)).toBeCloseTo(Math.round(Number(before[i].price) * 0.9 * 100) / 100, 2)
      expect(Number(p.price)).not.toBe(1)
    })
  })

  it('refuse un pourcentage hors bornes', async () => {
    const res = await bulk(adminToken, {
      ids: productIds,
      operation: { mode: 'decrease', type: 'price', value: 150 },
    })
    expect(res.status).toBe(400)
  })

  // --------------------------------------------------------- promotion

  it('active une promotion sans jamais la composer deux fois', async () => {
    await bulk(adminToken, { ids: [productIds[0]], operation: { mode: 'set', type: 'price', value: 200 } })
    await bulk(adminToken, { ids: [productIds[0]], operation: { mode: 'disable', type: 'promotion' } })

    await bulk(adminToken, { ids: [productIds[0]], operation: { mode: 'enable', percent: 20, type: 'promotion' } })
    let after = await readProducts()
    expect(Number(after[0].price)).toBe(160)
    expect(Number(after[0].oldPrice)).toBe(200)

    // Re-applying -20% must still yield 160, not 128: the reference is the
    // struck-through price, never the already-discounted one.
    await bulk(adminToken, { ids: [productIds[0]], operation: { mode: 'enable', percent: 20, type: 'promotion' } })
    after = await readProducts()
    expect(Number(after[0].price)).toBe(160)
    expect(Number(after[0].oldPrice)).toBe(200)

    await bulk(adminToken, { ids: [productIds[0]], operation: { mode: 'disable', type: 'promotion' } })
    after = await readProducts()
    expect(Number(after[0].price)).toBe(200)
    expect(after[0].oldPrice).toBeFalsy()
  })

  // ------------------------------------------------------------ statut

  it('applique publié / brouillon / archivé', async () => {
    for (const [value, expected] of [
      ['draft', { discontinued: false, isPublished: false }],
      ['archived', { discontinued: true, isPublished: false }],
      ['published', { discontinued: false, isPublished: true }],
    ] as const) {
      const res = await bulk(adminToken, { ids: productIds, operation: { type: 'status', value } })
      expect(res.status).toBe(200)
      const after = await readProducts()
      after.forEach((p) => {
        expect(p.isPublished).toBe(expected.isPublished)
        expect(p.discontinued).toBe(expected.discontinued)
      })
    }
  })

  it('refuse un statut inconnu et une catégorie inconnue', async () => {
    expect((await bulk(adminToken, { ids: productIds, operation: { type: 'status', value: 'zzz' } })).status).toBe(400)
    expect((await bulk(adminToken, { ids: productIds, operation: { type: 'category', value: 'Zzz' } })).status).toBe(400)
  })

  it('change la catégorie et la vitrine', async () => {
    await bulk(adminToken, { ids: productIds, operation: { type: 'category', value: 'Hygiène' } })
    let after = await readProducts()
    after.forEach((p) => expect(p.category).toBe('Hygiène'))

    await bulk(adminToken, { ids: productIds, operation: { type: 'featured', value: true } })
    after = await readProducts()
    after.forEach((p) => expect(p.featured).toBe(true))
  })

  // ------------------------------------------------------- concurrence

  it('rejette en 409 si un produit a changé depuis l’affichage', async () => {
    // The operator's page was rendered a minute ago; the row has been touched
    // since by someone else.
    const staleSeenAt = new Date(Date.now() - 60_000).toISOString()
    await payload.db.pool.query('UPDATE products SET updated_at = now() WHERE id = $1', [productIds[0]])

    const res = await bulk(adminToken, {
      ids: productIds,
      operation: { mode: 'increase', type: 'stock', value: 5 },
      seenAt: staleSeenAt,
    })

    expect(res.status).toBe(409)
    expect(res.data.conflicts?.length).toBeGreaterThan(0)
  })

  it('applique l’opération quand seenAt est à jour', async () => {
    const before = await readProducts()
    const res = await bulk(adminToken, {
      ids: productIds,
      operation: { mode: 'increase', type: 'stock', value: 5 },
      seenAt: new Date(Date.now() + 5_000).toISOString(),
    })
    expect(res.status).toBe(200)
    const after = await readProducts()
    after.forEach((p, i) => expect(p.stock).toBe(before[i].stock + 5))
  })

  it('un échec au milieu du lot n’applique rien (transaction)', async () => {
    const before = await readProducts()

    // The last product gets a promotional price above its reference, which
    // the handler throws on — the whole batch must roll back.
    await bulk(adminToken, { ids: productIds, operation: { mode: 'set', type: 'price', value: 100 } })
    const res = await bulk(adminToken, {
      ids: productIds,
      operation: { mode: 'enable', price: 999, type: 'promotion' },
    })

    expect(res.status).toBe(500)
    const after = await readProducts()
    after.forEach((p) => expect(Number(p.price)).toBe(100))
    expect(before.length).toBe(after.length)
  })

  // ------------------------------------------------------------ garde-fous

  it('refuse une sélection vide ou trop grande', async () => {
    expect((await bulk(adminToken, { ids: [], operation: { type: 'featured', value: true } })).status).toBe(400)

    const tooMany = Array.from({ length: 501 }, (_, i) => i + 1)
    expect((await bulk(adminToken, { ids: tooMany, operation: { type: 'featured', value: true } })).status).toBe(400)
  })

  it('signale les produits introuvables sans échouer', async () => {
    const res = await bulk(adminToken, {
      ids: [...productIds, 999_999],
      operation: { type: 'featured', value: false },
    })
    expect(res.status).toBe(200)
    expect(res.data.missing).toBe(1)
  })
})
