import { readFile } from "node:fs/promises";
import { assessBackupHeartbeat } from "@/lib/ops/backupHeartbeat";

/**
 * Has the database been backed up recently?
 *
 * The Uptime workflow polls this from outside, alongside /api/health, and opens
 * an incident when it stops answering `ok`. See lib/ops/backupHeartbeat.ts for
 * what counts as fresh and scripts/ops/para-backup-heartbeat.sh for how the
 * heartbeat is written.
 *
 * ## Why the storefront answers for the backups
 *
 * It is the only thing outside monitoring can reach. The dumps themselves are
 * in a 0700 root-only directory on the host and stay there; the heartbeat —
 * a timestamp and a size, nothing from the dump — is written to a separate
 * readable directory and mounted into this container read-only.
 *
 * ## What it says publicly
 *
 * `ok`, `stale`, `missing` or `invalid`, and a status code. Not the age, not
 * the size, not when the backup runs. This endpoint needs no credentials so
 * that monitoring needs none either, and the timing of a database backup is
 * not something to hand to anyone who asks. The detail goes to the server log,
 * where the person fixing it will look.
 */

export const dynamic = "force-dynamic";

const STATUS_FILE = process.env.BACKUP_STATUS_FILE || "/backup-status/status.json";

export async function GET() {
  let raw: string | null = null;
  try {
    // turbopackIgnore: the path is a runtime mount, not a project file, so
    // there is nothing for the build's file tracer to follow.
    raw = await readFile(/* turbopackIgnore: true */ STATUS_FILE, "utf8");
  } catch {
    raw = null;
  }

  const result = assessBackupHeartbeat(raw, Date.now());

  if (result.status !== "ok") {
    // The operator reads this; the public body says only the status.
    console.error(`[backup-health] ${JSON.stringify(result)}`);
  }

  return Response.json(
    { status: result.status },
    {
      headers: { "Cache-Control": "no-store" },
      status: result.status === "ok" ? 200 : 503,
    },
  );
}
