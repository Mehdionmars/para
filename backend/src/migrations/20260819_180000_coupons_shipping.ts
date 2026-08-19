import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Coupons, their redemption ledger, and per-city delivery pricing.
//
// Hand-written rather than generated: `payload migrate:create` stops on
// interactive "is this column a rename?" prompts against this schema, which
// can't be answered from a non-interactive shell.
//
// Naming follows the adapter's own conventions, verified against the
// existing tables: snake_case columns, `<field>_id` for a single
// relationship, and a `<table>_rels` join table for hasMany relationships
// (id / order / parent_id / path / <target>_id), matching home_rels.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_coupons_type" AS ENUM('percentage', 'fixed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "coupons" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "type" "public"."enum_coupons_type" DEFAULT 'percentage' NOT NULL,
      "value" numeric NOT NULL,
      "minimum_amount" numeric,
      "maximum_discount" numeric,
      "start_date" timestamp(3) with time zone,
      "end_date" timestamp(3) with time zone,
      "usage_limit" numeric,
      "per_customer_limit" numeric DEFAULT 1,
      "usage_count" numeric DEFAULT 0,
      "active" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "coupons_updated_at_idx" ON "coupons" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "coupons_created_at_idx" ON "coupons" USING btree ("created_at");

    -- Eligibility (products / categories / brands) is hasMany, so it lives in
    -- the adapter's standard join table rather than three array columns.
    CREATE TABLE IF NOT EXISTS "coupons_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer,
      "categories_id" integer,
      "brands_id" integer
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."coupons"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_categories_fk"
        FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_brands_fk"
        FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "coupons_rels_order_idx" ON "coupons_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "coupons_rels_parent_idx" ON "coupons_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "coupons_rels_path_idx" ON "coupons_rels" USING btree ("path");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "coupon_id" integer NOT NULL,
      "order_id" integer,
      "customer_email" varchar NOT NULL,
      "code" varchar,
      "discount_amount" numeric NOT NULL,
      "order_subtotal" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_fk"
        FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- The per-customer limit is counted with this pair, so it gets its own
    -- composite index rather than relying on two separate scans.
    CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_idx" ON "coupon_redemptions" USING btree ("coupon_id");
    CREATE INDEX IF NOT EXISTS "coupon_redemptions_email_idx" ON "coupon_redemptions" USING btree ("customer_email");
    CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_email_idx" ON "coupon_redemptions" USING btree ("coupon_id", "customer_email");
    CREATE INDEX IF NOT EXISTS "coupon_redemptions_updated_at_idx" ON "coupon_redemptions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "coupon_redemptions_created_at_idx" ON "coupon_redemptions" USING btree ("created_at");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "shipping_rules" (
      "id" serial PRIMARY KEY NOT NULL,
      "city" varchar NOT NULL,
      "region" varchar,
      "price" numeric NOT NULL,
      "free_from" numeric,
      "is_default" boolean DEFAULT false,
      "enabled" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "shipping_rules_city_idx" ON "shipping_rules" USING btree ("city");
    CREATE INDEX IF NOT EXISTS "shipping_rules_updated_at_idx" ON "shipping_rules" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "shipping_rules_created_at_idx" ON "shipping_rules" USING btree ("created_at");
  `)

  // Orders gains the discount it was never able to record. Defaulting to 0
  // keeps every existing order's arithmetic (subtotal + shipping = total)
  // valid without a backfill.
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount" numeric DEFAULT 0;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_fk"
        FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "orders_coupon_idx" ON "orders" USING btree ("coupon_id");
  `)

  // Seed the tariffs the checkout used to hardcode, so delivery keeps working
  // identically the moment this ships. Editable in the admin from now on.
  await db.execute(sql`
    INSERT INTO "shipping_rules" ("city", "region", "price", "free_from", "is_default", "enabled")
    SELECT * FROM (VALUES
      ('Casablanca', 'Casablanca-Settat', 20::numeric, 399::numeric, false, true),
      ('Rabat', 'Rabat-Salé-Kénitra', 25::numeric, 399::numeric, false, true),
      ('Marrakech', 'Marrakech-Safi', 30::numeric, 399::numeric, false, true),
      ('Tanger', 'Tanger-Tétouan-Al Hoceïma', 30::numeric, 399::numeric, false, true),
      ('Autres villes', NULL, 35::numeric, 399::numeric, true, true)
    ) AS seed(city, region, price, free_from, is_default, enabled)
    WHERE NOT EXISTS (SELECT 1 FROM "shipping_rules");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "coupon_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "coupon_code";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "discount";
    DROP TABLE IF EXISTS "coupon_redemptions" CASCADE;
    DROP TABLE IF EXISTS "coupons_rels" CASCADE;
    DROP TABLE IF EXISTS "coupons" CASCADE;
    DROP TABLE IF EXISTS "shipping_rules" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_coupons_type";
  `)
}
