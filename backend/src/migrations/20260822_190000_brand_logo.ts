import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Gives a brand somewhere to keep its logo.
//
// The storefront rendered every brand as its name set in the display face —
// on /marques, in the catalogue's brand rail, on the brand page header. That
// was not a design choice so much as the only thing available: the collection
// held id, name and slug and nothing else, so there was no logo to render.
//
// Nullable and unconstrained beyond the media FK: uploading logos is a slow
// editorial job, brand by brand, and the site has to look finished at every
// point in between. The fallback is a composed monogram, never a broken
// image.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "logo_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk"
        FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "brands_logo_idx" ON "brands" USING btree ("logo_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "brands_logo_idx";
    ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "brands_logo_id_media_id_fk";
    ALTER TABLE "brands" DROP COLUMN IF EXISTS "logo_id";
  `)
}
