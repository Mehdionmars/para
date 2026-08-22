import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * An order line remembers which variant was bought.
 *
 * `orders_items` snapshotted the product name, the unit price and the
 * quantity, but nothing about *which* 50 ml / 100 ml / Rouge the customer
 * actually ordered. Two lines of the same product were indistinguishable in
 * the back office, and the only way to guess was to re-read the product —
 * which is exactly what a snapshot exists to avoid, since the product's
 * variants can be renamed, repriced or deleted after the sale.
 *
 * All four columns are nullable on purpose: every order placed before this
 * migration legitimately has no variant, and a product without variants
 * still never will. Nothing is backfilled.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders_items"
      ADD COLUMN IF NOT EXISTS "variant_id" varchar,
      ADD COLUMN IF NOT EXISTS "variant_label" varchar,
      ADD COLUMN IF NOT EXISTS "variant_type" varchar,
      ADD COLUMN IF NOT EXISTS "sku" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders_items"
      DROP COLUMN IF EXISTS "variant_id",
      DROP COLUMN IF EXISTS "variant_label",
      DROP COLUMN IF EXISTS "variant_type",
      DROP COLUMN IF EXISTS "sku";
  `)
}
