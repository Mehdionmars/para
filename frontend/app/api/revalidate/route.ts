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
/**
 * Every tag the storefront actually attaches to a cached fetch.
 *
 * This is an allowlist, so a tag missing from it is not ignored — the whole
 * request is refused with a 400, and the cache it names never gets purged.
 * `payment-settings` was in exactly that position: the CMS asked for it on
 * every save of the payment global, and the server log answered
 * "Purge du cache storefront refusée (HTTP 400) pour payment-settings" each
 * time, so a corrected RIB or a newly enabled transfer sat behind a stale
 * cache until it expired on its own.
 *
 * `stores`, `services` and `collections-page` are here for the same reason,
 * ahead of the hooks that now request them: the list has to be a superset of
 * what any caller might legitimately ask for, or adding a hook on the CMS side
 * silently produces the same 400.
 *
 * Kept as an explicit list rather than "anything the client sends" because
 * this endpoint is reachable from the public internet: revalidateTag on an
 * arbitrary string is a free way to force every request back to origin.
 */
const ALLOWED_TAGS = new Set([
  "collections-page",
  "home",
  "navigation",
  "payment-settings",
  "services",
  "site-chrome",
  "stores",
  "theme",
]);

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
