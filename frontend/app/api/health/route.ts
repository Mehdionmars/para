/**
 * The one URL an outside monitor needs.
 *
 * ## Why the storefront has its own
 *
 * The backend already has /api/health, and it is the wrong thing to watch from
 * outside, because nothing outside can reach it: the CMS has no public
 * hostname by design. A monitor pointed at the storefront's home page instead
 * would learn that *some* HTML came back — which is exactly what a broken
 * deployment serving its error page also returns.
 *
 * A 200 from this route is a claim about the whole chain at once: DNS resolved,
 * Cloudflare routed, the tunnel was up, this container answered, it reached the
 * backend over the compose network, and the backend reached Postgres. That is
 * the path every visitor depends on, and it is the path that failed for days on
 * the public domain without anyone being told.
 *
 * ## What it deliberately does not say
 *
 * This endpoint is unauthenticated and public. It reports `ok` or `down` and
 * which of three layers failed — never the error text, the backend's address,
 * or a stack. A connection error carries host names and, for a database, the
 * connection string; none of that belongs in a response anyone can request.
 * "config" is a layer name and nothing more: it says the deployment is
 * misconfigured without saying which value or what it should be.
 *
 * ## Why CMS_URL is read here and not imported
 *
 * lib/dashboard/constants exports it, and throws on import when it is unset in
 * production. Importing it here would mean this route dies exactly when it has
 * something worth saying, which is what happened on the public domain: the
 * same guard, reached through proxy.ts, answered every matched route with a
 * bare 500 — this one included — so the monitor could only report "down" with
 * nothing to point at. The guard is deliberately kept (a server with no
 * backend should fail, not quietly serve an empty shop); it is this probe that
 * has to outlive it.
 *
 * ## Timing
 *
 * The upstream call is capped at 4 seconds. A backend that hangs rather than
 * failing is the more dangerous outage, and a probe that inherits the hang
 * reports it as a timeout on the monitor's side — indistinguishable from the
 * tunnel being down. Timing out here keeps the two apart.
 */

export const dynamic = "force-dynamic";

const UPSTREAM_TIMEOUT_MS = 4_000;

export async function GET() {
  const started = Date.now();
  const cmsUrl = process.env.CMS_URL?.trim();

  if (!cmsUrl) {
    // No fallback to localhost here, on purpose. Reaching a port on the
    // container itself would report "backend" and send whoever is reading
    // this looking for a backend that was never addressed in the first place.
    return Response.json(
      { status: "down", layer: "config", ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }

  try {
    const res = await fetch(`${cmsUrl}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      // The backend answered and said its own dependency is gone — almost
      // always Postgres. Distinct from "could not reach the backend at all".
      return Response.json(
        { status: "down", layer: "database", ms: Date.now() - started },
        { headers: { "Cache-Control": "no-store" }, status: 503 },
      );
    }

    return Response.json(
      { status: "ok", ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "down", layer: "backend", ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }
}
