import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Categories → banner: an optional wide photograph behind the title of the
// category's page. Nullable and additive.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "banner_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "categories" ADD CONSTRAINT "categories_banner_id_media_id_fk"
        FOREIGN KEY ("banner_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "categories_banner_idx" ON "categories" USING btree ("banner_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_banner_idx";
    ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_banner_id_media_id_fk";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "banner_id";
  `)
}
