import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Closes the drift between globals/Home.ts and the database.
 *
 * Both fields already exist in globals/Home.ts and in the generated
 * payload-types, and the storefront already reads them
 * (lib/storefront/cardLayout.ts `toCtaAlign` / `framingToObjectPosition`) —
 * but no migration ever created the columns. The consequence was not a
 * missing feature, it was a hard failure: every read of the Home global threw
 *
 *   column home_marketingBanners.cta_align does not exist
 *
 * so `GET /api/globals/home` answered 500 and the whole Storefront Builder
 * (/dashboard/storefront) was a red error page for every editor. Only the
 * builder was affected — the public storefront reads the *generated snapshot*
 * for its home content, which is why the shop kept rendering and the breakage
 * stayed invisible.
 *
 * The same applies to the five `editorial*` text fields on `rails`, added to
 * the config alongside them and equally absent from the database.
 *
 * The full set was found by diffing, not by chasing errors one at a time:
 * Payload built the schema its config implies into a scratch database
 * (`PAYLOAD_DB_PUSH=1` with DATABASE_URI pointed elsewhere — see
 * payload.config.ts) and the two column lists were compared. Ten columns were
 * missing across four tables, and these are all of them.
 *
 * The enum names, types and defaults mirror what that reference schema
 * contains, so the adapter finds exactly the shape it expects.
 */

const ALIGN_VALUES = sql`'left', 'center', 'right'`
const FRAMING_VALUES = sql`'center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_home_marketing_banners_cta_align" AS ENUM(${ALIGN_VALUES});
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_home_marketing_banners_image_framing" AS ENUM(${FRAMING_VALUES});
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "enum__home_v_version_marketing_banners_cta_align" AS ENUM(${ALIGN_VALUES});
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "enum__home_v_version_marketing_banners_image_framing" AS ENUM(${FRAMING_VALUES});
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  // Defaulted to the values the banners already rendered with, so every
  // existing campaign is byte-for-byte unchanged until an editor moves it.
  await db.execute(sql`
    ALTER TABLE "home_marketing_banners"
      ADD COLUMN IF NOT EXISTS "cta_align" "enum_home_marketing_banners_cta_align" DEFAULT 'left',
      ADD COLUMN IF NOT EXISTS "image_framing" "enum_home_marketing_banners_image_framing" DEFAULT 'center';
  `)

  await db.execute(sql`
    ALTER TABLE "_home_v_version_marketing_banners"
      ADD COLUMN IF NOT EXISTS "cta_align" "enum__home_v_version_marketing_banners_cta_align" DEFAULT 'left',
      ADD COLUMN IF NOT EXISTS "image_framing" "enum__home_v_version_marketing_banners_image_framing" DEFAULT 'center';
  `)

  // The editorial block on a rail. Plain varchar with no default: an unset
  // rail has no editorial panel, which is what null already means to the
  // storefront (RailSection renders the block only when a title is present).
  const editorialColumns = sql`
    ADD COLUMN IF NOT EXISTS "editorial_eyebrow" varchar,
    ADD COLUMN IF NOT EXISTS "editorial_title" varchar,
    ADD COLUMN IF NOT EXISTS "editorial_description" varchar,
    ADD COLUMN IF NOT EXISTS "editorial_cta_label" varchar,
    ADD COLUMN IF NOT EXISTS "editorial_cta_url" varchar
  `

  await db.execute(sql`ALTER TABLE "home_rails" ${editorialColumns};`)
  await db.execute(sql`ALTER TABLE "_home_v_version_rails" ${editorialColumns};`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home_marketing_banners"
      DROP COLUMN IF EXISTS "cta_align",
      DROP COLUMN IF EXISTS "image_framing";
    ALTER TABLE "_home_v_version_marketing_banners"
      DROP COLUMN IF EXISTS "cta_align",
      DROP COLUMN IF EXISTS "image_framing";
    DROP TYPE IF EXISTS "enum_home_marketing_banners_cta_align";
    DROP TYPE IF EXISTS "enum_home_marketing_banners_image_framing";
    DROP TYPE IF EXISTS "enum__home_v_version_marketing_banners_cta_align";
    DROP TYPE IF EXISTS "enum__home_v_version_marketing_banners_image_framing";
  `)

  const dropEditorial = sql`
    DROP COLUMN IF EXISTS "editorial_eyebrow",
    DROP COLUMN IF EXISTS "editorial_title",
    DROP COLUMN IF EXISTS "editorial_description",
    DROP COLUMN IF EXISTS "editorial_cta_label",
    DROP COLUMN IF EXISTS "editorial_cta_url"
  `
  await db.execute(sql`ALTER TABLE "home_rails" ${dropEditorial};`)
  await db.execute(sql`ALTER TABLE "_home_v_version_rails" ${dropEditorial};`)
}
