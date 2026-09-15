#!/usr/bin/env bash
#
# Record that a database backup just succeeded, somewhere the shop can read it.
#
# ## Why this exists
#
# The nightly backup works — para-db-backup.timer dumps, verifies the archive
# with `pg_restore -l`, and writes it atomically. What nothing did was notice
# when it *stopped*. A backup system is only as good as the morning somebody
# learns it quietly failed three weeks ago.
#
# "Stopped" is wider than "failed". A failing script is one case. A timer
# someone disabled, a postgres container renamed out from under the hardcoded
# CONTAINER= line, a server that was off at midnight — none of those run the
# backup at all, so none of them can report their own failure. The only check
# that covers all of them is freshness: when did the last *good* one happen?
#
# ## How it is wired
#
# Installed as an ExecStartPost drop-in on para-db-backup.service. For a
# Type=oneshot unit systemd runs ExecStartPost only if ExecStart succeeded, so
# this runs after a dump that was written *and* verified, and never after one
# that was not. No success, no heartbeat — and a heartbeat that goes stale is
# the alert.
#
# ## What it deliberately writes
#
# A timestamp and a size. Not the path, not a file name, nothing from the dump.
# The dumps hold every order and customer record and stay in a 0700 root-only
# directory; this file lives beside them in a separate 0755 directory precisely
# so the storefront container can read *it* without anyone widening access to
# *them*.
#
# It also runs standalone, which is how the first heartbeat is seeded from the
# most recent existing dump at install time.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/para}"
STATUS_DIR="${STATUS_DIR:-/var/lib/para-backup}"
STATUS_FILE="$STATUS_DIR/status.json"

latest=$(ls -1t "$BACKUP_DIR"/*.dump 2>/dev/null | head -n1 || true)
if [ -z "$latest" ]; then
  echo "heartbeat: no dump found in $BACKUP_DIR — not writing a heartbeat" >&2
  exit 1
fi

mtime=$(stat -c %Y "$latest")
bytes=$(stat -c %s "$latest")

install -d -m 0755 "$STATUS_DIR"

# Written to a temporary file and renamed, so a reader never sees half a file.
tmp="$STATUS_FILE.tmp"
printf '{"lastSuccessEpoch":%s,"bytes":%s}\n' "$mtime" "$bytes" > "$tmp"
chmod 0644 "$tmp"
mv "$tmp" "$STATUS_FILE"

echo "heartbeat: last good backup $(date -u -d "@$mtime" +%FT%TZ), $bytes bytes"
