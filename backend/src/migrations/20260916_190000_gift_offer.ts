import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The gift offer (lib/giftOffer.ts): "3 produits d'une marque = cadeau".
//
// Additive, and read by no deployed code, so it is applied before the backend
// that uses it — which then selects these columns on every read of the
// payment-settings global and of an order.
//
// - payment_settings.gift_offer_*: the CMS switch, the brand, the threshold,
//   the gift's name and its visual. Off by default: a migration must never
//   start promising gifts.
// - orders.gift_label: the gift the order earned, snapshotted for packing.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payment_settings"
      ADD COLUMN IF NOT EXISTS "gift_offer_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "gift_offer_brand_id" integer,
      ADD COLUMN IF NOT EXISTS "gift_offer_min_items" numeric DEFAULT 3,
      ADD COLUMN IF NOT EXISTS "gift_offer_gift_name" varchar DEFAULT 'Summer Trousse offerte',
      ADD COLUMN IF NOT EXISTS "gift_offer_image_id" integer;
  `)

  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gift_label" varchar;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_gift_offer_brand_id_brands_id_fk"
        FOREIGN KEY ("gift_offer_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_gift_offer_image_id_media_id_fk"
        FOREIGN KEY ("gift_offer_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payment_settings_gift_offer_gift_offer_brand_idx"
      ON "payment_settings" USING btree ("gift_offer_brand_id");
    CREATE INDEX IF NOT EXISTS "payment_settings_gift_offer_gift_offer_image_idx"
      ON "payment_settings" USING btree ("gift_offer_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "gift_label";
    ALTER TABLE "payment_settings"
      DROP COLUMN IF EXISTS "gift_offer_enabled",
      DROP COLUMN IF EXISTS "gift_offer_brand_id",
      DROP COLUMN IF EXISTS "gift_offer_min_items",
      DROP COLUMN IF EXISTS "gift_offer_gift_name",
      DROP COLUMN IF EXISTS "gift_offer_image_id";
  `)
}
