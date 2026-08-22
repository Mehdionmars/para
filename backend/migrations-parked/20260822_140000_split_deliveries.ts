import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Splits one flat table into a notification and its per-channel deliveries.
//
// Until now a row *was* a delivery: ORDER_CONFIRMED wrote four rows carrying
// the same title, message and metadata, differing only by channel. The
// notification itself had no identity — "what is the state of this alert
// across channels?" could only be answered by string-matching the dedupe key.
//
//   notifications          what happened, said once
//   notification_deliveries  one row per channel, with its own state
//
// The merge key is the dedupe key minus its trailing `:<channel>` segment,
// which is exactly how the old key encoded the parent. 148 rows collapse to
// 100 parents; every delivery keeps its status, attempts and error.
//
// `order_id` / `product_id` stay as real foreign keys rather than becoming a
// polymorphic (entity_type, entity_id) pair. I proposed that pair earlier and
// it is the wrong trade here: the FKs cascade, so deleting an order cleans up
// its notifications automatically. A polymorphic reference cannot.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "notification_deliveries" (
      "id" serial PRIMARY KEY NOT NULL,
      "notification_id" integer NOT NULL,
      "channel" "public"."enum_notifications_channel" NOT NULL,
      "status" "public"."enum_notifications_status" DEFAULT 'pending' NOT NULL,
      "attempts" numeric DEFAULT 0,
      "last_attempt_at" timestamp(3) with time zone,
      "sent_at" timestamp(3) with time zone,
      "read_at" timestamp(3) with time zone,
      "error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_parent_fk"
        FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Replaces the old (order_id, type, channel) guard. Idempotence now has
    -- two distinct layers: the parent's dedupe_key identifies the occurrence,
    -- this identifies the channel within it.
    CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_channel_idx"
      ON "notification_deliveries" USING btree ("notification_id", "channel");
    CREATE INDEX IF NOT EXISTS "notification_deliveries_status_idx"
      ON "notification_deliveries" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "notification_deliveries_created_at_idx"
      ON "notification_deliveries" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "notification_deliveries_updated_at_idx"
      ON "notification_deliveries" USING btree ("updated_at");
  `)

  // Canonical parent per group: the lowest id, which is also the earliest.
  await db.execute(sql`
    CREATE TEMP TABLE _split AS
      SELECT id,
             regexp_replace(dedupe_key, ':[^:]+$', '') AS parent_key,
             MIN(id) OVER (PARTITION BY regexp_replace(dedupe_key, ':[^:]+$', '')) AS parent_id
        FROM notifications
       WHERE dedupe_key IS NOT NULL;
  `)

  await db.execute(sql`
    INSERT INTO notification_deliveries
      (notification_id, channel, status, attempts, last_attempt_at, sent_at, read_at, error, updated_at, created_at)
    SELECT s.parent_id, n.channel, n.status, COALESCE(n.attempts, 0), n.last_attempt_at,
           n.sent_at, n.read_at, n.error, n.updated_at, n.created_at
      FROM notifications n
      JOIN _split s ON s.id = n.id
    ON CONFLICT (notification_id, channel) DO NOTHING;
  `)

  // The non-canonical rows are now represented by their deliveries.
  await db.execute(sql`
    DELETE FROM notifications n USING _split s WHERE s.id = n.id AND s.parent_id <> n.id;
  `)

  await db.execute(sql`
    UPDATE notifications n SET dedupe_key = s.parent_key FROM _split s WHERE s.id = n.id;
    DROP TABLE _split;
  `)

  // Delivery state moves out of the parent.
  await db.execute(sql`
    DROP INDEX IF EXISTS "notifications_idempotency_idx";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "channel";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "status";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "attempts";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "last_attempt_at";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "sent_at";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read_at";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "error";
  `)

  // dedupe_key is now the parent's identity and is always present.
  await db.execute(sql`
    DROP INDEX IF EXISTS "notifications_dedupe_key_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupe_key_idx"
      ON "notifications" USING btree ("dedupe_key") WHERE "dedupe_key" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Restores the flat shape: one row per channel, delivery state folded back
  // in. Parents that had several channels are re-expanded.
  await db.execute(sql`
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "channel" "public"."enum_notifications_channel";
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "status" "public"."enum_notifications_status";
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "attempts" numeric DEFAULT 0;
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "last_attempt_at" timestamp(3) with time zone;
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "sent_at" timestamp(3) with time zone;
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" timestamp(3) with time zone;
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "error" varchar;
  `)

  await db.execute(sql`
    INSERT INTO notifications
      (order_id, product_id, customer_email, recipient_type, recipient_ref, type, title, message, metadata,
       channel, status, attempts, last_attempt_at, sent_at, read_at, error, dedupe_key, updated_at, created_at)
    SELECT n.order_id, n.product_id, n.customer_email, n.recipient_type, n.recipient_ref, n.type,
           n.title, n.message, n.metadata,
           d.channel, d.status, d.attempts, d.last_attempt_at, d.sent_at, d.read_at, d.error,
           n.dedupe_key || ':' || d.channel, d.updated_at, d.created_at
      FROM notification_deliveries d
      JOIN notifications n ON n.id = d.notification_id
     WHERE d.channel <> (
       SELECT channel FROM notification_deliveries WHERE notification_id = n.id ORDER BY id LIMIT 1
     );
  `)

  await db.execute(sql`
    UPDATE notifications n
       SET channel = d.channel, status = d.status, attempts = d.attempts,
           last_attempt_at = d.last_attempt_at, sent_at = d.sent_at, read_at = d.read_at,
           error = d.error, dedupe_key = n.dedupe_key || ':' || d.channel
      FROM (SELECT DISTINCT ON (notification_id) * FROM notification_deliveries ORDER BY notification_id, id) d
     WHERE d.notification_id = n.id;
  `)

  // Recreating this is not optional: `up` drops it, and the service claims a
  // row with ON CONFLICT (order_id, type, channel). Without the index every
  // notification insert fails at runtime — which is exactly what happened the
  // first time this migration was rolled back.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "notifications_idempotency_idx"
      ON "notifications" USING btree ("order_id", "type", "channel");
    CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications" USING btree ("status");
  `)

  await db.execute(sql`DROP TABLE IF EXISTS "notification_deliveries" CASCADE;`)
}
