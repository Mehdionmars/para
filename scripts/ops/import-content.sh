#!/usr/bin/env bash
# Import a content export (see export-content.sh) into THIS host's database.
# Takes a full backup first and applies everything in one transaction: it
# either all lands or nothing changes.
#
# Usage (from the repo root on the server):  scripts/ops/import-content.sh content.sql
set -euo pipefail

FILE="${1:?usage: import-content.sh content.sql}"
SERVICE="${PG_SERVICE:-postgres}"
BACKUP="pre-import-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

docker compose exec -T "$SERVICE" pg_dump -U postgres -d para_dhiver --clean --if-exists | gzip > "$BACKUP"
echo "backup: $BACKUP ($(wc -c < "$BACKUP") bytes)"

docker compose exec -T "$SERVICE" psql -U postgres -d para_dhiver -v ON_ERROR_STOP=1 < "$FILE"
echo "import done — now: docker compose restart backend frontend (clears the caches)"
echo "rollback:  gunzip -c $BACKUP | docker compose exec -T $SERVICE psql -U postgres -d para_dhiver"
