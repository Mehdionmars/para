import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Extends the existing notifications table to carry stock events.
//
// The current idempotency guard is a unique index on (order_id, type,
// channel). That works for order events, where one order produces one
// notification per event forever, but it cannot express a stock event: a
// product may legitimately cross its low-stock threshold, be restocked, and
// cross it again — each crossing deserves its own alert.
//
// So the key becomes explicit rather than structural: `dedupe_key` is built
// by the caller and identifies *the occurrence*, not the entity. Order events
// keep their existing key shape, so nothing already sent changes.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "product_id" integer;
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "dedupe_key" varchar;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "notifications" ADD CONSTRAINT "notifications_product_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "notifications_product_idx" ON "notifications" USING btree ("product_id");
  `)

  // Backfills the key for rows written before it existed, so the unique index
  // below can be created without collisions.
  await db.execute(sql`
    UPDATE "notifications"
       SET dedupe_key = 'order:' || order_id || ':' || type || ':' || channel
     WHERE dedupe_key IS NULL AND order_id IS NOT NULL;
  `)

  // Partial unique index: rows without a key (there should be none after the
  // backfill) do not block each other.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupe_key_idx"
      ON "notifications" USING btree ("dedupe_key") WHERE "dedupe_key" IS NOT NULL;
  `)

  // Stock events are product-scoped, so the enum needs them.
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_notifications_type" ADD VALUE IF NOT EXISTS 'LOW_STOCK';
    EXCEPTION WHEN others THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_notifications_type" ADD VALUE IF NOT EXISTS 'OUT_OF_STOCK';
    EXCEPTION WHEN others THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE "public"."enum_notifications_type" ADD VALUE IF NOT EXISTS 'BACK_IN_STOCK';
    EXCEPTION WHEN others THEN null; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "notifications_dedupe_key_idx";
    DROP INDEX IF EXISTS "notifications_product_idx";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "dedupe_key";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "product_id";
  `)
  // Enum values are intentionally left in place: Postgres cannot remove one
  // without rewriting the type, and a spare label is harmless.
}
