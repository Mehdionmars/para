import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Home → featuredPromo: the fields behind "Les incontournables".
//
// The section rendered from a `home.featuredPromo` object no migration had
// ever created, so it could only show the component's hardcoded copy. Home
// is versioned (drafts), so every column exists twice: on `home` and, with
// the `version_` prefix, on `_home_v`.
//
// Column defaults are that same hardcoded copy, so the one existing home row
// reads exactly what the page shows today. Additive: the deployed backend
// never selects these columns.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home"
      ADD COLUMN IF NOT EXISTS "featured_promo_eyebrow" varchar DEFAULT 'Sélection',
      ADD COLUMN IF NOT EXISTS "featured_promo_title" varchar DEFAULT 'Les incontournables',
      ADD COLUMN IF NOT EXISTS "featured_promo_subtitle" varchar DEFAULT '',
      ADD COLUMN IF NOT EXISTS "featured_promo_cta_label" varchar DEFAULT 'Voir tout',
      ADD COLUMN IF NOT EXISTS "featured_promo_cta_url" varchar DEFAULT '/catalogue',
      ADD COLUMN IF NOT EXISTS "featured_promo_limit" numeric DEFAULT 3,
      ADD COLUMN IF NOT EXISTS "featured_promo_promo_title" varchar DEFAULT 'Les dernières arrivées, chaque semaine',
      ADD COLUMN IF NOT EXISTS "featured_promo_promo_cta_label" varchar DEFAULT 'Tout parcourir',
      ADD COLUMN IF NOT EXISTS "featured_promo_promo_cta_url" varchar DEFAULT '/shop/nouveautes',
      ADD COLUMN IF NOT EXISTS "featured_promo_promo_image_id" integer;
  `)

  await db.execute(sql`
    ALTER TABLE "_home_v"
      ADD COLUMN IF NOT EXISTS "version_featured_promo_eyebrow" varchar DEFAULT 'Sélection',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_title" varchar DEFAULT 'Les incontournables',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_subtitle" varchar DEFAULT '',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_cta_label" varchar DEFAULT 'Voir tout',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_cta_url" varchar DEFAULT '/catalogue',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_limit" numeric DEFAULT 3,
      ADD COLUMN IF NOT EXISTS "version_featured_promo_promo_title" varchar DEFAULT 'Les dernières arrivées, chaque semaine',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_promo_cta_label" varchar DEFAULT 'Tout parcourir',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_promo_cta_url" varchar DEFAULT '/shop/nouveautes',
      ADD COLUMN IF NOT EXISTS "version_featured_promo_promo_image_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "home" ADD CONSTRAINT "home_featured_promo_promo_image_id_media_id_fk"
        FOREIGN KEY ("featured_promo_promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_featured_promo_promo_image_id_media_id_fk"
        FOREIGN KEY ("version_featured_promo_promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "home_featured_promo_featured_promo_promo_image_idx"
      ON "home" USING btree ("featured_promo_promo_image_id");
    CREATE INDEX IF NOT EXISTS "_home_v_version_featured_promo_version_featured_promo_pro_idx"
      ON "_home_v" USING btree ("version_featured_promo_promo_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_home_v"
      DROP COLUMN IF EXISTS "version_featured_promo_eyebrow",
      DROP COLUMN IF EXISTS "version_featured_promo_title",
      DROP COLUMN IF EXISTS "version_featured_promo_subtitle",
      DROP COLUMN IF EXISTS "version_featured_promo_cta_label",
      DROP COLUMN IF EXISTS "version_featured_promo_cta_url",
      DROP COLUMN IF EXISTS "version_featured_promo_limit",
      DROP COLUMN IF EXISTS "version_featured_promo_promo_title",
      DROP COLUMN IF EXISTS "version_featured_promo_promo_cta_label",
      DROP COLUMN IF EXISTS "version_featured_promo_promo_cta_url",
      DROP COLUMN IF EXISTS "version_featured_promo_promo_image_id";
    ALTER TABLE "home"
      DROP COLUMN IF EXISTS "featured_promo_eyebrow",
      DROP COLUMN IF EXISTS "featured_promo_title",
      DROP COLUMN IF EXISTS "featured_promo_subtitle",
      DROP COLUMN IF EXISTS "featured_promo_cta_label",
      DROP COLUMN IF EXISTS "featured_promo_cta_url",
      DROP COLUMN IF EXISTS "featured_promo_limit",
      DROP COLUMN IF EXISTS "featured_promo_promo_title",
      DROP COLUMN IF EXISTS "featured_promo_promo_cta_label",
      DROP COLUMN IF EXISTS "featured_promo_promo_cta_url",
      DROP COLUMN IF EXISTS "featured_promo_promo_image_id";
  `)
}
