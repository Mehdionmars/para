import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Per-nav-item appearance / animation / badge-colour overrides.
//
// Every column is nullable with no default: an unset value means "inherit
// the theme", which is exactly how the storefront already renders today. So
// this migration is additive and the existing navigation keeps rendering
// byte-for-byte the same until an editor actually fills something in.
//
// The Navigation global is versioned (drafts + 20 revisions), so Payload
// keeps a parallel `_navigation_v_version_items` table — both must gain the
// same columns or loading a draft blows up on a missing column.
const TABLES = ['navigation_items', '_navigation_v_version_items'] as const

const COLUMNS: [string, string][] = [
  ['open_in_new_tab', 'boolean DEFAULT false'],
  ['badge_background_color', 'varchar'],
  ['badge_text_color', 'varchar'],
  ['appearance_color', 'varchar'],
  ['appearance_hover_color', 'varchar'],
  ['appearance_active_color', 'varchar'],
  ['appearance_background_color', 'varchar'],
  ['animation_enabled', 'boolean DEFAULT false'],
  ['animation_duration', 'numeric DEFAULT 2'],
  ['animation_delay', 'numeric DEFAULT 0'],
  ['animation_iteration_count', "varchar DEFAULT 'infinite'"],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Two enum types, not one shared: Payload derives an enum name per field
  // occurrence, and the versions table gets its own.
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_navigation_items_appearance_font_weight" AS ENUM('300', '400', '500', '600', '700');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_navigation_items_animation_type" AS ENUM('none', 'blink', 'pulse', 'shimmer', 'glow');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__navigation_v_version_items_appearance_font_weight" AS ENUM('300', '400', '500', '600', '700');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__navigation_v_version_items_animation_type" AS ENUM('none', 'blink', 'pulse', 'shimmer', 'glow');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  for (const table of TABLES) {
    for (const [column, type] of COLUMNS) {
      await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type};`))
    }
    const enumPrefix = table === 'navigation_items' ? 'enum_navigation_items' : 'enum__navigation_v_version_items'
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "appearance_font_weight" "public"."${enumPrefix}_appearance_font_weight";`,
      ),
    )
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "animation_type" "public"."${enumPrefix}_animation_type" DEFAULT 'none';`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    for (const [column] of COLUMNS) {
      await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}";`))
    }
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "appearance_font_weight";`))
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "animation_type";`))
  }

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_navigation_items_appearance_font_weight";
    DROP TYPE IF EXISTS "public"."enum_navigation_items_animation_type";
    DROP TYPE IF EXISTS "public"."enum__navigation_v_version_items_appearance_font_weight";
    DROP TYPE IF EXISTS "public"."enum__navigation_v_version_items_animation_type";
  `)
}
