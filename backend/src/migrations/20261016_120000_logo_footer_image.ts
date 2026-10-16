import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// SiteChrome's logo group gains `footerImage`: a separate mark for the dark
// footer, where the header logo on its white square reads as a sticker.
// Optional — empty, the footer keeps using the header logo — so existing
// rows need no backfill. Mirrors logo_image_id on the live table and the
// versions table (the global has drafts). Safe to run twice.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_chrome" ADD COLUMN IF NOT EXISTS "logo_footer_image_id" integer;
    ALTER TABLE "_site_chrome_v" ADD COLUMN IF NOT EXISTS "version_logo_footer_image_id" integer;

    DO $$ BEGIN
      ALTER TABLE "site_chrome" ADD CONSTRAINT "site_chrome_logo_footer_image_id_media_id_fk"
        FOREIGN KEY ("logo_footer_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "_site_chrome_v" ADD CONSTRAINT "_site_chrome_v_version_logo_footer_image_id_media_id_fk"
        FOREIGN KEY ("version_logo_footer_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "site_chrome_logo_logo_footer_image_idx" ON "site_chrome" USING btree ("logo_footer_image_id");
    CREATE INDEX IF NOT EXISTS "_site_chrome_v_version_logo_version_logo_footer_image_idx" ON "_site_chrome_v" USING btree ("version_logo_footer_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_chrome" DROP COLUMN IF EXISTS "logo_footer_image_id";
    ALTER TABLE "_site_chrome_v" DROP COLUMN IF EXISTS "version_logo_footer_image_id";
  `)
}
