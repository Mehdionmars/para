import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Repairs `payload_locked_documents_rels`, which was left behind when the
// coupons/shipping collections were added by hand in 20260819_180000.
//
// Payload's document-locking runs on every *update*, and its query joins one
// `<collection>_id` column per registered collection. A collection with no
// column there makes that join reference a column that doesn't exist, so
// updating ANY document fails with:
//
//   error: column ..._rels.coupons_id does not exist
//
// It went unnoticed because the coupons work was exercised through custom
// REST routes that only ever insert (creation does not check locks). The
// order-status tests, which update through the local API, surfaced it
// immediately.
//
// Adding the newer collections' columns at the same time so the table matches
// the config exactly rather than only far enough to stop today's error.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "coupons_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "coupon_redemptions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "shipping_rules_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "order_status_history_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "notifications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "push_subscriptions_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_fk"
        FOREIGN KEY ("coupons_id") REFERENCES "public"."coupons"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupon_redemptions_fk"
        FOREIGN KEY ("coupon_redemptions_id") REFERENCES "public"."coupon_redemptions"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shipping_rules_fk"
        FOREIGN KEY ("shipping_rules_id") REFERENCES "public"."shipping_rules"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_order_status_history_fk"
        FOREIGN KEY ("order_status_history_id") REFERENCES "public"."order_status_history"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk"
        FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_push_subscriptions_fk"
        FOREIGN KEY ("push_subscriptions_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_coupons_id_idx"
      ON "payload_locked_documents_rels" USING btree ("coupons_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_coupon_redemptions_id_idx"
      ON "payload_locked_documents_rels" USING btree ("coupon_redemptions_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shipping_rules_id_idx"
      ON "payload_locked_documents_rels" USING btree ("shipping_rules_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_status_history_id_idx"
      ON "payload_locked_documents_rels" USING btree ("order_status_history_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notifications_id_idx"
      ON "payload_locked_documents_rels" USING btree ("notifications_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_push_subscriptions_id_idx"
      ON "payload_locked_documents_rels" USING btree ("push_subscriptions_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "push_subscriptions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "notifications_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "order_status_history_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "shipping_rules_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "coupon_redemptions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "coupons_id";
  `)
}
