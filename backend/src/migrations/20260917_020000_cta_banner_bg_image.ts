import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Home → ctaBannerCopy: a background photograph and the veil laid over it.
//
// Home is versioned, so both columns exist on `home` and, `version_`-prefixed,
// on `_home_v`. Nullable image and a default veil: the band renders exactly as
// before until an editor picks a picture. Additive — the deployed backend never
// selects these columns.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home"
      ADD COLUMN IF NOT EXISTS "cta_banner_copy_bg_image_id" integer,
      ADD COLUMN IF NOT EXISTS "cta_banner_copy_overlay_opacity" numeric DEFAULT 55;
    ALTER TABLE "_home_v"
      ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_bg_image_id" integer,
      ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_overlay_opacity" numeric DEFAULT 55;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "home" ADD CONSTRAINT "home_cta_banner_copy_bg_image_id_media_id_fk"
        FOREIGN KEY ("cta_banner_copy_bg_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_cta_banner_copy_bg_image_id_media_id_fk"
        FOREIGN KEY ("version_cta_banner_copy_bg_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "home_cta_banner_copy_cta_banner_copy_bg_image_idx"
      ON "home" USING btree ("cta_banner_copy_bg_image_id");
    CREATE INDEX IF NOT EXISTS "_home_v_version_cta_banner_copy_version_cta_banner_copy_bg_idx"
      ON "_home_v" USING btree ("version_cta_banner_copy_bg_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "home_cta_banner_copy_cta_banner_copy_bg_image_idx";
    DROP INDEX IF EXISTS "_home_v_version_cta_banner_copy_version_cta_banner_copy_bg_idx";
    ALTER TABLE "home" DROP CONSTRAINT IF EXISTS "home_cta_banner_copy_bg_image_id_media_id_fk";
    ALTER TABLE "_home_v" DROP CONSTRAINT IF EXISTS "_home_v_version_cta_banner_copy_bg_image_id_media_id_fk";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_bg_image_id", DROP COLUMN IF EXISTS "cta_banner_copy_overlay_opacity";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_bg_image_id", DROP COLUMN IF EXISTS "version_cta_banner_copy_overlay_opacity";
  `)
}
