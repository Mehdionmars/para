#!/usr/bin/env bash
# Copy the backups off the server, encrypted, to Cloudflare R2.
#
# Installed at /usr/local/bin/para-backup-offsite.sh and run by systemd right
# after each verified dump and heartbeat (para-db-backup.offsite.conf).
#
# ## Why
#
# The dumps sit on the same virtual disk as the database they protect. A lost
# disk, a lost host or a bad `rm` takes both. And the product images are not
# in the database at all — they live in the `media` volume and were not backed
# up anywhere. This sends both somewhere else.
#
# ## What leaves the server
#
# Only ciphertext. Every file is encrypted with `age` to a public key before
# upload; the matching private key is NOT on this server — it is kept by the
# owner, off the machine. Cloudflare, or anyone holding the R2 credentials,
# sees file names, sizes and dates, never an order or a customer. A copy that
# could only be read with a key stored on the lost server would not be a
# backup, so the key must stay elsewhere; losing it makes every copy useless.
#
#   r2:<bucket>/db/para_dhiver-<stamp>.dump.age   every local dump not yet there
#   r2:<bucket>/media/media-<stamp>.tar.age       when the images change, and at
#                                                 least every 30 days
#
# ## Catch-up and retention
#
# Each run uploads every local dump missing from the bucket, so a night that
# failed is filled in by the next. Nothing is ever deleted from here: the R2
# credentials on this server cannot then be used to erase the history, and old
# copies are expired by a lifecycle rule on the bucket (90 days). The media
# snapshot is refreshed at least every 30 days so that rule never removes the
# only one.
#
# ## Monitoring
#
# /var/lib/para-backup/offsite.json is written only when the newest dump *and*
# the current media are both in the bucket. The storefront serves its freshness
# at /api/health/backup/offsite and the Uptime workflow alerts when it stalls.
#
# ## Restore
#
#   rclone copyto r2:<bucket>/db/<file>.dump.age ./x.dump.age   (or download it
#                                                  from the Cloudflare dashboard)
#   age -d -i para-backup-key.txt -o x.dump x.dump.age
#   pg_restore -l x.dump        # then pg_restore into an empty database
#   age -d -i para-backup-key.txt media-<stamp>.tar.age | tar -x -C <media dir>
set -euo pipefail

CONF_DIR=/etc/para-backup
ENV_FILE="$CONF_DIR/r2.env"
RECIPIENT_FILE="$CONF_DIR/age-recipient.txt"
BACKUP_DIR=/var/backups/para
MEDIA_DIR=/var/lib/docker/volumes/para-dhiver_media/_data
STATUS_FILE=/var/lib/para-backup/offsite.json
# Private: holds only a hash of the media file list, but nothing outside root
# needs it, unlike the heartbeat directory mounted into the storefront.
STATE_DIR=/var/lib/para-backup-offsite
MEDIA_REFRESH_DAYS=30

log() { echo "offsite: $*"; }
die() { echo "offsite: $*" >&2; exit 1; }

[ -r "$ENV_FILE" ] || die "$ENV_FILE not found"
set -a
# shellcheck source=/dev/null
. "$ENV_FILE"
set +a
for var in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
  [ -n "${!var:-}" ] || die "$var is empty in $ENV_FILE"
done
grep -qE '^age1[0-9a-z]+$' "$RECIPIENT_FILE" 2>/dev/null \
  || die "$RECIPIENT_FILE must hold one age public key (age1...)"

# The remote is defined entirely by environment variables: no rclone.conf with
# a second copy of the secret, and nothing that outlives this process.
export RCLONE_CONFIG=/dev/null
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
# The token is scoped to one bucket and may not list or create buckets.
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
unset R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY
REMOTE="r2:$R2_BUCKET"
RCLONE=(rclone --contimeout 30s --timeout 5m --retries 3 --low-level-retries 5)

install -d -m 0700 "$STATE_DIR"
WORK=$(mktemp -d /var/tmp/para-offsite.XXXXXX)
trap 'rm -rf "$WORK"' EXIT

