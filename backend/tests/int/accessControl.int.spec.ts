// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { AUDIT_USERS, cleanupAuditUsers, loginAs, seedAuditUsers } from '../helpers/auditUsers'

/**
 * The role matrix, checked against real sessions.
 *
 * Access rules are the kind of thing that reads correctly and behaves
 * otherwise: `Products.access.read` returns a `Where` clause rather than a
 * boolean, `Products.stock` is gated at field level while the collection
 * itself is writable by more roles, and several routes check roles by hand
 * rather than through Payload. None of that can be verified by inspection.
 *
 * So every case here logs in over HTTP as a real user and calls the real
 * endpoint. The most important row is the first one: `orders.create` was
 * `() => true`, which meant anyone on the internet could POST a finished
 * order — any total, any payment status, no stock decremented — and the
 * checkout was merely the polite way in.
 */

vi.setConfig({ hookTimeout: 120_000, testTimeout: 120_000 })

const BASE = process.env.TEST_CMS_URL || 'http://localhost:3001'

type Role = keyof typeof AUDIT_USERS
const ROLES: Role[] = ['admin', 'manager', 'editor', 'stockManager', 'customer']

let payload: Payload
const tokens: Partial<Record<Role | 'anon', string | null>> = { anon: null }

/** How many levels of objects the response actually contains. A `depth`
 * that was honoured produces a deeper tree; a clamped one does not. */
function nestingDepth(value: unknown): number {
  if (value === null || typeof value !== 'object') return 0
  const children = Object.values(value as Record<string, unknown>).map(nestingDepth)
  return 1 + (children.length ? Math.max(...children) : 0)
}

function headers(role: Role | 'anon'): Record<string, string> {
  const token = tokens[role]
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}) }
}

const FORGED_ORDER = JSON.stringify({
  customerEmail: 'pirate@example.test',
  customerName: 'Pirate',
  items: [{ name: 'Article gratuit', price: 0, quantity: 1 }],
  // The point of the attack: a delivered, paid order for nothing.
  paymentStatus: 'paid',
  status: 'delivered',
  subtotal: 0,
  total: 0,
})

beforeAll(async () => {
  payload = await getPayload({ config })
  await seedAuditUsers(payload)
  for (const role of ROLES) tokens[role] = await loginAs(BASE, role)
})

afterAll(async () => {
  await cleanupAuditUsers(payload)
})

describe('orders are not publicly creatable', () => {
  it('refuses an anonymous POST /api/orders', async () => {
    const res = await fetch(`${BASE}/api/orders`, { body: FORGED_ORDER, headers: headers('anon'), method: 'POST' })
    expect(res.status).toBe(403)
  })

  it.each(['editor', 'stockManager', 'customer'] as Role[])('refuses a forged order from %s', async (role) => {
    const res = await fetch(`${BASE}/api/orders`, { body: FORGED_ORDER, headers: headers(role), method: 'POST' })
    expect(res.status).toBe(403)
  })

  it('still lets the back office create one, for a phone sale', async () => {
    // The fix must not cost the shop a real capability: admin/manager/sales
    // create orders by hand in the admin UI.
    const res = await fetch(`${BASE}/api/orders`, { body: FORGED_ORDER, headers: headers('admin'), method: 'POST' })
    expect(res.status).toBe(201)
    const { doc } = await res.json()
    await payload.delete({ collection: 'order-status-history', where: { order: { equals: doc.id } } }).catch(() => {})
    await payload.delete({ collection: 'orders', id: doc.id }).catch(() => {})
  })

  it('never lets anyone but staff read orders', async () => {
    for (const who of ['anon', 'customer'] as (Role | 'anon')[]) {
      const res = await fetch(`${BASE}/api/orders?limit=1`, { headers: headers(who) })
      expect(res.status).toBe(403)
    }
  })
})

