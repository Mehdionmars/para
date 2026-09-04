import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The rest of the newsletter section group: the CTA colour, the corner radius
// and the snow-particle pair.
//
// 20260904_000000 covered the logo and the two base colours but stopped
// there, because the field list it was written from had been read truncated.
// A separate migration rather than an edit to that one: it is already applied
// and recorded, so amending it would change nothing where it has run and
// would quietly diverge from where it has not.
//
// This time the gap was established by diffing every column Payload's own
// failing SELECT asks for against information_schema, not by reading the
// config — 94 expected on _home_v against 90 present, and these are the four.
//
// Idempotent, and applied to both the table and its versioned twin.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_cta_color" varchar DEFAULT '#008AA5';
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_border_radius" numeric DEFAULT 26;
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_particles_enabled" boolean DEFAULT true;
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "newsletter_section_particles_opacity" numeric DEFAULT 0.18;
  `)

  await db.execute(sql`
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_cta_color" varchar DEFAULT '#008AA5';
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_border_radius" numeric DEFAULT 26;
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_particles_enabled" boolean DEFAULT true;
    ALTER TABLE "_home_v" ADD COLUMN IF NOT EXISTS "version_newsletter_section_particles_opacity" numeric DEFAULT 0.18;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_cta_color";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_border_radius";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_particles_enabled";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "newsletter_section_particles_opacity";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_cta_color";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_border_radius";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_particles_enabled";
    ALTER TABLE "_home_v" DROP COLUMN IF EXISTS "version_newsletter_section_particles_opacity";
  `)
}
