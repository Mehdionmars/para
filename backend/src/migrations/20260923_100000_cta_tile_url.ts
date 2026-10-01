import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Home → ctaPair1/ctaPair2: the destination of each square offer tile.
//
// The "Offres spéciales" tiles had no destination field, so the storefront
// hardcoded href="/catalogue" on every one of them: two large pictures that
// could only ever lead to the whole shop, whatever they showed. This is the
// column that lets an editor point a tile at a product, a category or a
// curated selection.
//
// Four tables, not two: Home is versioned, so each array has a `_home_v_`
// twin. Unlike the columns on `_home_v` itself, the ones on a versioned
// array table carry no `version_` prefix — checked against
// 20260813_103331_initial, where `_home_v_version_cta_pair1` holds plain
// "eyebrow", "title", "bg", "image_id".
//
// Purely additive, and safe to run twice: one nullable varchar per table, no
// default, no constraint, no index. A tile with no value keeps the catalogue
// link it already had, and until then the storefront derives a destination
// from the tile's own copy (see frontend/lib/storefront/categoryTree.ts,
// findCategoryHrefInText), so nothing depends on this having run.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home_cta_pair1" ADD COLUMN IF NOT EXISTS "cta_url" varchar;
    ALTER TABLE "home_cta_pair2" ADD COLUMN IF NOT EXISTS "cta_url" varchar;
    ALTER TABLE "_home_v_version_cta_pair1" ADD COLUMN IF NOT EXISTS "cta_url" varchar;
    ALTER TABLE "_home_v_version_cta_pair2" ADD COLUMN IF NOT EXISTS "cta_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home_cta_pair1" DROP COLUMN IF EXISTS "cta_url";
    ALTER TABLE "home_cta_pair2" DROP COLUMN IF EXISTS "cta_url";
    ALTER TABLE "_home_v_version_cta_pair1" DROP COLUMN IF EXISTS "cta_url";
    ALTER TABLE "_home_v_version_cta_pair2" DROP COLUMN IF EXISTS "cta_url";
  `)
}
