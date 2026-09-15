import { readFile } from "node:fs/promises";

import { assessBackupHeartbeat } from "@/lib/ops/backupHeartbeat";

/**
 * The HTTP answer for one backup heartbeat file, shared by the local backup
 * route and the off-site copy route.
 *
 * Publicly: `ok`, `stale`, `missing` or `invalid`, and 200 or 503. Not the age,
 * not the size, not when the backup runs — the endpoint needs no credentials so
 * that monitoring needs none either, and the timing of a database backup is not
 * something to hand to anyone who asks. The detail goes to the server log,
 * tagged with `label`, where the person fixing it will look.
 */
export async function backupHealthResponse(file: string, label: string): Promise<Response> {
  let raw: string | null = null;
  try {
    // turbopackIgnore: the path is a runtime mount, not a project file, so
    // there is nothing for the build's file tracer to follow.
    raw = await readFile(/* turbopackIgnore: true */ file, "utf8");
  } catch {
    raw = null;
  }

  const result = assessBackupHeartbeat(raw, Date.now());

  if (result.status !== "ok") {
    console.error(`[${label}] ${JSON.stringify(result)}`);
  }

  return Response.json(
    { status: result.status },
    {
      headers: { "Cache-Control": "no-store" },
      status: result.status === "ok" ? 200 : 503,
    },
  );
}
