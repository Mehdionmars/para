import { backupHealthResponse } from "@/lib/ops/backupHealthResponse";

/**
 * Has the newest backup left the server?
 *
 * `ok` only when the latest verified dump and the current product images are
 * both in the R2 bucket, encrypted, within the last 26 hours. The local backup
 * can be perfectly healthy while this fails — that is the point: a copy on the
 * same disk does not survive the disk. Written by
 * scripts/ops/para-backup-offsite.sh, polled by the Uptime workflow.
 */

export const dynamic = "force-dynamic";

const STATUS_FILE = process.env.BACKUP_OFFSITE_STATUS_FILE || "/backup-status/offsite.json";

export function GET() {
  return backupHealthResponse(STATUS_FILE, "backup-offsite-health");
}
