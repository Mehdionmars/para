import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Collections page → each card gets its own page: a slug for the URL and a
// hand-picked set of products. Additive.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "collections_page_cards" ADD COLUMN IF NOT EXISTS "slug" varchar;
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "collections_page_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "collections_page_rels" ADD CONSTRAINT "collections_page_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."collections_page"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "collections_page_rels" ADD CONSTRAINT "collections_page_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "collections_page_rels_order_idx" ON "collections_page_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "collections_page_rels_parent_idx" ON "collections_page_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "collections_page_rels_path_idx" ON "collections_page_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "collections_page_rels_products_id_idx" ON "collections_page_rels" USING btree ("products_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "collections_page_rels";
    ALTER TABLE "collections_page_cards" DROP COLUMN IF EXISTS "slug";
  `)
}