# One listing of the whole bucket, not one per prefix: on the first run `db/`
# and `media/` do not exist yet, and listing a missing prefix is an error that
# would be indistinguishable from bad credentials. The bucket itself must
# exist, so a failure here really does mean it cannot be reached. It holds a
# few hundred objects at most, under the 90-day lifecycle rule.
remote_all=$("${RCLONE[@]}" lsf -R --files-only "$REMOTE") \
  || die "cannot list $REMOTE — check the credentials and the bucket name"
remote_db=$(sed -n 's#^db/##p' <<<"$remote_all")

# --- database dumps ----------------------------------------------------------

latest=""
sent=0
# Timestamped names: lexical order is chronological, the last one is newest.
for dump in $(ls -1 "$BACKUP_DIR"/*.dump 2>/dev/null | LC_ALL=C sort); do
  latest=$dump
  name="$(basename "$dump").age"
  if grep -qxF "$name" <<<"$remote_db"; then
    continue
  fi
  age -R "$RECIPIENT_FILE" -o "$WORK/$name" "$dump"
  # copyto compares the checksum R2 reports with the local file's.
  "${RCLONE[@]}" copyto "$WORK/$name" "$REMOTE/db/$name"
  rm -f "$WORK/$name"
  sent=$((sent + 1))
done
[ -n "$latest" ] || die "no dump in $BACKUP_DIR"

# Proof from the bucket itself, not from the upload's exit code.
latest_name="$(basename "$latest").age"
remote_bytes=$("${RCLONE[@]}" lsf --format s "$REMOTE/db/$latest_name" 2>/dev/null | head -n1 || true)
[ -n "$remote_bytes" ] && [ "$remote_bytes" -gt 0 ] \
  || die "$latest_name is not in the bucket after upload"
log "db: $sent uploaded, newest $latest_name ($remote_bytes bytes) is off-site"

# --- media -------------------------------------------------------------------

manifest=$(cd "$MEDIA_DIR" && find . -type f -printf '%P\t%s\t%T@\n' | LC_ALL=C sort | sha256sum | cut -d' ' -f1)
last_manifest=$(cat "$STATE_DIR/media.manifest" 2>/dev/null || true)
last_media=$(sed -n 's#^media/##p' <<<"$remote_all" | LC_ALL=C sort | tail -n1)

need_media=yes
if [ -n "$last_media" ] && [ "$manifest" = "$last_manifest" ]; then
  s=${last_media#media-}
  s=${s%.tar.age}
  taken=$(date -u -d "${s:0:4}-${s:4:2}-${s:6:2}T${s:9:2}:${s:11:2}:${s:13:2}Z" +%s 2>/dev/null || echo 0)
  if [ $(( $(date -u +%s) - taken )) -lt $(( MEDIA_REFRESH_DAYS * 86400 )) ]; then
    need_media=no
  fi
fi

if [ "$need_media" = yes ]; then
  name="media-$(date -u +%Y%m%dT%H%M%SZ).tar.age"
  tar -C "$MEDIA_DIR" -cf - . | age -R "$RECIPIENT_FILE" -o "$WORK/$name"
  "${RCLONE[@]}" copyto "$WORK/$name" "$REMOTE/media/$name"
  printf '%s\n' "$manifest" > "$STATE_DIR/media.manifest"
  log "media: uploaded $name ($(stat -c %s "$WORK/$name") bytes)"
else
  log "media: unchanged since $last_media"
fi

# --- heartbeat ---------------------------------------------------------------

# Dated by the dump that is now off-site, so freshness means "last night's
# backup left the building", not merely "this script ran".
tmp="$STATUS_FILE.tmp"
printf '{"lastSuccessEpoch":%s,"bytes":%s}\n' "$(stat -c %Y "$latest")" "$remote_bytes" > "$tmp"
chmod 0644 "$tmp"
mv "$tmp" "$STATUS_FILE"
log "heartbeat written"
