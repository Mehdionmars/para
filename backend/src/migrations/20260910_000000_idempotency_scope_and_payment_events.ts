import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two additions to the transactional path.
 *
 * ## 1. `idempotency_keys` gains a scope and an explicit expiry
 *
 * The table already carried the guarantee: PRIMARY KEY (endpoint, key) plus
 * an `INSERT … ON CONFLICT DO NOTHING` claim, which is what makes two
 * simultaneous checkouts resolve to one order. Nothing about that changes
 * here, and deliberately so — it is the part that is already correct.
 *
 * What it did not carry was *who* the key belonged to. A key is chosen by the
 * client, and two clients can choose the same one; today the second one to
 * arrive loses the race, reads the row, and — if the carts happen to hash the
 * same — is handed back the first shopper's order number, total and status.
 * That is a cross-customer leak with a narrow trigger and a bad worst case.
 * `scope` binds a key to the identity that first used it, and a mismatch is
 * answered 409 instead of replayed.
 *
 * `expires_at` makes the retention window a property of the row rather than a
 * constant the purge has to remember. The purge in /api/jobs/tick currently
 * deletes on `created_at < now() - interval`, which works only while every
 * caller agrees on the same TTL; a column lets a long-running import keep its
 * key longer than a checkout without the purge knowing anything about either.
 *
 * Both columns are additive with defaults, so existing rows stay valid and
 * in-flight checkouts during the deploy are unaffected.
 *
 * ## 2. `payment_events` is new
 *
 * Nothing in this project receives provider webhooks yet — payment today is a
 * `paymentMethod`/`paymentStatus` pair on the order, set at checkout. This
 * table is the seam for when CMI (or any provider) starts posting: a UNIQUE
 * `provider_event_id` means a provider that delivers `evt_123` three times
 * gets one row and two no-ops, which is the same claim-by-unique-index shape
 * used above rather than a second mechanism to reason about.
 *
 * It stores a hash of the raw event, not the event. Provider payloads carry
 * card metadata and customer PII, and a webhook log is exactly the table that
 * gets exported to debug something and then forgotten in a bucket.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ----------------------------------------------------------------
  // idempotency_keys
  // ----------------------------------------------------------------
  //
  // `scope` defaults to '' rather than NULL so the equality check in
  // lib/idempotency.ts is a plain `=` on every row, including the ones that
  // predate this migration. NULL would make that comparison return NULL and
  // silently take the "no mismatch" branch — the exact failure this column
  // exists to prevent.
  await db.execute(sql`
    ALTER TABLE "idempotency_keys"
      ADD COLUMN IF NOT EXISTS "scope" varchar(200) NOT NULL DEFAULT '';
  `)

  await db.execute(sql`
    ALTER TABLE "idempotency_keys"
      ADD COLUMN IF NOT EXISTS "expires_at" timestamp(3) with time zone;
  `)

  // Backfilled from created_at with the TTL the code has been using all
  // along, so the purge's behaviour is unchanged for rows written before
  // this deploy.
  await db.execute(sql`
    UPDATE "idempotency_keys"
       SET "expires_at" = "created_at" + interval '24 hours'
     WHERE "expires_at" IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "idempotency_keys"
      ALTER COLUMN "expires_at" SET DEFAULT now() + interval '24 hours';
  `)

  await db.execute(sql`
    ALTER TABLE "idempotency_keys"
      ALTER COLUMN "expires_at" SET NOT NULL;
  `)

  // The purge scans by expiry now. `created_at`'s index stays: it is what
  // makes the "oldest first" batching in /api/jobs/tick cheap.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idempotency_keys_expires_at_idx" ON "idempotency_keys" ("expires_at");
  `)

  // ----------------------------------------------------------------
  // payment_events
  // ----------------------------------------------------------------
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payment_events_provider" AS ENUM('cmi', 'manual', 'other');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_payment_events_status" AS ENUM('received', 'processed', 'ignored', 'failed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payment_events" (
      "id"                serial PRIMARY KEY NOT NULL,
      "provider"          "public"."enum_payment_events_provider" NOT NULL DEFAULT 'cmi',
      "provider_event_id" varchar(255) NOT NULL,
      "event_type"        varchar(128),
      "order_id"          integer,
      "status"            "public"."enum_payment_events_status" NOT NULL DEFAULT 'received',
      "payload_hash"      varchar(64),
      "failure_reason"    varchar(500),
      "received_at"       timestamp(3) with time zone NOT NULL DEFAULT now(),
      "processed_at"      timestamp(3) with time zone,
      "updated_at"        timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at"        timestamp(3) with time zone NOT NULL DEFAULT now()
    );
  `)

  // The whole point of the table. A provider that retries — and they all
  // retry, that is what an at-least-once delivery guarantee means — must not
  // be able to confirm one payment twice.
  //
  // Scoped by provider as well as id: two providers are not obliged to
  // namespace their event ids against each other.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_provider_event_idx"
      ON "payment_events" ("provider", "provider_event_id");
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payment_events_order_idx" ON "payment_events" ("order_id");
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payment_events"
        ADD CONSTRAINT "payment_events_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

export async function down({ db }: MigrateUpArgs | MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payment_events";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_payment_events_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_payment_events_provider";`)

  await db.execute(sql`DROP INDEX IF EXISTS "idempotency_keys_expires_at_idx";`)
  await db.execute(sql`ALTER TABLE "idempotency_keys" DROP COLUMN IF EXISTS "expires_at";`)
  await db.execute(sql`ALTER TABLE "idempotency_keys" DROP COLUMN IF EXISTS "scope";`)
}
