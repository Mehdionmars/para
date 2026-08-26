/**
 * Builds a benchmark copy of the products/orders tables at production scale.
 *
 * The dev database has 250 products and 18 orders, which is far too small to
 * tell anything: Postgres picks a sequential scan for a 250-row table no
 * matter what indexes exist, so "is this query indexed?" is unanswerable
 * there. This creates a throwaway database with the same columns and the same
 * indexes, filled to the sizes the brief asks about (10k / 100k products,
 * thousands of orders), so EXPLAIN reports what production would actually do.
 *
 * It never touches para_dhiver. Usage:
 *   node tests/load/seedBench.mjs [productCount] [orderCount]
 */
import { Client } from 'pg'

const ADMIN_URI = process.env.BENCH_ADMIN_URI || 'postgresql://postgres:postgres@127.0.0.1:5433/postgres'
const BENCH_DB = process.env.BENCH_DB || 'para_dhiver_bench'
export const BENCH_URI = ADMIN_URI.replace(/\/[^/]+$/, `/${BENCH_DB}`)

const CATEGORIES = [
  'Visage',
  'Corps',
  'Cheveux',
  'Solaire',
  'Baby & Mom',
  'Maquillage',
  'Bucco-Dentaire',
  'Compléments alimentaires',
  'Hygiène',
]
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']

/** Exactly the indexes migration 20260826_100000_production_indexes adds, so
 * the before/after comparison measures that migration and nothing else. */
export const NEW_INDEXES = `
  CREATE INDEX IF NOT EXISTS products_sellable_idx ON products (category, price)
    WHERE is_published = true AND discontinued IS NOT TRUE;
  CREATE INDEX IF NOT EXISTS products_sellable_created_idx ON products (created_at DESC)
    WHERE is_published = true AND discontinued IS NOT TRUE;
  CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
  CREATE INDEX IF NOT EXISTS products_variants_sku_idx ON products_variants (sku) WHERE sku IS NOT NULL;
  CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
  CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);
  CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders (status, created_at DESC);
`

