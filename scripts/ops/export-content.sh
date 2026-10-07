#!/usr/bin/env bash
# Export the storefront CONTENT of the local database as one importable SQL file.
#
# Content only, on purpose: products, categories, media, home, navigation,
# site chrome, theme, catalogue/collections pages, services, stores. Never
# users, orders, payments, coupons, suppliers, sessions or logs — the target
# keeps its own accounts and transactions. Media rows are Cloudinary URLs, so
# no image files need moving.
#
# The target schema must already be at the same migration level as this one.
#
# The version tables of the drafted globals (_home_v…, _navigation_v…,
# _site_chrome_v…, _theme_v…) travel too. The admin opens a drafted global on
# its latest version, not on the published row: leave them behind and the
# Storefront Builder shows the target's old draft, and the next publish puts
# that old content back over the import.
#
# Usage:  scripts/ops/export-content.sh [out.sql]
#         then on the target:  scripts/ops/import-content.sh out.sql
set -euo pipefail

CONTAINER="${PG_CONTAINER:-para-dhiver-postgres-1}"
OUT="${1:-content.sql}"
ALLOW='^(media|categories|brands|products(_.*)?|home(_.*)?|navigation(_.*)?|site_chrome(_.*)?|theme|catalogue_page(_.*)?|collections_page(_.*)?|services(_.*)?|stores(_.*)?|instagram_posts|_(home|navigation|site_chrome|theme)_v(_.*)?)$'

tables=$(docker exec -i "$CONTAINER" psql -U postgres -d para_dhiver -At \
  -c "select tablename from pg_tables where schemaname='public' order by 1" | grep -E "$ALLOW")

{
  echo "-- Para d'Hiver content export, $(date -u +%FT%TZ)"
  echo "BEGIN;"
  echo "SET session_replication_role = replica;"
  for t in $tables; do echo "DELETE FROM \"$t\";"; done
} > "$OUT"

args=(); for t in $tables; do args+=(-t "public.\"$t\""); done
docker exec "$CONTAINER" pg_dump -U postgres -d para_dhiver --data-only --no-owner "${args[@]}" \
  | grep -v -E '^(SET (statement_timeout|lock_timeout|idle_in_transaction_session_timeout|transaction_timeout|client_encoding|standard_conforming_strings|xmloption|client_min_messages|row_security)|SELECT pg_catalog\.set_config)' >> "$OUT"
echo "COMMIT;" >> "$OUT"

echo "tables: $(echo "$tables" | wc -w), file: $OUT ($(wc -c < "$OUT") bytes)"
