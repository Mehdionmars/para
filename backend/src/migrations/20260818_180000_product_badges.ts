import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Creates the product badges array table and its type enum.
//
// These were never captured by a migration. The schema they belong to was
// built by an early `PAYLOAD_DB_PUSH=1` run, before this project moved to
// hand-written migrations, so every database that has them inherited them
// rather than migrating into them. The chain therefore could not build a
// database from scratch: `20260818_190000_product_badge_priority`, which
// runs straight after this one, does
//
//   ALTER TYPE "enum_products_badges_type" ADD VALUE ...
//   ALTER TABLE "products_badges" ADD COLUMN "priority" ...
//
// against objects nothing had created, and a fresh deploy died there with
// `type "public.enum_products_badges_type" does not exist`.
//
// Dated 180000 so it is ordered immediately before that migration, and
// written to match the shape the repo already uses for a `products` child
// array (see 20260813_140000_add_product_variants): `_order`, `_parent_id`
// cascading to products, a varchar primary key, then the field columns.
//
// The enum deliberately omits `routine`, `solde` and `offrespeciale`, and the
// table omits `priority` — those are exactly what the next migration adds, and
// duplicating them here would make the two disagree about who owns them.
//
// Every statement is idempotent because this migration is new to databases
// that already contain these objects: it is not recorded in their
// `payload_migrations`, so it will run there too and must be a no-op.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_badges_type" AS ENUM('nouveau', 'bestseller', 'exclusivite', 'coupdecoeur', 'promo', 'top', 'editionlimitee', 'custom');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_badges" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "enabled" boolean DEFAULT true,
      "type" "public"."enum_products_badges_type" DEFAULT 'nouveau',
      "text" varchar,
      "bg_color" varchar,
      "text_color" varchar
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "products_badges" ADD CONSTRAINT "products_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_badges_order_idx" ON "products_badges" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_badges_parent_id_idx" ON "products_badges" USING btree ("_parent_id");
  `)
}

// Drops both, which on a database that inherited them from the old push is a
// real loss of the badges an editor configured. That is the honest reverse of
// `up`, and the reason to reach for it deliberately rather than as part of a
// blanket rollback.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_badges" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_products_badges_type";
  `)
}
