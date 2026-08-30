import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Schema for four field additions that shipped in the config without a
 * migration, and so broke every read of the globals they belong to:
 *
 *   Navigation  catStrip.items.image      (the chip thumbnails)
 *   Home        promotionsGrid.eyebrow
 *               brandsFeaturedCopy.*      (header above "Marques a l'honneur")
 *               servicesTeaserCopy.*      (header above the services cards)
 *   SiteChrome  promoModal.*              (the seasonal coupon pop-up)
 *
 * A missing column is not a soft failure here: the adapter selects every
 * configured field by name, so one absent column makes the *whole* global
 * throw — the storefront header fell back to its snapshot and the admin
 * returned 500. That is why this is one migration rather than four: they
 * were introduced together, and any subset still leaves a global unreadable.
 *
 * `featuredPromo` needed nothing. It is a value in `home_sections.key`,
 * which is a varchar rather than a Postgres enum, so a new section key is
 * data and not schema.
 *
 * Versions tables mirror every column: all three globals have drafts, and a
 * column missing from `_*_v` reappears as a failure the moment an editor
 * restores an older version. There the field columns carry a `version_`
 * prefix, while nested-array tables keep the plain field names and put
 * `version` in the *table* name instead — Payload derives both itself, so
 * these have to match exactly.
 */

/** Group columns, for the published table (prefix '') and versions ('version_'). */
const homeCopyColumns = (p: string) => sql`
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promotions_grid_eyebrow" varchar DEFAULT 'Promotions',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}brands_featured_copy_eyebrow" varchar DEFAULT 'Nos partenaires',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}brands_featured_copy_title" varchar DEFAULT 'Marques a l''honneur',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}services_teaser_copy_eyebrow" varchar DEFAULT 'Accompagnement',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}services_teaser_copy_title" varchar DEFAULT 'Nos services',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}services_teaser_copy_subtitle" varchar DEFAULT 'Nos pharmaciens vous accompagnent, en ligne comme en institut.'
`

/**
 * `enabled` defaults to false and `code` stays null: a migration must never
 * switch a pop-up on for a live shop by itself. It appears once someone fills
 * it in and ticks the box.
 */
