import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The routine offer, priced at checkout (lib/routineOffer.ts).
//
// Three additive changes, none of which old code reads, so this can be applied
// before the backend that uses it is deployed — and must be: the new Products
// config joins products_rels on every product query, and a backend started
// without the table fails all of them.
//
// - payment_settings.routine_offer_*: the CMS switch, percentage and minimum.
//   Off by default. A migration must never start discounting orders.
// - orders.routine_discount: the part of `discount` that came from the offer.
// - products_rels: Payload's join table for the new hasMany `relatedProducts`
//   field. Same layout as every other *_rels table in this schema (home_rels):
//   parent_id is the product being edited, products_id the product it points
//   at, `path` the field name. The first hasMany relationship on Products,
//   which is why the table does not exist yet.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payment_settings"
      ADD COLUMN IF NOT EXISTS "routine_offer_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "routine_offer_percent" numeric DEFAULT 15,
      ADD COLUMN IF NOT EXISTS "routine_offer_min_items" numeric DEFAULT 2;
  `)

  await db.execute(sql`
    ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "routine_discount" numeric DEFAULT 0;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_rels_order_idx" ON "products_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "products_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_rels" CASCADE;
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "routine_discount";
    ALTER TABLE "payment_settings"
      DROP COLUMN IF EXISTS "routine_offer_enabled",
      DROP COLUMN IF EXISTS "routine_offer_percent",
      DROP COLUMN IF EXISTS "routine_offer_min_items";
  `)
}
