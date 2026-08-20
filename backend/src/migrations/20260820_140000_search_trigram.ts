import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Predictive search support, in Postgres rather than a new search service.
//
// pg_trgm gives fuzzy matching ("uriaje" -> "Uriage") and, crucially, makes
// leading-wildcard ILIKE '%term%' fast — a plain B-tree index can't serve
// those, and the search has to answer from the first keystroke.
//
// unaccent lets "creme" match "Crème". It is declared IMMUTABLE-wrapped
// below because the stock unaccent() is only STABLE, which Postgres refuses
// to index directly.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS unaccent;
  `)

  // A wrapper marked IMMUTABLE so it can appear in an index expression.
  // Safe here: the dictionary is fixed for the life of the database.
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      PARALLEL SAFE
      STRICT
    AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS products_name_trgm_idx
      ON products USING gin (public.immutable_unaccent(lower(name)) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS products_sku_trgm_idx
      ON products USING gin (lower(coalesce(sku, '')) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS brands_name_trgm_idx
      ON brands USING gin (public.immutable_unaccent(lower(name)) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS categories_name_trgm_idx
      ON categories USING gin (public.immutable_unaccent(lower(name)) gin_trgm_ops);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS products_name_trgm_idx;
    DROP INDEX IF EXISTS products_sku_trgm_idx;
    DROP INDEX IF EXISTS brands_name_trgm_idx;
    DROP INDEX IF EXISTS categories_name_trgm_idx;
    DROP FUNCTION IF EXISTS public.immutable_unaccent(text);
  `)
  // The extensions themselves are left installed: other work may rely on them
  // and dropping them is not reversible in a useful sense.
}
