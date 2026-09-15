#!/usr/bin/env bash
#
# Deploy main to this host, and put the previous version back if it breaks.
#
# ## What this replaces
#
# Every deploy so far was typed by hand:
#
#   git pull && docker compose up -d --build frontend backend
#
# which has three holes, and all three were hit this month. It deploys a commit
# whether or not CI passed on it. It declares success when the containers
# *start*, not when the shop *works* — a backend that boots, binds its port and
# cannot reach its database looks identical to a healthy one. And when a deploy
# is bad there is no way back except remembering which commit came before and
# typing it again, under pressure.
#
# ## What it does instead
#
#   1. Fetch main, and stop if there is nothing new (safe to run on a timer).
#   2. Refuse a commit whose CI did not pass — read from GitHub's public API,
#      no token needed for a public repository.
#   3. Build the new images *before* touching the running ones, so a build
#      failure costs nothing.
#   4. Swap, then poll the end-to-end health probe for up to two minutes.
#   5. Healthy: done. Not healthy: check the previous commit back out, rebuild,
#      and exit non-zero so whatever ran this knows.
#
# ## What it deliberately does not do
#
# Database migrations. `prodMigrations` does not apply anything on boot in this
# deployment — measured, twice — and a migration is the one step a rollback
# cannot undo: rolling the code back leaves the schema forward. So a commit
# that adds a migration is refused here with a message saying so, and applied
# by a human who has checked the data first. That is slower on purpose.
#
# Usage:  scripts/deploy.sh            deploy origin/main if CI is green
#         scripts/deploy.sh --force    skip the CI check (an incident, not a habit)

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/para}"
BRANCH="${BRANCH:-main}"
GITHUB_REPO="${GITHUB_REPO:-Mehdionmars/para}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
HEALTH_TIMEOUT_S="${HEALTH_TIMEOUT_S:-120}"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

log() { printf '[deploy %s] %s\n' "$(date -u +%FT%TZ)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

cd "$REPO_DIR"

# Never two at once. A timer firing while a slow build is still running would
# otherwise start a second deploy over the first.
exec 9>"/tmp/para-deploy.lock"
flock -n 9 || die "another deploy is already running"

current=$(git rev-parse HEAD)
git fetch --quiet origin "$BRANCH"
target=$(git rev-parse "origin/$BRANCH")

if [ "$current" = "$target" ]; then
  log "already at ${target:0:7}, nothing to do"
  exit 0
fi

log "deploying ${current:0:7} -> ${target:0:7}"

# ---------------------------------------------------------------- CI gate
if [ "$FORCE" -eq 0 ]; then
  # Scoped to the CI workflow, by file, and nothing else.
  #
  # The first version read every check-run on the commit, and a commit carries
  # checks from every workflow that ran against it. The Uptime workflow is one
  # of them, and its paradhiver.ma job fails *correctly* while that domain is
  # down — so with CI green (Frontend: success, Backend: success) this refused
  # fd2e5ad as "CI did not pass". Left that way, an unrelated site being down
  # would have blocked every deploy for as long as it stayed down.
  #
  # This endpoint returns the CI workflow's own run for this exact commit: one
  # status, one conclusion. Two earlier bugs in this block are also why it reads
  # the way it does — `|| true` so a field that is absent cannot end the script
  # silently under `set -e`, and `[[:space:]]*` because the API pretty-prints
  # `"status": "completed"` with a space after the colon.
  runs=$(curl -fsS -m 20 -H 'Accept: application/vnd.github+json'     "https://api.github.com/repos/$GITHUB_REPO/actions/workflows/ci.yml/runs?head_sha=$target&per_page=1")     || die "could not read CI status from GitHub"

  field() { printf '%s' "$runs" | { grep -m1 -oE "\"$1\":[[:space:]]*(\"[a-z_]*\"|null|[0-9]+)" || true; } | sed -E 's/^[^:]*:[[:space:]]*//; s/"//g'; }
  total=$(field total_count)
  status=$(field status)
  conclusion=$(field conclusion)

  if [ "${total:-0}" = "0" ]; then
    log "no CI run for ${target:0:7} yet — not deploying, will pick it up next time"
    exit 0
  fi
  if [ "$status" != "completed" ]; then
    log "CI is ${status:-unknown} for ${target:0:7} — not deploying yet"
    exit 0
  fi
  [ "$conclusion" = "success" ] || die "CI concluded '${conclusion:-none}' for ${target:0:7} — refusing to deploy"
  log "CI passed for ${target:0:7}"
else
  log "--force: skipping the CI check"
fi

# --------------------------------------------------------- migration gate
new_migrations=$(git diff --name-only "$current" "$target" -- 'backend/src/migrations/*.ts' | grep -v '/index.ts$' || true)
if [ -n "$new_migrations" ]; then
  log "this commit adds database migrations:"
  printf '         %s\n' $new_migrations
  die "migrations are applied by hand, after checking the data — deploy stopped before touching anything"
fi

# ------------------------------------------------------------------ build
# `-B` moves the local branch to the commit rather than checking the commit
# out bare. A detached HEAD would work for this script and break the next
# person who types `git pull` on this server by hand, which is still how an
# incident gets handled. A tracked file edited on the server makes the checkout
# fail loudly instead of being discarded.
git checkout --quiet -B "$BRANCH" "$target"
if ! docker compose build backend frontend; then
  git checkout --quiet -B "$BRANCH" "$current"
  die "build failed — nothing was swapped, still running ${current:0:7}"
fi

# ------------------------------------------------------------------- swap
docker compose up -d backend frontend jobs-tick

# ----------------------------------------------------------- health gate
healthy() {
  local deadline=$(( $(date +%s) + HEALTH_TIMEOUT_S ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    if curl -fsS -m 5 "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then
      return 0
    fi
    sleep 3
  done
  return 1
}

if healthy; then
  log "healthy at ${target:0:7} — deploy complete"
  exit 0
fi

# --------------------------------------------------------------- rollback
log "health check did not pass within ${HEALTH_TIMEOUT_S}s — rolling back to ${current:0:7}"
docker compose logs --tail=40 backend frontend || true
git checkout --quiet -B "$BRANCH" "$current"
docker compose up -d --build backend frontend jobs-tick

if healthy; then
  die "rolled back to ${current:0:7}, which is healthy — ${target:0:7} needs fixing"
fi
die "rolled back to ${current:0:7} and it is STILL unhealthy — the fault is not the new commit; investigate now"
