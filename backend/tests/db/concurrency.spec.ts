import type { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { STOCK_DECREMENT_SQL } from '@/lib/inventorySql'
import { createProbeDatabase, serverReachable, type ProbeDatabase } from '../support/probeDatabase'

/**
 * What PostgreSQL actually does when two shoppers collide.
 *
 * The unit suites stub the database, so they can prove the route issues the
 * right statements but not that the server serialises them correctly. Row
 * locks and the `AND stock >= $1` guard are the whole oversell protection, and
 * neither can be verified without a real server — so these tests run the exact
 * statements from src/app/api/checkout/route.ts against a throwaway database.
 *
 * Invariants under test:
 *   stock >= 0 always, and never more units sold than existed.
 *
 * The coupon race is documented rather than asserted as "correct": the route
 * says in a comment that usageLimit is deliberately a soft limit. These tests
 * pin what that actually means, and show what a hard limit would cost.
 */

let db: ProbeDatabase | null = null
let admin: Client | null = null

const reachable = await serverReachable()

beforeAll(async () => {
  if (!reachable) return
  db = await createProbeDatabase('para_conc_probe')
  admin = await db.connect()

  await admin.query(`
    CREATE TABLE products (
      id serial PRIMARY KEY,
      name varchar NOT NULL,
      stock numeric NOT NULL DEFAULT 0,
      updated_at timestamp(3) with time zone DEFAULT now()
    );
    CREATE TABLE coupons (
      id serial PRIMARY KEY,
      code varchar NOT NULL,
      usage_limit numeric,
      usage_count numeric DEFAULT 0,
      updated_at timestamp(3) with time zone DEFAULT now()
    );
  `)
}, 60_000)

afterAll(async () => {
  await admin?.end().catch(() => {})
  if (reachable && db) await db.drop()
}, 60_000)

/** Resets a single product to a known stock level. */
async function setStock(stock: number): Promise<number> {
  const { rows } = await admin!.query(
    `INSERT INTO products (name, stock) VALUES ('Crème', $1) RETURNING id`,
    [stock],
  )
  return rows[0].id as number
}

type Outcome = 'sold' | 'rejected'

/**
 * One checkout's stock transaction, mirroring src/app/api/checkout/route.ts and
 * issuing its actual decrement statement (imported, not retyped).
 *
 * `guarded` and `locked` exist to isolate the two controls. They turn out to be
 * defence in depth rather than one mechanism: with `FOR UPDATE` the route's own
 * JS pre-check runs under the row lock and already serialises, and with the
 * `AND stock >= $1` guard the UPDATE re-checks under its own lock. Either alone
 * prevents the oversell here; removing both does not.
 */
async function buy(
  client: Client,
  productId: number,
  qty: number,
  opts: { guarded?: boolean; locked?: boolean } = {},
): Promise<Outcome> {
  const { guarded = true, locked = true } = opts
  try {
    await client.query('BEGIN')

    const found = await client.query(
      `SELECT id, stock FROM products WHERE id = $1${locked ? ' FOR UPDATE' : ''}`,
      [productId],
    )
    // The route's own pre-check, in JS, before the guarded UPDATE.
    if (Number(found.rows[0].stock) < qty) {
      await client.query('ROLLBACK')
      return 'rejected'
    }

    // The real statement, imported rather than retyped: if someone edits the
    // guard out of src/lib/inventorySql.ts, these races start failing.
    const sql = guarded ? STOCK_DECREMENT_SQL : STOCK_DECREMENT_SQL.replace(' AND stock >= $1', '')
    const decremented = await client.query(sql, [qty, productId])
    if (decremented.rowCount === 0) {
      await client.query('ROLLBACK')
      return 'rejected'
    }

    await client.query('COMMIT')
    return 'sold'
  } catch {
    await client.query('ROLLBACK').catch(() => {})
    return 'rejected'
  }
}

const stockOf = async (id: number) =>
  Number((await admin!.query(`SELECT stock FROM products WHERE id = $1`, [id])).rows[0].stock)

describe.skipIf(!reachable)('two shoppers, one unit left', () => {
  it('sells it exactly once and never drives stock negative', async () => {
    const id = await setStock(1)
    const [a, b] = await Promise.all([db!.connect(), db!.connect()])

    const outcomes = await Promise.all([buy(a, id, 1), buy(b, id, 1)])
    await Promise.all([a.end(), b.end()])

    expect(outcomes.filter((o) => o === 'sold')).toHaveLength(1)
    expect(outcomes.filter((o) => o === 'rejected')).toHaveLength(1)
    expect(await stockOf(id)).toBe(0)
  })

  it('holds when ten shoppers race for three units', async () => {
    const id = await setStock(3)
    const clients = await Promise.all(Array.from({ length: 10 }, () => db!.connect()))

    const outcomes = await Promise.all(clients.map((c) => buy(c, id, 1)))
    await Promise.all(clients.map((c) => c.end()))

    // Exactly the units that existed, no more and no fewer.
    expect(outcomes.filter((o) => o === 'sold')).toHaveLength(3)
    expect(await stockOf(id)).toBe(0)
  })

  it('never oversells a multi-unit line either', async () => {
    const id = await setStock(5)
    const clients = await Promise.all(Array.from({ length: 4 }, () => db!.connect()))

    // Four shoppers each want 2 of the 5 available: two can be served.
    const outcomes = await Promise.all(clients.map((c) => buy(c, id, 2)))
    await Promise.all(clients.map((c) => c.end()))

    expect(outcomes.filter((o) => o === 'sold')).toHaveLength(2)
    expect(await stockOf(id)).toBe(1)
    expect(await stockOf(id)).toBeGreaterThanOrEqual(0)
  })
})

describe.skipIf(!reachable)('which control actually prevents the oversell', () => {
  it('the guarded UPDATE alone is sufficient, even without FOR UPDATE', async () => {
    // `WHERE ... AND stock >= $1` takes its own row lock and re-checks under
    // it, so the SELECT ... FOR UPDATE is about lock *ordering* (deadlock
    // avoidance across multi-product carts), not about oversell protection.
    const id = await setStock(1)
    const clients = await Promise.all(Array.from({ length: 5 }, () => db!.connect()))

    const outcomes = await Promise.all(clients.map((c) => buy(c, id, 1, { locked: false })))
    await Promise.all(clients.map((c) => c.end()))

    expect(outcomes.filter((o) => o === 'sold')).toHaveLength(1)
    expect(await stockOf(id)).toBe(0)
  })

  it('without the guard, a read-then-write oversells and goes negative', async () => {
    // Deterministic interleaving of the read-modify-write the guard replaced,
    // so the failure is demonstrated rather than raced for. This is the bug the
    // `AND stock >= $1` clause exists to prevent; if this test ever stops
    // failing to oversell, the guard has stopped being what protects us.
    const id = await setStock(1)
    const [a, b] = await Promise.all([db!.connect(), db!.connect()])

    await a.query('BEGIN')
    await b.query('BEGIN')
    // Both read the same "1 available" before either writes.
    const readA = await a.query(`SELECT stock FROM products WHERE id = $1`, [id])
    const readB = await b.query(`SELECT stock FROM products WHERE id = $1`, [id])
    expect(Number(readA.rows[0].stock)).toBe(1)
    expect(Number(readB.rows[0].stock)).toBe(1)

    await a.query(`UPDATE products SET stock = stock - 1 WHERE id = $1`, [id])
    await a.query('COMMIT')
    await b.query(`UPDATE products SET stock = stock - 1 WHERE id = $1`, [id])
    await b.query('COMMIT')
    await Promise.all([a.end(), b.end()])

    // Two units sold from a stock of one.
    expect(await stockOf(id)).toBe(-1)
  })

  it('a CHECK constraint would stop it at the database, which today none does', async () => {
    // The application schema has no CHECK constraints at all — verified across
    // all 105 tables. Nothing but application SQL keeps stock non-negative.
    // This shows what the database would do if asked to hold the invariant
    // itself, and is the argument for adding one.
    //
    // Its own table on purpose: the oversell test above deliberately leaves a
    // stock of -1 behind, and a test that only passes when its neighbours have
    // not run yet is worse than no test.
    await admin!.query(`
      CREATE TABLE probe_constrained (id serial PRIMARY KEY, stock numeric NOT NULL DEFAULT 0);
      INSERT INTO probe_constrained (stock) VALUES (0);
      ALTER TABLE probe_constrained ADD CONSTRAINT probe_stock_non_negative CHECK (stock >= 0);
    `)

    await expect(admin!.query(`UPDATE probe_constrained SET stock = stock - 1`)).rejects.toThrow(
      /probe_stock_non_negative/,
    )

    // And it refuses the unguarded read-then-write that oversold above.
    const survived = await admin!.query(`SELECT stock FROM probe_constrained`)
    expect(Number(survived.rows[0].stock)).toBe(0)

    await admin!.query(`DROP TABLE probe_constrained`)
  })
})

describe.skipIf(!reachable)('two shoppers, one coupon use left', () => {
  const newCoupon = async (usageLimit: number | null) => {
    const { rows } = await admin!.query(
      `INSERT INTO coupons (code, usage_limit, usage_count) VALUES ('WELCOME10', $1, 0) RETURNING id`,
      [usageLimit],
    )
    return rows[0].id as number
  }

  const usageOf = async (id: number) =>
    Number((await admin!.query(`SELECT usage_count FROM coupons WHERE id = $1`, [id])).rows[0].usage_count)

  /** evaluateCoupon's limit check, then the route's unconditional increment. */
  async function redeemAsRouteDoes(client: Client, couponId: number): Promise<Outcome> {
    const { rows } = await client.query(`SELECT usage_limit, usage_count FROM coupons WHERE id = $1`, [couponId])
    const limit = rows[0].usage_limit === null ? null : Number(rows[0].usage_limit)
    if (limit !== null && Number(rows[0].usage_count ?? 0) >= limit) return 'rejected'

    await client.query(
      `UPDATE coupons SET usage_count = COALESCE(usage_count, 0) + 1, updated_at = now() WHERE id = $1`,
      [couponId],
    )
    return 'sold'
  }

  it('lets both through — usageLimit is a soft limit, as documented', async () => {
    // Not a bug report: src/app/api/checkout/route.ts states this deliberately
    // ("two checkouts racing on the last available use can both pass the
    // earlier evaluateCoupon check and land at limit + 1"), on the grounds that
    // a promo going one order over beats a counter that disagrees with the
    // redemption ledger. This test makes that decision visible and will fail if
    // someone tightens it without meaning to.
    const id = await newCoupon(1)
    const [a, b] = await Promise.all([db!.connect(), db!.connect()])

    const outcomes = await Promise.all([redeemAsRouteDoes(a, id), redeemAsRouteDoes(b, id)])
    await Promise.all([a.end(), b.end()])

    expect(outcomes.filter((o) => o === 'sold')).toHaveLength(2)
    expect(await usageOf(id)).toBe(2) // limit + 1
  })

  it('still counts every redemption exactly once, which is the property that is guaranteed', async () => {
    // The increment is `usage_count + 1` in SQL rather than a read-modify-write,
    // so the counter never drifts from the number of real redemptions even
    // though it can exceed the limit.
    const id = await newCoupon(null)
    const clients = await Promise.all(Array.from({ length: 20 }, () => db!.connect()))

    await Promise.all(clients.map((c) => redeemAsRouteDoes(c, id)))
    await Promise.all(clients.map((c) => c.end()))

    expect(await usageOf(id)).toBe(20)
  })

  it('a guarded UPDATE would make it a hard limit, at the cost of the check moving into SQL', async () => {
    // The remedy, tested so the option is concrete rather than theoretical:
    // moving the limit into the UPDATE's WHERE clause makes exactly one
    // redemption win under the same race. Offered, not applied — turning a
    // documented soft limit into a hard one is a business decision.
    const id = await newCoupon(1)
    const clients = await Promise.all(Array.from({ length: 5 }, () => db!.connect()))

    const outcomes = await Promise.all(
      clients.map(async (c) => {
        const res = await c.query(
          `UPDATE coupons SET usage_count = COALESCE(usage_count, 0) + 1, updated_at = now()
            WHERE id = $1 AND (usage_limit IS NULL OR COALESCE(usage_count, 0) < usage_limit)`,
          [id],
        )
        return res.rowCount === 1 ? 'sold' : 'rejected'
      }),
    )
    await Promise.all(clients.map((c) => c.end()))

    expect(outcomes.filter((o) => o === 'sold')).toHaveLength(1)
    expect(await usageOf(id)).toBe(1)
  })
})