async function recreateDatabase() {
  const admin = new Client({ connectionString: ADMIN_URI })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS "${BENCH_DB}" WITH (FORCE)`)
  await admin.query(`CREATE DATABASE "${BENCH_DB}"`)
  await admin.end()
}

/** Same columns and types as the real tables, minus the parts irrelevant to
 * the queries under test (media joins, rich text). Getting the *types* right
 * matters — `numeric` vs `integer` changes plan choices. */
async function createSchema(c) {
  await c.query(`
    CREATE TABLE brands (id serial PRIMARY KEY, name varchar, slug varchar);
    CREATE TABLE products (
      id serial PRIMARY KEY,
      name varchar, slug varchar, brand_id integer REFERENCES brands(id),
      category varchar, price numeric, old_price numeric,
      rating numeric, reviews numeric, sku varchar, barcode varchar,
      stock numeric, reserved_stock numeric, low_stock_threshold numeric,
      is_published boolean, featured boolean, discontinued boolean,
      has_variants boolean, is_low_stock boolean,
      updated_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now()
    );
    CREATE TABLE products_variants (
      _order integer, _parent_id integer REFERENCES products(id) ON DELETE CASCADE,
      id varchar PRIMARY KEY, option_value varchar, sku varchar, barcode varchar,
      price numeric, stock numeric, active boolean
    );
    CREATE TABLE orders (
      id serial PRIMARY KEY, order_number varchar UNIQUE, customer_name varchar,
      customer_email varchar, status text, payment_status varchar,
      subtotal numeric, shipping numeric, total numeric, discount numeric,
      updated_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now()
    );
    CREATE TABLE orders_items (
      _order integer, _parent_id integer REFERENCES orders(id) ON DELETE CASCADE,
      id varchar PRIMARY KEY, product_id integer, name varchar,
      price numeric, quantity numeric, variant_id varchar, sku varchar
    );
  `)
}

/** What Payload's generated migrations already create — the baseline this
 * audit found in production. */
async function createBaselineIndexes(c) {
  await c.query(`
    CREATE INDEX products_brand_idx ON products (brand_id);
    CREATE INDEX products_created_at_idx ON products (created_at);
    CREATE INDEX products_updated_at_idx ON products (updated_at);
    CREATE UNIQUE INDEX products_sku_idx ON products (sku);
    CREATE UNIQUE INDEX products_slug_idx ON products (slug);
    CREATE INDEX products_variants_parent_id_idx ON products_variants (_parent_id);
    CREATE INDEX orders_created_at_idx ON orders (created_at);
    CREATE INDEX orders_items_parent_id_idx ON orders_items (_parent_id);
    CREATE INDEX orders_items_product_idx ON orders_items (product_id);
  `)
}

async function seed(c, productCount, orderCount) {
  await c.query(`
    INSERT INTO brands (name, slug)
    SELECT 'Marque ' || g, 'marque-' || g FROM generate_series(1, 60) g;
  `)

  // generate_series server-side: 100k rows sent one INSERT at a time would
  // dominate the runtime and measure the network, not the database.
  await c.query(
    `
    INSERT INTO products (
      name, slug, brand_id, category, price, old_price, rating, reviews,
      sku, barcode, stock, reserved_stock, low_stock_threshold,
      is_published, featured, discontinued, has_variants, is_low_stock, created_at
    )
    SELECT
      'Produit ' || g,
      'produit-' || g,
      1 + (g % 60),
      ($2::text[])[1 + (g % array_length($2::text[], 1))],
      ROUND((10 + (g % 490))::numeric, 2),
      CASE WHEN g % 7 = 0 THEN ROUND((20 + (g % 500))::numeric, 2) END,
      1 + (g % 5), g % 300,
      'SKU-' || g, 'EAN-' || g,
      (g % 40), 0, 5,
      -- Mirrors the real catalogue's shape: most rows sellable, a slice of
      -- drafts and archived products the public read filter excludes.
      (g % 10) <> 0,
      (g % 25) = 0,
      (g % 50) = 0,
      false,
      (g % 40) BETWEEN 1 AND 5,
      now() - (g || ' minutes')::interval
    FROM generate_series(1, $1::int) g;
  `,
    [productCount, CATEGORIES],
  )

  // One variant row per 10 products, enough for the uniqueness-check plan.
  await c.query(`
    INSERT INTO products_variants (_order, _parent_id, id, option_value, sku, price, stock, active)
    SELECT 1, p.id, p.id || '-v1', '100 ml', 'SKU-' || p.id || '-V1', p.price, 10, true
    FROM products p WHERE p.id % 10 = 0;
  `)

  await c.query(
    `
    INSERT INTO orders (order_number, customer_name, customer_email, status, payment_status,
                        subtotal, shipping, total, discount, created_at)
    SELECT
      'PDH-BENCH-' || g, 'Client ' || g, 'client' || (g % 1200) || '@example.test',
      ($2::text[])[1 + (g % array_length($2::text[], 1))],
      'pending',
      ROUND((50 + (g % 900))::numeric, 2), 30, ROUND((80 + (g % 900))::numeric, 2), 0,
      now() - (g || ' minutes')::interval
    FROM generate_series(1, $1::int) g;
  `,
    [orderCount, STATUSES],
  )

  // ~3 lines per order, the shape best-selling aggregates over.
  await c.query(
    `
    INSERT INTO orders_items (_order, _parent_id, id, product_id, name, price, quantity)
    SELECT
      l, o.id, o.id || '-' || l,
      1 + ((o.id * 7 + l) % $1::int),
      'Ligne', 100, 1 + (l % 3)
    FROM orders o CROSS JOIN generate_series(1, 3) l;
  `,
    [productCount],
  )

  await c.query('ANALYZE')
}

export async function buildBench(productCount, orderCount) {
  await recreateDatabase()
  const c = new Client({ connectionString: BENCH_URI })
  await c.connect()
  await createSchema(c)
  await createBaselineIndexes(c)
  await seed(c, productCount, orderCount)
  return c
}

// Only when run directly, so explainBench.mjs can import buildBench.
if (import.meta.url === `file:///${process.argv[1].split('\\').join('/')}`) {
  const products = Number(process.argv[2] || 10_000)
  const orders = Number(process.argv[3] || 5_000)
  console.time('schema+seed')
  const c = await buildBench(products, orders)
  console.timeEnd('schema+seed')
  const counts = await c.query(
    'SELECT (SELECT count(*) FROM products)::int p, (SELECT count(*) FROM orders)::int o, (SELECT count(*) FROM orders_items)::int i',
  )
  const { p, o, i } = counts.rows[0]
  console.log(`${BENCH_DB}: ${p} products, ${o} orders, ${i} order lines`)
  await c.end()
}
