// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The checkout stock-compensation contract.
 *
 * /api/checkout commits the stock decrement in its own transaction, then
 * prices the order, then saves it. Everything after the commit is therefore
 * running with stock already taken out of the catalogue, and any failure from
 * that point has to give it back — otherwise the units are gone with no order
 * behind them and nothing to reconcile against.
 *
 * Given  stock is decremented
 * When   pricing or persistence fails before the order exists
 * Then   the stock is restored, no order is created, and the caller gets a
 *        502 rather than an exception escaping the route.
 *
 * Only the boundaries are faked: the pg pool (reached through
 * `payload.db.pool`), the Payload SDK, and the notification senders. The
 * route's own orchestration — transaction handling, the movement ledger and
 * the compensating write — is the real code under test. No database is
 * touched, which is why this lives in tests/unit rather than tests/int.
 */

type Query = { client: number; params: unknown[]; sql: string }

/** Plain call signatures rather than `ReturnType<typeof vi.fn>`: a bare `Mock`
 * is typed as callable-or-constructable, which tsc refuses to call. */
type PricingFn = (...args: unknown[]) => Promise<unknown>

const h = vi.hoisted(() => ({
  evaluateCoupon: null as unknown as PricingFn,
  payload: null as unknown as Record<string, unknown>,
  resolveShipping: null as unknown as PricingFn,
}))

vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/notifications/service', () => ({ notifyOrderEvent: async () => {} }))
vi.mock('@/lib/notifications/stock', () => ({ notifyStockChange: async () => {} }))
vi.mock('@/lib/pricing', () => ({
  evaluateCoupon: (...args: unknown[]) => h.evaluateCoupon(...args),
  resolveShipping: (...args: unknown[]) => h.resolveShipping(...args),
}))

const { POST } = await import('@/app/api/checkout/route')

type ProductRow = { name: string; price: number; stock: number }

function makeEnv(opts: {
  products: Record<number, ProductRow>
  /** Throw from the compensating UPDATE, to exercise the failure-of-recovery path. */
  compensationFails?: boolean
  /** Reject the `orders` create, to exercise persistence failure after the commit. */
  orderCreateFails?: boolean
  /** What the payment-settings global answers. Omitted means the global cannot
   * be read at all, which is the case allowedPaymentMethods falls back from. */
  paymentSettings?: Record<string, unknown>
}) {
  const queries: Query[] = []
  const created: { collection: string; data?: Record<string, unknown> }[] = []
  const loggedErrors: unknown[] = []
  let clientSeq = 0

  const answer = async (sql: string, params: unknown[], client: number) => {
    queries.push({ client, params, sql })

    if (opts.compensationFails && /stock = stock \+/.test(sql)) {
      throw new Error('compensation write failed')
    }
    if (/FROM products WHERE id/.test(sql)) {
      const id = Number(params[0])
      const row = opts.products[id]
      if (!row) return { rowCount: 0, rows: [] }
      return {
        rowCount: 1,
        rows: [
          {
            brand_id: null,
            category: 'visage',
            discontinued: false,
            has_variants: false,
            id,
            is_published: true,
            low_stock_threshold: 0,
            name: row.name,
            price: row.price,
            sku: `SKU-${id}`,
            stock: row.stock,
            variant_option_type: null,
            variant_pricing_mode: 'same-price',
          },
        ],
      }
    }
    if (/UPDATE products SET stock = stock - /.test(sql)) {
      const [qty, id] = params as [number, number]
      return { rowCount: 1, rows: [{ stock: opts.products[id].stock - qty }] }
    }
    return { rowCount: 0, rows: [] }
  }

  const pool = {
    connect: async () => {
      const id = ++clientSeq
      return { query: (sql: string, params: unknown[] = []) => answer(sql, params, id), release: () => {} }
    },
    query: (sql: string, params: unknown[] = []) => answer(sql, params, 0),
  }

  h.payload = {
    create: async ({ collection, data }: { collection: string; data?: Record<string, unknown> }) => {
      created.push({ collection, data })
      if (collection === 'orders' && opts.orderCreateFails) throw new Error('order insert failed')
      return { id: 4242 }
    },
    db: { pool },
    find: async () => ({ docs: [], totalDocs: 0 }),
    findGlobal: async () => {
      if (!opts.paymentSettings) throw new Error('payment-settings unreadable')
      return opts.paymentSettings
    },
    logger: { error: (e: unknown) => loggedErrors.push(e), info: () => {}, warn: () => {} },
  }

  return { created, loggedErrors, queries }
}

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/checkout', { body: JSON.stringify(body), method: 'POST' }))

const order = (lines: { id: number; qty: number }[], couponCode?: string) => ({
  address: '12 rue Test',
  city: 'Casablanca',
  couponCode,
  email: 'shopper@example.com',
  lines,
  name: 'Test Shopper',
  phone: '0600000000',
})

