import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Categories → image: an optional photograph for the mega menu. Nullable and
// additive — the deployed backend never selects the column.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "categories_image_idx" ON "categories" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_image_idx";
    ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_image_id_media_id_fk";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "image_id";
  `)
}
