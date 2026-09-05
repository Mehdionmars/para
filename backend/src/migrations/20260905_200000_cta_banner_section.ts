import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The centred call-to-action block: one headline, one supporting line, one
// button. Adds the `ctaBannerCopy` group declared in globals/Home.ts.
//
// Written by hand rather than generated. `payload migrate:create` compares
// the config against the database and asks whether each new column is a
// creation or a rename — on this schema it has already proposed renaming an
// unrelated column, and accepting a machine's guess against a database
// holding orders is a worse trade than writing eight columns out.
//
// `home` is versioned, so every column is added twice: once to the table and
// once to its `_home_v` twin, where Payload prefixes the field with
// `version_`. Missing that twin is what broke the last three deployments —
// the page renders, and the CMS 500s the moment it reads a draft.
//
// No migration is needed for the `sections` array: Home's afterRead hook
// backfills any SECTION_KEYS entry a saved document does not have yet,
// inserting it after its nearest present neighbour.
//
// Idempotent: databases that somehow already carry these columns have no
// record of this migration and will run it too.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_eyebrow" varchar;
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_title" varchar DEFAULT 'Un conseil de pharmacien, en deux minutes';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_description" varchar DEFAULT 'Décrivez votre besoin, nous vous orientons vers les produits adaptés à votre peau.';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_cta_label" varchar DEFAULT 'Nous contacter';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_cta_url" varchar DEFAULT '/contact';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_bg" varchar DEFAULT '#F7EEE5';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_text_color" varchar DEFAULT '#373020';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "cta_banner_copy_cta_color" varchar DEFAULT '#5E4074';
  `)

  await db.execute(sql`
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_eyebrow" varchar;
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_title" varchar DEFAULT 'Un conseil de pharmacien, en deux minutes';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_description" varchar DEFAULT 'Décrivez votre besoin, nous vous orientons vers les produits adaptés à votre peau.';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_cta_label" varchar DEFAULT 'Nous contacter';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_cta_url" varchar DEFAULT '/contact';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_bg" varchar DEFAULT '#F7EEE5';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_text_color" varchar DEFAULT '#373020';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_cta_banner_copy_cta_color" varchar DEFAULT '#5E4074';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_eyebrow";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_title";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_description";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_cta_label";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_cta_url";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_bg";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_text_color";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "cta_banner_copy_cta_color";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_eyebrow";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_title";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_description";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_cta_label";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_cta_url";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_bg";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_text_color";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_cta_banner_copy_cta_color";
  `)
}