/** The compensating writes actually issued, as {productId, quantity} pairs. */
const restores = (queries: Query[]) =>
  queries
    .filter((q) => /UPDATE products SET stock = stock \+/.test(q.sql))
    .map((q) => ({ productId: q.params[1], quantity: q.params[0] }))

const decrements = (queries: Query[]) =>
  queries.filter((q) => /UPDATE products SET stock = stock - /.test(q.sql))

const ordersCreated = (created: { collection: string; data?: Record<string, unknown> }[]) => created.filter((c) => c.collection === 'orders')

beforeEach(() => {
  h.evaluateCoupon = vi.fn(async () => ({ code: 'X', couponId: 1, discount: 0, eligibleSubtotal: 0, ok: true }))
  h.resolveShipping = vi.fn(async () => ({ cost: 25, freeFrom: null, label: 'Livraison', ruleId: 1 }))
})

describe('a checkout that fails after the stock is committed', () => {
  it('restores the stock when evaluateCoupon throws', async () => {
    const env = makeEnv({ products: { 7: { name: 'Crème', price: 100, stock: 10 } } })
    h.evaluateCoupon = vi.fn(async () => {
      throw new Error('connection reset')
    })

    const res = await post(order([{ id: 7, qty: 3 }], 'PROMO'))

    // The stock was taken...
    expect(decrements(env.queries)).toHaveLength(1)
    // ...and given back, in the same quantity, for the same product.
    expect(restores(env.queries)).toEqual([{ productId: 7, quantity: 3 }])
    // No order, and no exception escaping the route.
    expect(ordersCreated(env.created)).toHaveLength(0)
    expect(res.status).toBe(502)
  })

  it('restores the stock when resolveShipping throws', async () => {
    const env = makeEnv({ products: { 7: { name: 'Crème', price: 100, stock: 10 } } })
    h.resolveShipping = vi.fn(async () => {
      throw new Error('shipping rules unavailable')
    })

    const res = await post(order([{ id: 7, qty: 2 }]))

    expect(restores(env.queries)).toEqual([{ productId: 7, quantity: 2 }])
    expect(ordersCreated(env.created)).toHaveLength(0)
    expect(res.status).toBe(502)
  })

  it('restores the stock when the order itself fails to persist', async () => {
    // The case the compensating block was originally written for.
    const env = makeEnv({ orderCreateFails: true, products: { 7: { name: 'Crème', price: 100, stock: 10 } } })

    const res = await post(order([{ id: 7, qty: 4 }]))

    expect(restores(env.queries)).toEqual([{ productId: 7, quantity: 4 }])
    expect(res.status).toBe(502)
  })

  it('restores every line of a multi-product cart, not just the first', async () => {
    const env = makeEnv({
      products: { 3: { name: 'Sérum', price: 50, stock: 10 }, 7: { name: 'Crème', price: 100, stock: 10 } },
    })
    h.resolveShipping = vi.fn(async () => {
      throw new Error('shipping rules unavailable')
    })

    await post(order([{ id: 7, qty: 2 }, { id: 3, qty: 5 }]))

    expect(restores(env.queries)).toHaveLength(2)
    expect(restores(env.queries)).toEqual(
      expect.arrayContaining([
        { productId: 7, quantity: 2 },
        { productId: 3, quantity: 5 },
      ]),
    )
  })

  it('reports the failure rather than pretending the order succeeded', async () => {
    const env = makeEnv({ products: { 7: { name: 'Crème', price: 100, stock: 10 } } })
    h.resolveShipping = vi.fn(async () => {
      throw new Error('shipping rules unavailable')
    })

    const res = await post(order([{ id: 7, qty: 1 }]))
    const body = (await res.json()) as { error?: string }

    expect(res.status).toBe(502)
    expect(body.error).toBeTruthy()
    // The discrepancy is never silent, even when the recovery worked.
    expect(env.loggedErrors.length).toBeGreaterThan(0)
  })
})

describe('when the restoration itself fails', () => {
  it('still answers the caller instead of throwing out of the route', async () => {
    // Defined behaviour: the compensating transaction rolls back and the
    // error is logged as its own event. There is nothing left to try, but the
    // request must not hang or surface an unhandled rejection.
    const env = makeEnv({ compensationFails: true, products: { 7: { name: 'Crème', price: 100, stock: 10 } } })
    h.resolveShipping = vi.fn(async () => {
      throw new Error('shipping rules unavailable')
    })

    const res = await post(order([{ id: 7, qty: 3 }]))

    expect(res.status).toBe(502)
    expect(ordersCreated(env.created)).toHaveLength(0)
    // Attempted, failed, and recorded — this is the case a human has to fix
    // by hand, so it must leave a trace.
    expect(env.loggedErrors.length).toBeGreaterThan(0)
  })
})

