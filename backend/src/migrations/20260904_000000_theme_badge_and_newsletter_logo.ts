import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Two more groups of columns the config declares and no migration creates,
// found by deploying onto an empty database and reading what the backend
// actually failed to query:
//
//   column "badge_bg" does not exist
//   column home.newsletter_section_logo_enabled does not exist
//
// Same cause as 20260818_180000_product_badges and 20260826_150000_home_schema_drift:
// the schema these belong to was pushed rather than migrated, so databases
// that predate the migration chain have them and a fresh one does not.
//
// Scope is deliberately narrow. `payload migrate:create` would have generated
// this automatically, but it asks whether new columns are creations or
// renames — it offered to rename `badge` to `is_low_stock` on products — and
// accepting a machine's guess about a rename against a production database is
// a worse trade than writing the two groups out. Only what actually breaks at
// runtime is repaired here; any remaining config/DB divergence stays visible
// rather than being papered over by a broad generated diff.
//
// Both globals are versioned, so every column is added twice: to the table and
// to its `_v` twin, where Payload prefixes the field with `version_`.
//
// Idempotent throughout, because databases that already carry these columns
// have no record of this migration and will run it too.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ---- theme: the badge appearance group -------------------------------
  await db.execute(sql`
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_bg" varchar;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_text" varchar;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_font_size" numeric DEFAULT 10.5;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_font_weight" numeric DEFAULT 600;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_letter_spacing" numeric DEFAULT 0.06;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_radius" numeric DEFAULT 999;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_padding_x" numeric DEFAULT 11;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_padding_y" numeric DEFAULT 5;
    ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "badge_gap" numeric DEFAULT 6;
  `)

  await db.execute(sql`
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_bg" varchar;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_text" varchar;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_font_size" numeric DEFAULT 10.5;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_font_weight" numeric DEFAULT 600;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_letter_spacing" numeric DEFAULT 0.06;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_radius" numeric DEFAULT 999;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_padding_x" numeric DEFAULT 11;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_padding_y" numeric DEFAULT 5;
    ALTER TABLE "_theme_v" ADD COLUMN IF NOT EXISTS "version_badge_gap" numeric DEFAULT 6;
  `)

  // ---- home: the newsletter logo and colour group ----------------------
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_home_newsletter_section_logo_position" AS ENUM('left', 'top');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum__home_v_version_newsletter_section_logo_position" AS ENUM('left', 'top');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_logo_enabled" boolean DEFAULT true;
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_logo_size" numeric DEFAULT 76;
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_logo_position" "public"."enum_home_newsletter_section_logo_position" DEFAULT 'left';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_background_color" varchar DEFAULT '#5E4074';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_text_color" varchar DEFAULT '#FFFFFF';
  `)

  await db.execute(sql`
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_logo_enabled" boolean DEFAULT true;
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_logo_size" numeric DEFAULT 76;
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_logo_position" "public"."enum__home_v_version_newsletter_section_logo_position" DEFAULT 'left';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_background_color" varchar DEFAULT '#5E4074';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_text_color" varchar DEFAULT '#FFFFFF';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_bg";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_text";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_font_size";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_font_weight";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_letter_spacing";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_radius";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_padding_x";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_padding_y";
    ALTER TABLE "theme" DROP COLUMN IF EXISTS "badge_gap";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_bg";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_text";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_font_size";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_font_weight";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_letter_spacing";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_radius";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_padding_x";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_padding_y";
    ALTER TABLE "_theme_v" DROP COLUMN IF EXISTS "version_badge_gap";
  `)

  await db.execute(sql`
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_logo_enabled";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_logo_size";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_logo_position";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_background_color";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_text_color";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_logo_enabled";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_logo_size";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_logo_position";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_background_color";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_text_color";
    DROP TYPE IF EXISTS "public"."enum_home_newsletter_section_logo_position";
    DROP TYPE IF EXISTS "public"."enum__home_v_version_newsletter_section_logo_position";
  `)
}
