import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Home → coffrets[].product: the product a gift-box card sells.
//
// The cards only carried copy and a display price, so "Offrir" could not put
// anything in the cart. Home is versioned, so the array table exists twice:
// `home_coffrets` and `_home_v_version_coffrets`. Nullable and additive — the
// deployed backend never selects the column.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home_coffrets" ADD COLUMN IF NOT EXISTS "product_id" integer;
    ALTER TABLE "_home_v_version_coffrets" ADD COLUMN IF NOT EXISTS "product_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "home_coffrets" ADD CONSTRAINT "home_coffrets_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_home_v_version_coffrets" ADD CONSTRAINT "_home_v_version_coffrets_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "home_coffrets_product_idx" ON "home_coffrets" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "_home_v_version_coffrets_product_idx" ON "_home_v_version_coffrets" USING btree ("product_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "home_coffrets_product_idx";
    DROP INDEX IF EXISTS "_home_v_version_coffrets_product_idx";
    ALTER TABLE "home_coffrets" DROP CONSTRAINT IF EXISTS "home_coffrets_product_id_products_id_fk";
    ALTER TABLE "_home_v_version_coffrets" DROP CONSTRAINT IF EXISTS "_home_v_version_coffrets_product_id_products_id_fk";
    ALTER TABLE "home_coffrets" DROP COLUMN IF EXISTS "product_id";
    ALTER TABLE "_home_v_version_coffrets" DROP COLUMN IF EXISTS "product_id";
  `)
}
