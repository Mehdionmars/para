import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Storage for the mobile quick-category strip (Navigation global).
 *
 * Three columns on `navigation` for the group's own switches, plus one table
 * for the chips — the shape Payload's Postgres adapter generates for an array
 * field nested in a group, mirroring the existing `navigation_items`.
 *
 * The versions table gets the same columns: Navigation has drafts enabled
 * (`versions.max: 20`), so a strip edited and saved has to survive a rollback
 * to an earlier version like every other navigation field. Omitting `_navigation_v`
 * would silently drop the strip whenever an editor restored a version.
 *
 * `enabled` defaults to false. A migration must never turn a new piece of UI
 * on for a live shop by itself — the strip appears when someone ticks the box
 * in the Storefront Builder, not when this runs.
 */

/**
 * The versions table prefixes every field column with `version_`
 * (`version__status`, `version_updated_at`, …) while the published table does
 * not. Payload derives both names itself, so the migration has to match them
 * exactly — a column named without the prefix simply is not the column the
 * adapter selects, and every read of the global fails with a missing-column
 * error rather than anything that points at the cause.
 *
 * Note also that `dbName` on the group shortens the *table* names Payload
 * generates for the nested array, not these column names.
 */
const stripColumns = (prefix: string) => sql`
  ADD COLUMN IF NOT EXISTS "${sql.raw(prefix)}cat_strip_enabled" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "${sql.raw(prefix)}cat_strip_show_all_chip" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "${sql.raw(prefix)}cat_strip_all_chip_label" varchar DEFAULT 'Tout'
`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "navigation" ${stripColumns('')};`)
  await db.execute(sql`ALTER TABLE "_navigation_v" ${stripColumns('version_')};`)

  // The versions table prefixes field columns with `version_`; the unprefixed
  // names are not columns Payload ever selects, so they are dropped rather
  // than left behind on a database that ran an earlier draft of this file.
  await db.execute(sql`
    ALTER TABLE "_navigation_v"
      DROP COLUMN IF EXISTS "cat_strip_enabled",
      DROP COLUMN IF EXISTS "cat_strip_show_all_chip",
      DROP COLUMN IF EXISTS "cat_strip_all_chip_label";
  `)

  // The published chips. `_parent_id` and `_order` are the adapter's own
  // conventions for a nested array — same as navigation_items — so Payload
  // reads and writes this table without any custom mapping.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "navigation_cat_strip_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "visible" boolean DEFAULT true,
      "type" "enum_navigation_items_type" DEFAULT 'custom',
      "category_id" integer,
      "brand_id" integer,
      "collection_route" "enum_navigation_items_collection_route",
      "page_route" "enum_navigation_items_page_route",
      "custom_url" varchar
    );
  `)

  // ON DELETE set null on the relationships, not cascade: deleting a brand
  // must not silently delete the chip pointing at it. The chip survives with
  // a null target and resolveLiveNavHref falls back to the catalogue — a
  // visible, fixable state rather than a link that vanishes from the strip
  // with no trace of why.
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "navigation_cat_strip_items"
        ADD CONSTRAINT "nav_strip_items_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "navigation"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "navigation_cat_strip_items"
        ADD CONSTRAINT "nav_strip_items_category_fk"
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "navigation_cat_strip_items"
        ADD CONSTRAINT "nav_strip_items_brand_fk"
        FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "nav_strip_items_order_idx"
      ON "navigation_cat_strip_items" ("_order");
    CREATE INDEX IF NOT EXISTS "nav_strip_items_parent_id_idx"
      ON "navigation_cat_strip_items" ("_parent_id");
  `)

  // Draft/version copy of the chips, keyed to `_navigation_v` instead.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_navigation_v_version_cat_strip_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "visible" boolean DEFAULT true,
      "type" "enum_navigation_items_type" DEFAULT 'custom',
      "category_id" integer,
      "brand_id" integer,
      "collection_route" "enum_navigation_items_collection_route",
      "page_route" "enum_navigation_items_page_route",
      "custom_url" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_navigation_v_version_cat_strip_items"
        ADD CONSTRAINT "nav_v_strip_items_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "_navigation_v_version_cat_strip_items"
        ADD CONSTRAINT "nav_v_strip_items_category_fk"
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "_navigation_v_version_cat_strip_items"
        ADD CONSTRAINT "nav_v_strip_items_brand_fk"
        FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "nav_v_strip_items_order_idx"
      ON "_navigation_v_version_cat_strip_items" ("_order");
    CREATE INDEX IF NOT EXISTS "nav_v_strip_items_parent_id_idx"
      ON "_navigation_v_version_cat_strip_items" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "navigation_cat_strip_items";`)
  await db.execute(sql`DROP TABLE IF EXISTS "_navigation_v_version_cat_strip_items";`)
  await db.execute(sql`
    ALTER TABLE "navigation"
      DROP COLUMN IF EXISTS "cat_strip_enabled",
      DROP COLUMN IF EXISTS "cat_strip_show_all_chip",
      DROP COLUMN IF EXISTS "cat_strip_all_chip_label";
    ALTER TABLE "_navigation_v"
      DROP COLUMN IF EXISTS "version_cat_strip_enabled",
      DROP COLUMN IF EXISTS "version_cat_strip_show_all_chip",
      DROP COLUMN IF EXISTS "version_cat_strip_all_chip_label";
  `)
}
