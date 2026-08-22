import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Turns on per-variant pricing where the data already assumes it.
 *
 * `variant_pricing_mode` defaults to `same-price`, and the catalogue importer
 * (scripts/seed-catalogue.ts) wrote variant rows *with their own prices*
 * without ever setting it. The result was a product whose 50 ml and 100 ml
 * rows held 200 and 300 in the database while the storefront showed one price
 * for both and never moved when the shopper switched option — the prices were
 * stored, hidden from the admin (the field is only surfaced in per-variant
 * mode) and silently discarded at render time.
 *
 * Only products whose variant rows genuinely *disagree* on price are touched.
 * A product whose rows all carry the same amount, or no amount at all, is
 * legitimately same-price and is left exactly as it is — this must not flip a
 * range of shades that all cost the same into a per-variant product.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const result = await db.execute(sql`
    UPDATE "products" p
       SET "variant_pricing_mode" = 'per-variant', "updated_at" = now()
     WHERE p."has_variants" = true
       AND COALESCE(p."variant_pricing_mode", 'same-price') = 'same-price'
       AND (
         SELECT COUNT(DISTINCT v."price")
           FROM "products_variants" v
          WHERE v."_parent_id" = p."id"
            AND v."price" IS NOT NULL
       ) > 1
    RETURNING p."id";
  `)

  const rows = (result as unknown as { rows?: unknown[] })?.rows ?? []
  payload?.logger?.info(`Tarification par variante activée sur ${rows.length} produit(s).`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Not reversible in a meaningful way: which products were on 'same-price'
  // before is not recorded, and putting every per-variant product back would
  // re-hide prices an editor may have set deliberately since. Deliberately a
  // no-op rather than a destructive guess.
}
