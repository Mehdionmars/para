import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Separates "this product comes in several contenances" from "each
// contenance costs a different amount".
//
// `same-price` is the default and the safe one: existing products keep
// showing product.price, so nothing changes for anything already in the
// catalogue. Only an editor explicitly choosing `per-variant` opts into
// per-row prices.
//
// products_variants.price also drops NOT NULL: in same-price mode a variant
// legitimately has no price of its own, and the product's price is the
// single source of truth.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_variant_pricing_mode" AS ENUM('same-price', 'per-variant');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "variant_pricing_mode" "public"."enum_products_variant_pricing_mode" DEFAULT 'same-price';
  `)

  await db.execute(sql`
    ALTER TABLE "products_variants" ALTER COLUMN "price" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Re-imposing NOT NULL would fail against any same-price variant, so the
  // rows are backfilled from their parent product's price first — the value
  // the storefront was displaying for them anyway.
  await db.execute(sql`
    UPDATE "products_variants" v
    SET "price" = p."price"
    FROM "products" p
    WHERE v."_parent_id" = p."id" AND v."price" IS NULL;
  `)
  await db.execute(sql`ALTER TABLE "products_variants" ALTER COLUMN "price" SET NOT NULL;`)
  await db.execute(sql`ALTER TABLE "products" DROP COLUMN IF EXISTS "variant_pricing_mode";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_products_variant_pricing_mode";`)
}