describe('products are public but only what is on sale', () => {
  it('shows anonymous callers strictly fewer products than staff', async () => {
    const anon = await (await fetch(`${BASE}/api/products?limit=1`, { headers: headers('anon') })).json()
    const staff = await (await fetch(`${BASE}/api/products?limit=1`, { headers: headers('admin') })).json()

    console.log(`produits visibles: anonyme ${anon.totalDocs}, staff ${staff.totalDocs}`)

    expect(anon.totalDocs).toBeGreaterThan(0)
    expect(staff.totalDocs).toBeGreaterThan(anon.totalDocs)
  })

  it('hides back-office fields from the public payload', async () => {
    const { docs } = await (await fetch(`${BASE}/api/products?limit=1&depth=0`, { headers: headers('anon') })).json()
    expect(docs[0]).not.toHaveProperty('barcode')
    expect(docs[0]).not.toHaveProperty('reservedStock')
    // Still public: the catalogue prints availability from it.
    expect(docs[0]).toHaveProperty('stock')
  })

  it('caps limit and depth for anonymous callers', async () => {
    // `limit=0` means "unbounded" in Payload — the whole catalogue in one
    // response — and depth=10 fans out ten levels of joins per row.
    const unbounded = await (await fetch(`${BASE}/api/products?limit=0`, { headers: headers('anon') })).json()
    expect(unbounded.limit).toBeLessThanOrEqual(100)

    // Compared by nesting depth rather than byte-for-byte: other suites edit
    // products concurrently, so two responses fetched a moment apart can
    // legitimately differ in a price while still proving the clamp.
    const [deep, shallow] = await Promise.all([
      fetch(`${BASE}/api/products?limit=1&depth=10`, { headers: headers('anon') }).then((r) => r.json()),
      fetch(`${BASE}/api/products?limit=1&depth=2`, { headers: headers('anon') }).then((r) => r.json()),
    ])
    expect(nestingDepth(deep.docs[0])).toBe(nestingDepth(shallow.docs[0]))
  })
})

describe('bulk and import endpoints check the role, not just the session', () => {
  it('refuses a price change from stockManager', async () => {
    const res = await fetch(`${BASE}/api/products/bulk`, {
      body: JSON.stringify({ ids: [1], operation: { mode: 'decrease', type: 'price', value: 5 } }),
      headers: headers('stockManager'),
      method: 'POST',
    })
    expect(res.status).toBe(403)
  })

  it.each(['customer', 'editor'] as Role[])('refuses the legacy importer to %s', async (role) => {
    // /api/import-products checked only `if (!user)`, so any signed-in
    // account — the `customer` role included — could create and overwrite
    // products in bulk.
    const res = await fetch(`${BASE}/api/import-products`, {
      body: new FormData(),
      headers: tokens[role] ? { Authorization: `JWT ${tokens[role]}` } : {},
      method: 'POST',
    })
    expect(res.status).toBe(401)
  })

  it.each(['admin', 'manager', 'stockManager'] as Role[])('lets %s past the role check', async (role) => {
    const res = await fetch(`${BASE}/api/import-products`, {
      body: new FormData(),
      headers: { Authorization: `JWT ${tokens[role]}` },
      method: 'POST',
    })
    // 400 "Aucun fichier reçu" — past authorisation, stopped by validation,
    // which is exactly the boundary being asserted.
    expect(res.status).toBe(400)
  })
})

describe('commercial and private data stay closed', () => {
  it('never exposes coupons publicly', async () => {
    for (const who of ['anon', 'customer'] as (Role | 'anon')[]) {
      const res = await fetch(`${BASE}/api/coupons?limit=1`, { headers: headers(who) })
      expect(res.status).toBe(403)
    }
  })

  it('shows a non-admin only their own user record', async () => {
    const res = await fetch(`${BASE}/api/users?limit=100`, { headers: headers('customer') })
    expect(res.status).toBe(200)
    const { docs } = await res.json()
    expect(docs).toHaveLength(1)
    expect(docs[0].email).toBe(AUDIT_USERS.customer.email)
  })

  it('refuses a self-granted role change', async () => {
    const me = await (await fetch(`${BASE}/api/users/me`, { headers: headers('customer') })).json()
    const res = await fetch(`${BASE}/api/users/${me.user.id}`, {
      body: JSON.stringify({ roles: ['admin'] }),
      headers: headers('customer'),
      method: 'PATCH',
    })

    // Payload answers 200 while silently dropping a field the caller may not
    // write, so the status is not the assertion — the stored role is.
    const after = await (await fetch(`${BASE}/api/users/me`, { headers: headers('customer') })).json()
    expect(after.user.roles).toEqual(['customer'])
    expect(res.status).toBeLessThan(500)
  })

  it('refuses jobs/tick without the shared secret', async () => {
    for (const auth of [undefined, 'Bearer wrong-secret']) {
      const res = await fetch(`${BASE}/api/jobs/tick`, {
        headers: auth ? { Authorization: auth } : {},
        method: 'POST',
      })
      expect(res.status).toBe(401)
    }
  })
})
