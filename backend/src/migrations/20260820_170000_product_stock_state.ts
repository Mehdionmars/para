import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Makes "stock faible" a real, indexable server-side filter.
//
// The dashboard previously approximated it with `stock <= 100`, because
// Payload's query language cannot compare two columns. That silently missed
// any product whose own lowStockThreshold was above 100, and it pulled a
// superset over the wire to refine in JS — which breaks the page count.
//
// A trigger-maintained boolean rather than a GENERATED column: Payload
// includes every mapped column in its INSERT/UPDATE statements, and Postgres
// rejects writes to a generated column outright. A BEFORE trigger accepts the
// write and overwrites it, so the value is always derived from stock and
// low_stock_threshold no matter who wrote the row or how.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_low_stock" boolean DEFAULT false;
  `)

  await db.execute(sql`
    CREATE OR REPLACE FUNCTION public.products_set_low_stock()
      RETURNS trigger
      LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.is_low_stock :=
        COALESCE(NEW.stock, 0) > 0
        AND COALESCE(NEW.stock, 0) <= COALESCE(NEW.low_stock_threshold, 0);
      RETURN NEW;
    END;
    $$;
  `)

  await db.execute(sql`
    DROP TRIGGER IF EXISTS products_low_stock_trg ON "products";
    CREATE TRIGGER products_low_stock_trg
      BEFORE INSERT OR UPDATE OF stock, low_stock_threshold ON "products"
      FOR EACH ROW EXECUTE FUNCTION public.products_set_low_stock();
  `)

  // Backfill the existing catalogue.
  await db.execute(sql`
    UPDATE "products"
       SET is_low_stock = (COALESCE(stock, 0) > 0 AND COALESCE(stock, 0) <= COALESCE(low_stock_threshold, 0));
  `)

  // Partial index: only the "true" rows are ever queried, and they are the
  // small minority — a full index would be mostly dead weight.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS products_is_low_stock_idx
      ON "products" USING btree ("is_low_stock") WHERE "is_low_stock" = true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS products_low_stock_trg ON "products";
    DROP FUNCTION IF EXISTS public.products_set_low_stock();
    DROP INDEX IF EXISTS products_is_low_stock_idx;
    ALTER TABLE "products" DROP COLUMN IF EXISTS "is_low_stock";
  `)
}
