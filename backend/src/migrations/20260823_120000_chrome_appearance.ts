import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-surface colour overrides for the top bar, the header and the footer.
 *
 * Every column is nullable and every one stays NULL: an operator who has
 * never opened the appearance panel must get byte-for-byte the storefront
 * they had yesterday. The rendering side only emits a CSS variable for a
 * column that actually holds a value, and each component keeps its current
 * colour as the `var(--chrome-…, fallback)`. Nothing is backfilled, and no
 * default is written — a default here would pin the palette to whatever it
 * happened to be on the day this shipped.
 */
const COLUMNS: [string, string][] = [
  ['top_bar_appearance_background_color', 'varchar'],
  ['top_bar_appearance_text_color', 'varchar'],
  ['top_bar_appearance_link_color', 'varchar'],
  ['top_bar_appearance_hover_color', 'varchar'],
  ['top_bar_appearance_opacity', 'numeric'],

  ['header_appearance_background_color', 'varchar'],
  ['header_appearance_text_color', 'varchar'],
  ['header_appearance_link_color', 'varchar'],
  ['header_appearance_hover_color', 'varchar'],
  ['header_appearance_icon_color', 'varchar'],
  ['header_appearance_border_color', 'varchar'],

  ['footer_appearance_background_color', 'varchar'],
  ['footer_appearance_text_color', 'varchar'],
  ['footer_appearance_heading_color', 'varchar'],
  ['footer_appearance_link_color', 'varchar'],
  ['footer_appearance_hover_color', 'varchar'],
  ['footer_appearance_icon_color', 'varchar'],
  ['footer_appearance_border_color', 'varchar'],
]

/** The published table and its drafts/versions twin, which Payload keeps in
 * lockstep — a column missing from one makes saving a draft fail. */
const TABLES: [string, string][] = [
  ['site_chrome', ''],
  ['_site_chrome_v', 'version_'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [table, prefix] of TABLES) {
    const adds = COLUMNS.map(([col, type]) => `ADD COLUMN IF NOT EXISTS "${prefix}${col}" ${type}`).join(',\n      ')
    await db.execute(sql.raw(`ALTER TABLE "${table}"\n      ${adds};`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [table, prefix] of TABLES) {
    const drops = COLUMNS.map(([col]) => `DROP COLUMN IF EXISTS "${prefix}${col}"`).join(',\n      ')
    await db.execute(sql.raw(`ALTER TABLE "${table}"\n      ${drops};`))
  }
}
