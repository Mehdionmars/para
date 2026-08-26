import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The indexes the real query paths need, and only those.
 *
 * Payload generates an index per relationship and per timestamp, which covers
 * the admin UI well and the storefront barely: the filters the catalogue and
 * the back office actually apply were sequential scans. At 250 products that
 * is invisible; the point of this migration is the size the catalogue is
 * heading for.
 *
 * Every index here was measured before being kept, on a benchmark database
 * built to production scale (`tests/load/explainBench.mjs`). Nine candidates
 * were written; five were deleted again because the planner ignored them or
 * the gain was inside the noise. An index is not free — it is a write cost
 * paid on every INSERT and UPDATE, and `products` is written on every single
 * checkout — so "it might help one day" is not a good enough reason.
 *
 * Measured at 100 000 products / 50 000 orders (median of 7 runs):
 *
 *   catalogue filtered by category, price asc   19.99 ms -> 0.21 ms   x94
 *   order lookup by customer email               4.05 ms -> 0.17 ms   x24
 *   variant SKU uniqueness check (no clash)      0.85 ms -> 0.12 ms   x6.9
 *   catalogue facet counts by category          37.73 ms -> 24.16 ms  x1.6
 *
 * Rejected, with the number that rejected them:
 *
 *   products_sellable_created_idx   x0.99 — products_created_at_idx already
 *                                   serves "newest first"; the sellable
 *                                   filter is unselective (~90% of rows), so
 *                                   filtering while walking the existing
 *                                   index is already optimal.
 *   products_category_idx           redundant — the planner picked
 *                                   products_sellable_idx for both the
 *                                   filter and the facet count.
 *   orders_status_idx               unused — best-selling aggregates over
 *                                   every order regardless of status, and
 *                                   the dashboard list prefers created_at.
 *   orders_status_created_idx       unused, same reason.
 *   api_request_logs_path_idx       unused — the monitoring view reads the
 *                                   500 newest rows and groups them in JS;
 *                                   it never filters on path in SQL.
 *
 * CONCURRENTLY is deliberately not used: Payload runs migrations inside a
 * transaction, which forbids it. These tables are small enough that the brief
 * lock is a non-event; on a table of millions, build them by hand instead.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ----------------------------------------------------------------
  // products — the catalogue's one hot query
  // ----------------------------------------------------------------
  //
  // "Sellable, in this category, ordered by price" is /catalogue's main
  // shape, and "sellable, grouped by category" is its facet bar. Partial, so
  // the index holds only rows that can actually be sold — which is also
  // exactly the set Products.access.read now restricts anonymous callers to,
  // making this the index behind every public product read.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_sellable_idx"
      ON "products" ("category", "price")
      WHERE "is_published" = true AND "discontinued" IS NOT TRUE;
  `)

  // ----------------------------------------------------------------
  // products_variants — the product-save cost
  // ----------------------------------------------------------------
  //
  // assertVariantIdentifiersUnique (collections/Products.ts) runs one
  // `variants.sku equals` and one `variants.barcode equals` query per
  // identifier on every product save, and almost every one of them finds
  // nothing — which meant scanning every variant row in the catalogue to
  // prove a negative. The bulk importer saves products in a loop, so this
  // was quadratic in the size of an import.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_variants_sku_idx"
      ON "products_variants" ("sku") WHERE "sku" IS NOT NULL;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_variants_barcode_idx"
      ON "products_variants" ("barcode") WHERE "barcode" IS NOT NULL;
  `)

  // ----------------------------------------------------------------
  // orders — guest tracking and the customer view
  // ----------------------------------------------------------------
  //
  // /api/orders/track compares the email on every lookup, and the dashboard's
  // customer view groups a customer's whole history by it. Stored lowercased
  // at write time, so a plain btree is the right shape.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "orders_customer_email_idx" ON "orders" ("customer_email");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "products_sellable_idx";
    DROP INDEX IF EXISTS "products_variants_sku_idx";
    DROP INDEX IF EXISTS "products_variants_barcode_idx";
    DROP INDEX IF EXISTS "orders_customer_email_idx";
  `)
}
