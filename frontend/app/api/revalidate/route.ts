import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Cache purge endpoint, called by the CMS when content is saved.
 *
 * Shared-secret authenticated: this is reachable from the public internet and
 * an unauthenticated purge endpoint is a trivial way to force every request
 * back to origin. When REVALIDATE_SECRET is unset the route refuses outright
 * rather than defaulting to open — the caches simply expire on their own
 * timer, which is the safe degradation.
 */
const ALLOWED_TAGS = new Set(["navigation", "site-chrome", "theme", "home"]);

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Revalidation non configurée." }, { status: 503 });
  }

  // Header rather than a query parameter: a secret in a URL ends up in access
  // logs and referrers.
  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let tags: unknown;
  try {
    tags = (await request.json())?.tags;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const requested = (Array.isArray(tags) ? tags : [tags]).filter(
    (t): t is string => typeof t === "string" && ALLOWED_TAGS.has(t),
  );

  if (requested.length === 0) {
    return NextResponse.json({ error: "Aucun tag valide." }, { status: 400 });
  }

  // Next 16 requires a cacheLife profile as the second argument. `{ expire: 0 }`
  // is the "drop it now" case: this route is a route handler, not a Server
  // Action, so `updateTag` (read-your-own-writes) isn't available here.
  for (const tag of requested) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: requested });
}
