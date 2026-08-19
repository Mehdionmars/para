import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Extends the product badge system: three new marketing types plus a
// per-badge `priority` used to order the pills on a product card.
//
// Existing enum values are added to, never renamed — `nouveau`,
// `bestseller`, `exclusivite` etc. are the values already persisted for any
// badge an editor has configured, and renaming them in place would orphan
// those rows. Only the *display* labels changed (Products.ts's
// BADGE_TYPE_PRESETS), which is a presentation concern with no storage impact.
//
// `priority` is nullable on purpose: null means "use this type's default
// priority", so nothing needs backfilling and pre-existing badges keep
// working untouched.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_products_badges_type" ADD VALUE IF NOT EXISTS 'routine';
    ALTER TYPE "public"."enum_products_badges_type" ADD VALUE IF NOT EXISTS 'solde';
    ALTER TYPE "public"."enum_products_badges_type" ADD VALUE IF NOT EXISTS 'offrespeciale';
  `)

  await db.execute(sql`
    ALTER TABLE "products_badges" ADD COLUMN IF NOT EXISTS "priority" numeric;
  `)
}

// Postgres cannot drop a value from an enum, so the added types survive a
// rollback; only the column is reversible. Dropping and recreating the enum
// would fail against any row already using one of the new values, which is a
// worse outcome than leaving three unused labels behind.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_badges" DROP COLUMN IF EXISTS "priority";
  `)
}
