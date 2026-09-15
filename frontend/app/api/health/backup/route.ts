import { backupHealthResponse } from "@/lib/ops/backupHealthResponse";

/**
 * Has the database been backed up recently?
 *
 * The Uptime workflow polls this from outside, alongside /api/health, and opens
 * an incident when it stops answering `ok`. See lib/ops/backupHeartbeat.ts for
 * what counts as fresh and scripts/ops/para-backup-heartbeat.sh for how the
 * heartbeat is written. The off-site copy has its own route under ./offsite.
 *
 * ## Why the storefront answers for the backups
 *
 * It is the only thing outside monitoring can reach. The dumps themselves are
 * in a 0700 root-only directory on the host and stay there; the heartbeat —
 * a timestamp and a size, nothing from the dump — is written to a separate
 * readable directory and mounted into this container read-only.
 */

export const dynamic = "force-dynamic";

const STATUS_FILE = process.env.BACKUP_STATUS_FILE || "/backup-status/status.json";

export function GET() {
  return backupHealthResponse(STATUS_FILE, "backup-health");
}
