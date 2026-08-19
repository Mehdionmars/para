import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Navigation links: per-link opacity + border colour, and the full
// appearance/animation/badge set on mega-menu column links.
//
// Four tables, because Payload's drafts feature mirrors every navigation
// table into a `_navigation_v_version_*` twin. Missing a twin doesn't fail
// loudly — it fails on the next publish, when the version row can't carry the
// column the live row has. Both sides are therefore always changed together.
//
// Every column is nullable with no default on purpose: an unset field emits
// no CSS variable at all, so the existing navigation renders byte-identically
// until an editor actually sets something.

const ITEM_TABLES = ['navigation_items', '_navigation_v_version_items'] as const
const MEGA_LINK_TABLES = [
  'navigation_items_mega_menu_columns_links',
  '_navigation_v_version_items_mega_menu_columns_links',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ITEM_TABLES) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_opacity" numeric;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_border_color" varchar;
    `)
  }

  // Mega-menu links gain the same vocabulary as top-level items so a link
  // reads the same wherever it appears.
  for (const table of MEGA_LINK_TABLES) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "badge_label" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "badge_background_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "badge_text_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_hover_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_active_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_background_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_border_color" varchar;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "appearance_opacity" numeric;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "animation_enabled" boolean DEFAULT false;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "animation_duration" numeric DEFAULT 2;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "animation_delay" numeric DEFAULT 0;
      ALTER TABLE ${sql.raw(`"${table}"`)} ADD COLUMN IF NOT EXISTS "animation_iteration_count" varchar DEFAULT 'infinite';
    `)
  }

  // The font-weight and animation-type enums already exist for top-level
  // items; the mega-link columns reuse them rather than declaring a parallel
  // pair that could drift apart.
  for (const table of MEGA_LINK_TABLES) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)}
        ADD COLUMN IF NOT EXISTS "appearance_font_weight" "public"."enum_navigation_items_appearance_font_weight";
      ALTER TABLE ${sql.raw(`"${table}"`)}
        ADD COLUMN IF NOT EXISTS "animation_type" "public"."enum_navigation_items_animation_type";
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of ITEM_TABLES) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_opacity";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_border_color";
    `)
  }

  for (const table of MEGA_LINK_TABLES) {
    await db.execute(sql`
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "badge_label";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "badge_background_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "badge_text_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_hover_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_active_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_background_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_border_color";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_opacity";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "appearance_font_weight";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "animation_enabled";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "animation_type";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "animation_duration";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "animation_delay";
      ALTER TABLE ${sql.raw(`"${table}"`)} DROP COLUMN IF EXISTS "animation_iteration_count";
    `)
  }
}
