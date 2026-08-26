/**
 * Measures the queries this audit touched, before and after the indexes in
 * migration 20260826_100000_production_indexes.
 *
 * Runs each query on the benchmark database with only Payload's generated
 * indexes present, then adds the new ones and runs it again — same data, same
 * connection, same planner settings. The difference is attributable to the
 * migration and nothing else.
 *
 * Usage:
 *   node tests/load/seedBench.mjs 10000 5000
 *   node tests/load/explainBench.mjs
 */
import { buildBench, BENCH_URI, NEW_INDEXES } from './seedBench.mjs'
import { Client } from 'pg'

const PRODUCTS = Number(process.argv[2] || 10_000)
const ORDERS = Number(process.argv[3] || 5_000)

/** The real shapes, transcribed from the code that issues them. */
const QUERIES = [
  {
    name: 'catalogue page 1 (sellable, newest)',
    source: 'frontend/lib/storefront/catalogue.ts + Products.access.read',
    sql: `SELECT id, name, price, category, stock FROM products
           WHERE is_published = true AND discontinued IS NOT TRUE
           ORDER BY created_at DESC LIMIT 24`,
  },
  {
    name: 'catalogue filtered by category, price asc',
    source: '/catalogue?cat=Visage&sort=price-asc',
    sql: `SELECT id, name, price FROM products
           WHERE is_published = true AND discontinued IS NOT TRUE AND category = 'Visage'
           ORDER BY price ASC LIMIT 24`,
  },
  {
    name: 'catalogue facet counts by category',
    source: 'CatalogueFacets.categories',
    sql: `SELECT category, count(*) FROM products
           WHERE is_published = true AND discontinued IS NOT TRUE
           GROUP BY category`,
  },
  {
    name: 'variant SKU uniqueness check (no clash)',
    // The *miss* is the hot path, and the expensive one: every product save
    // checks each of its variant SKUs, and almost every check finds nothing,
    // which means scanning every variant row in the catalogue. Probing a SKU
    // that exists would stop at the first match and flatter the baseline.
    source: 'collections/Products.ts assertVariantIdentifiersUnique',
    sql: `SELECT 1 FROM products_variants WHERE sku = 'SKU-DOES-NOT-EXIST' LIMIT 1`,
  },
  {
    name: 'best-selling aggregate',
    source: '/api/homepage/best-selling',
    sql: `SELECT oi.product_id, SUM(oi.quantity) q
            FROM orders_items oi JOIN orders o ON o.id = oi._parent_id
           WHERE o.status NOT IN ('cancelled','refunded')
           GROUP BY oi.product_id ORDER BY q DESC LIMIT 20`,
  },
  {
    name: 'dashboard order list by status',
    source: '/dashboard/orders?status=pending',
    sql: `SELECT id, order_number, total FROM orders
           WHERE status = 'pending' ORDER BY created_at DESC LIMIT 25`,
  },
  {
    name: 'order lookup by customer email',
    source: '/api/orders/track + dashboard customers',
    sql: `SELECT id, order_number FROM orders WHERE customer_email = 'client700@example.test'`,
  },
]

/** Median of several runs: the first execution of a query pays for cold cache
 * and plan setup, and reporting that as "the" number overstates both sides. */
async function timeQuery(client, sql, runs = 7) {
  const times = []
  let plan = ''
  for (let i = 0; i < runs; i++) {
    const res = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`)
    const root = res.rows[0]['QUERY PLAN'][0]
    times.push(root['Execution Time'])
    if (i === 0) plan = summarise(root.Plan)
  }
  times.sort((a, b) => a - b)
  return { ms: times[Math.floor(times.length / 2)], plan }
}

/** The one line that matters: which access method the planner chose, and how
 * many rows it had to touch to answer. */
function summarise(node) {
  const parts = []
  const walk = (n) => {
    if (/Seq Scan|Index Scan|Index Only Scan|Bitmap Heap Scan/.test(n['Node Type'])) {
      parts.push(`${n['Node Type']} on ${n['Relation Name']}${n['Index Name'] ? ` (${n['Index Name']})` : ''}`)
    }
    ;(n.Plans || []).forEach(walk)
  }
  walk(node)
  return parts.join(' + ') || node['Node Type']
}

console.log(`Building benchmark database: ${PRODUCTS} products, ${ORDERS} orders...`)
const seeded = await buildBench(PRODUCTS, ORDERS)
await seeded.end()

const c = new Client({ connectionString: BENCH_URI })
await c.connect()

const before = {}
for (const q of QUERIES) before[q.name] = await timeQuery(c, q.sql)

await c.query(NEW_INDEXES)
await c.query('ANALYZE')

const after = {}
for (const q of QUERIES) after[q.name] = await timeQuery(c, q.sql)

console.log(`\n=== ${PRODUCTS} produits / ${ORDERS} commandes ===\n`)
for (const q of QUERIES) {
  const b = before[q.name]
  const a = after[q.name]
  const factor = b.ms / a.ms
  console.log(`${q.name}`)
  console.log(`  source : ${q.source}`)
  console.log(`  avant  : ${b.ms.toFixed(2)} ms  — ${b.plan}`)
  console.log(`  après  : ${a.ms.toFixed(2)} ms  — ${a.plan}`)
  console.log(`  gain   : ${factor >= 1 ? `x${factor.toFixed(1)}` : `AUCUN (x${factor.toFixed(2)})`}\n`)
}

await c.end()