const promoModalColumns = (p: string) => sql`
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_enabled" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_badge" varchar DEFAULT 'Offre de saison',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_expiry_label" varchar,
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_title" varchar DEFAULT 'Pense pour la saison',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_subtitle" varchar DEFAULT '25% sur votre commande',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_description" varchar,
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_code" varchar,
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_cta_label" varchar DEFAULT 'Copier le code',
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_image_id" integer,
  ADD COLUMN IF NOT EXISTS "${sql.raw(p)}promo_modal_delay_seconds" numeric DEFAULT 6
`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ---- Navigation: chip thumbnails ---------------------------------------
  // ON DELETE set null, like the category and brand relationships beside it:
  // deleting a media file must leave the chip in place without its image,
  // never delete the chip.
  await db.execute(sql`
    ALTER TABLE "navigation_cat_strip_items" ADD COLUMN IF NOT EXISTS "image_id" integer;
    ALTER TABLE "_navigation_v_version_cat_strip_items" ADD COLUMN IF NOT EXISTS "image_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "navigation_cat_strip_items"
        ADD CONSTRAINT "nav_strip_items_image_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "_navigation_v_version_cat_strip_items"
        ADD CONSTRAINT "nav_v_strip_items_image_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "nav_strip_items_image_idx"
      ON "navigation_cat_strip_items" ("image_id");
    CREATE INDEX IF NOT EXISTS "nav_v_strip_items_image_idx"
      ON "_navigation_v_version_cat_strip_items" ("image_id");
  `)

  // ---- Home: section headers ---------------------------------------------
  await db.execute(sql`ALTER TABLE "home" ${homeCopyColumns('')};`)
  await db.execute(sql`ALTER TABLE "_home_v" ${homeCopyColumns('version_')};`)

  // ---- SiteChrome: seasonal coupon pop-up --------------------------------
  await db.execute(sql`ALTER TABLE "site_chrome" ${promoModalColumns('')};`)
  await db.execute(sql`ALTER TABLE "_site_chrome_v" ${promoModalColumns('version_')};`)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "site_chrome"
        ADD CONSTRAINT "site_chrome_promo_modal_image_id_media_id_fk"
        FOREIGN KEY ("promo_modal_image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "_site_chrome_v"
        ADD CONSTRAINT "site_chrome_v_promo_modal_image_id_media_id_fk"
        FOREIGN KEY ("version_promo_modal_image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_chrome_promo_modal_image_idx"
      ON "site_chrome" ("promo_modal_image_id");
    CREATE INDEX IF NOT EXISTS "site_chrome_v_promo_modal_image_idx"
      ON "_site_chrome_v" ("version_promo_modal_image_id");
  `)

  // The conditions list. Same shape the adapter generates for every other
  // array nested in a group here (cf. site_chrome_top_bar_messages): a varchar
  // primary key on the published table, a serial plus `_uuid` on the version
  // one, and `_order` / `_parent_id` for ordering and ownership. Required
  // fields are nullable on the version side, as they are for every other
  // draft row — a half-filled draft has to be saveable.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "site_chrome_promo_modal_conditions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_site_chrome_v_version_promo_modal_conditions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "text" varchar,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "site_chrome_promo_modal_conditions"
        ADD CONSTRAINT "site_chrome_promo_modal_conditions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "site_chrome"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "_site_chrome_v_version_promo_modal_conditions"
        ADD CONSTRAINT "site_chrome_v_promo_modal_conditions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "_site_chrome_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_chrome_promo_modal_conditions_order_idx"
      ON "site_chrome_promo_modal_conditions" ("_order");
    CREATE INDEX IF NOT EXISTS "site_chrome_promo_modal_conditions_parent_idx"
      ON "site_chrome_promo_modal_conditions" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_chrome_v_promo_modal_conditions_order_idx"
      ON "_site_chrome_v_version_promo_modal_conditions" ("_order");
    CREATE INDEX IF NOT EXISTS "site_chrome_v_promo_modal_conditions_parent_idx"
      ON "_site_chrome_v_version_promo_modal_conditions" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "site_chrome_promo_modal_conditions";
    DROP TABLE IF EXISTS "_site_chrome_v_version_promo_modal_conditions";
  `)

  await db.execute(sql`
    ALTER TABLE "navigation_cat_strip_items" DROP COLUMN IF EXISTS "image_id";
    ALTER TABLE "_navigation_v_version_cat_strip_items" DROP COLUMN IF EXISTS "image_id";
  `)

  await db.execute(sql`
    ALTER TABLE "home"
      DROP COLUMN IF EXISTS "promotions_grid_eyebrow",
      DROP COLUMN IF EXISTS "brands_featured_copy_eyebrow",
      DROP COLUMN IF EXISTS "brands_featured_copy_title",
      DROP COLUMN IF EXISTS "services_teaser_copy_eyebrow",
      DROP COLUMN IF EXISTS "services_teaser_copy_title",
      DROP COLUMN IF EXISTS "services_teaser_copy_subtitle";
    ALTER TABLE "_home_v"
      DROP COLUMN IF EXISTS "version_promotions_grid_eyebrow",
      DROP COLUMN IF EXISTS "version_brands_featured_copy_eyebrow",
      DROP COLUMN IF EXISTS "version_brands_featured_copy_title",
      DROP COLUMN IF EXISTS "version_services_teaser_copy_eyebrow",
      DROP COLUMN IF EXISTS "version_services_teaser_copy_title",
      DROP COLUMN IF EXISTS "version_services_teaser_copy_subtitle";
  `)

  await db.execute(sql`
    ALTER TABLE "site_chrome"
      DROP COLUMN IF EXISTS "promo_modal_enabled",
      DROP COLUMN IF EXISTS "promo_modal_badge",
      DROP COLUMN IF EXISTS "promo_modal_expiry_label",
      DROP COLUMN IF EXISTS "promo_modal_title",
      DROP COLUMN IF EXISTS "promo_modal_subtitle",
      DROP COLUMN IF EXISTS "promo_modal_description",
      DROP COLUMN IF EXISTS "promo_modal_code",
      DROP COLUMN IF EXISTS "promo_modal_cta_label",
      DROP COLUMN IF EXISTS "promo_modal_image_id",
      DROP COLUMN IF EXISTS "promo_modal_delay_seconds";
    ALTER TABLE "_site_chrome_v"
      DROP COLUMN IF EXISTS "version_promo_modal_enabled",
      DROP COLUMN IF EXISTS "version_promo_modal_badge",
      DROP COLUMN IF EXISTS "version_promo_modal_expiry_label",
      DROP COLUMN IF EXISTS "version_promo_modal_title",
      DROP COLUMN IF EXISTS "version_promo_modal_subtitle",
      DROP COLUMN IF EXISTS "version_promo_modal_description",
      DROP COLUMN IF EXISTS "version_promo_modal_code",
      DROP COLUMN IF EXISTS "version_promo_modal_cta_label",
      DROP COLUMN IF EXISTS "version_promo_modal_image_id",
      DROP COLUMN IF EXISTS "version_promo_modal_delay_seconds";
  `)
}
