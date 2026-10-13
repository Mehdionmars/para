import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Pages, Posts and Faqs: the tables their collections never got.
//
// The three collections arrived with the institutional pages, blog and FAQ
// (6ec9383) but no migration, and push is off, so a database migrated from
// this folder has none of their tables. That fails well beyond those pages:
// every update or delete checks document locks with a query that joins
// `payload_locked_documents_rels` on one column per collection, including
// `pages_id`, `posts_id` and `faqs_id`, so saving any upload (and deleting
// any document) errors with "column pages_id does not exist".
//
// Names follow the conventions of 20260813_103331_initial: one enum per
// select, groups flattened to `<group>_<field>`, richText as jsonb, arrays as
// `<collection>_<field>` with `_order` / `_parent_id`.
//
// Safe to run twice and on a database that already has the tables (created
// by push, for instance): every statement is IF NOT EXISTS or guarded.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_slug" AS ENUM('a-propos', 'cgv', 'mentions-legales', 'politique-confidentialite', 'livraison', 'retours');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_posts_category" AS ENUM('conseils', 'routines', 'ingredients', 'actualites');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_faqs_category" AS ENUM('commande', 'livraison', 'paiement', 'retours', 'produits');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" "enum_pages_slug" NOT NULL,
      "status" "enum_pages_status" DEFAULT 'draft' NOT NULL,
      "intro" varchar,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "pages_sections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "body" jsonb
    );

    CREATE TABLE IF NOT EXISTS "posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar,
      "excerpt" varchar,
      "featured_image_id" integer,
      "content" jsonb,
      "category" "enum_posts_category",
      "author" varchar,
      "status" "enum_posts_status" DEFAULT 'draft' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "faqs" (
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "answer" jsonb NOT NULL,
      "category" "enum_faqs_category" DEFAULT 'commande' NOT NULL,
      "order" numeric DEFAULT 0,
      "published" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "pages_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "posts_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "faqs_id" integer;

    DO $$ BEGIN
      ALTER TABLE "pages_sections" ADD CONSTRAINT "pages_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "posts" ADD CONSTRAINT "posts_featured_image_id_media_id_fk"
        FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk"
        FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk"
        FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk"
        FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "pages_status_idx" ON "pages" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "pages_created_at_idx" ON "pages" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "pages_sections_order_idx" ON "pages_sections" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_sections_parent_id_idx" ON "pages_sections" USING btree ("_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "posts_featured_image_idx" ON "posts" USING btree ("featured_image_id");
    CREATE INDEX IF NOT EXISTS "posts_category_idx" ON "posts" USING btree ("category");
    CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "faqs_category_idx" ON "faqs" USING btree ("category");
    CREATE INDEX IF NOT EXISTS "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "faqs_created_at_idx" ON "faqs" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "pages_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "posts_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "faqs_id";
    DROP TABLE IF EXISTS "pages_sections" CASCADE;
    DROP TABLE IF EXISTS "pages" CASCADE;
    DROP TABLE IF EXISTS "posts" CASCADE;
    DROP TABLE IF EXISTS "faqs" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_pages_slug";
    DROP TYPE IF EXISTS "public"."enum_pages_status";
    DROP TYPE IF EXISTS "public"."enum_posts_category";
    DROP TYPE IF EXISTS "public"."enum_posts_status";
    DROP TYPE IF EXISTS "public"."enum_faqs_category";
  `)
}
