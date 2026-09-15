/**
 * Is the database being backed up?
 *
 * A pure function of the heartbeat file's contents and the current time, so
 * every way it can answer "no" is testable without waiting a day or touching a
 * real backup. The route in app/api/health/backup reads the file and asks this.
 *
 * The heartbeat is written only after a dump that was produced *and* verified
 * restorable (see scripts/ops/para-backup-heartbeat.sh). So "fresh heartbeat"
 * means "a good backup happened recently", and every failure mode — a failing
 * dump, a corrupt one, a disabled timer, a renamed container, a machine that
 * was off — shows up the same way: the heartbeat stops moving.
 */

/**
 * 26 hours.
 *
 * The timer is `OnCalendar=daily` with `RandomizedDelaySec=30m`, so two good
 * runs land between 23h30 and 24h30 apart. 26 hours clears the widest normal
 * gap with margin, and a single missed night trips it about two hours after
 * the window — soon enough to fix before a second night is lost, late enough
 * that a run delayed by a slow dump does not page anyone.
 */
export const MAX_AGE_HOURS = 26;

/**
 * A verified custom-format dump of this database is roughly 740 KB. Anything
 * under 10 KB is not a backup of it, whatever the exit code said — this is the
 * guard for a dump that "succeeded" against an empty or wrong database.
 */
export const MIN_BYTES = 10_000;

/** A heartbeat stamped in the future cannot be trusted to be fresh. An hour of
 * tolerance absorbs ordinary clock drift between the host and the container. */
const FUTURE_TOLERANCE_MS = 60 * 60 * 1000;

export type BackupAssessment =
  | { status: "ok"; ageHours: number; bytes: number }
  | { status: "stale"; ageHours: number; bytes: number }
  | { status: "missing" }
  | { status: "invalid"; reason: string };

export function assessBackupHeartbeat(raw: string | null, nowMs: number): BackupAssessment {
  // No file at all: the heartbeat was never installed, never seeded, or the
  // mount is missing. Not "ok" — silence is exactly what this exists to catch.
  if (raw === null) return { status: "missing" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { reason: "unparseable", status: "invalid" };
  }

  const { lastSuccessEpoch, bytes } = (parsed ?? {}) as { lastSuccessEpoch?: unknown; bytes?: unknown };
  if (typeof lastSuccessEpoch !== "number" || !Number.isFinite(lastSuccessEpoch)) {
    return { reason: "no timestamp", status: "invalid" };
  }
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return { reason: "no size", status: "invalid" };
  }

  const lastMs = lastSuccessEpoch * 1000;
  if (lastMs > nowMs + FUTURE_TOLERANCE_MS) {
    // A clock set wrong would otherwise report a months-dead backup as fresh
    // for as long as the bad timestamp stays ahead of real time.
    return { reason: "timestamp in the future", status: "invalid" };
  }
  if (bytes < MIN_BYTES) {
    return { reason: `dump too small (${bytes} bytes)`, status: "invalid" };
  }

  const ageHours = Math.max(0, (nowMs - lastMs) / 3_600_000);
  const rounded = Math.round(ageHours * 10) / 10;
  return ageHours > MAX_AGE_HOURS
    ? { ageHours: rounded, bytes, status: "stale" }
    : { ageHours: rounded, bytes, status: "ok" };
}