describe('two checkouts failing at the same time', () => {
  it('each gives back only its own stock', async () => {
    // The movement ledger is per-request state. If it were shared — a module
    // level array, say — one shopper's failure would hand back units the
    // other shopper had legitimately taken.
    const env = makeEnv({
      products: { 3: { name: 'Sérum', price: 50, stock: 100 }, 7: { name: 'Crème', price: 100, stock: 100 } },
    })
    h.resolveShipping = vi.fn(async () => {
      throw new Error('shipping rules unavailable')
    })

    const [a, b] = await Promise.all([post(order([{ id: 7, qty: 2 }])), post(order([{ id: 3, qty: 5 }]))])

    expect(a.status).toBe(502)
    expect(b.status).toBe(502)

    // Exactly two restores: 2 of product 7 and 5 of product 3. Any
    // cross-contamination shows up as a wrong quantity or a third row.
    expect(restores(env.queries)).toHaveLength(2)
    expect(restores(env.queries)).toEqual(
      expect.arrayContaining([
        { productId: 7, quantity: 2 },
        { productId: 3, quantity: 5 },
      ]),
    )
  })

  it('gives back its own quantity when both carts hold the same product', async () => {
    // Sharper than the two-product case: here a leak cannot show up as an
    // unexpected product id, only as a wrong quantity — 2 restored twice, or
    // a single row of 7 — so the quantities have to be checked exactly.
    const env = makeEnv({ products: { 7: { name: 'Crème', price: 100, stock: 100 } } })
    h.resolveShipping = vi.fn(async () => {
      throw new Error('shipping rules unavailable')
    })

    await Promise.all([post(order([{ id: 7, qty: 2 }])), post(order([{ id: 7, qty: 5 }]))])

    const given = restores(env.queries)
    expect(given).toHaveLength(2)
    expect(given.map((r) => r.quantity).sort()).toEqual([2, 5])
    expect(given.every((r) => r.productId === 7)).toBe(true)
  })
})

describe('the payment method written on the order', () => {
  const BANK = { bankName: 'CIH', beneficiary: 'Para dHiver', rib: '007780000112233445566778' }

  const place = async (body: Record<string, unknown>, paymentSettings?: Record<string, unknown>) => {
    const env = makeEnv({ paymentSettings, products: { 7: { name: 'Crème', price: 100, stock: 10 } } })
    const res = await post({ ...order([{ id: 7, qty: 1 }]), ...body })
    return { data: ordersCreated(env.created)[0]?.data as Record<string, unknown> | undefined, status: res.status }
  }

  it('defaults to the only method the shop has when none is sent', async () => {
    const { data, status } = await place({})
    expect(status).toBe(200)
    expect(data?.paymentMethod).toBe('cash_on_delivery')
  })

  it('records a method the shop actually offers', async () => {
    const settings = { bank: BANK, bankTransferEnabled: true, codEnabled: true }
    const { data, status } = await place({ paymentMethod: 'bank_transfer' }, settings)
    expect(status).toBe(200)
    expect(data?.paymentMethod).toBe('bank_transfer')
  })

  it('refuses a method the shop does not offer, and writes nothing', async () => {
    // The property that matters. A client posting `bank_transfer` while
    // transfers are switched off would otherwise place an order nobody can
    // collect payment for — and this runs before any stock is touched, so
    // refusing costs nothing.
    const settings = { bank: BANK, bankTransferEnabled: false, codEnabled: true }
    const { data, status } = await place({ paymentMethod: 'bank_transfer' }, settings)
    expect(status).toBe(400)
    expect(data).toBeUndefined()
  })

  it('never stores a label the client supplied', async () => {
    // The body carries a key from a fixed enum, never a text. Copying the
    // string through would let anyone write what they like on a line the back
    // office reads and an invoice prints.
    for (const hostile of ['Payé', 'Gratuit', '<script>alert(1)</script>', 'CASH_ON_DELIVERY', 'cash_on_delivery; DROP']) {
      const { data, status } = await place({ paymentMethod: hostile })
      expect(status).toBe(400)
      expect(data).toBeUndefined()
    }
  })

  it('tolerates surrounding whitespace on an otherwise valid key', async () => {
    // Documented rather than assumed: the resolution trims before matching, so
    // a key that arrived with a stray space is accepted rather than refused.
    // That is deliberate — it is the same key — and it is the one input in the
    // group above that must NOT be a 400.
    const { data, status } = await place({ paymentMethod: '  cash_on_delivery  ' })
    expect(status).toBe(200)
    expect(data?.paymentMethod).toBe('cash_on_delivery')
  })

  it('treats a non-string as absent instead of crashing on it', async () => {
    // `["bank_transfer"].trim` is not a function: this used to be a 500 on a
    // malformed body. A parsed JSON field is whatever the client sent, so the
    // type is checked before the string method is reached.
    for (const hostile of [{ toString: 'x' }, ['bank_transfer'], 42, null, true]) {
      const { data, status } = await place({ paymentMethod: hostile })
      expect(status).toBe(200)
      expect(data?.paymentMethod).toBe('cash_on_delivery')
    }
  })
})
