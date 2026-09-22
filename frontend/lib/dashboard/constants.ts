// Kept separate from payload.ts (which imports next/headers) so the routing
// constants can be used without pulling server-only code into the Edge bundle.
//
// That separation was not enough on its own. This module also *throws* when
// CMS_URL is missing, and proxy.ts imported SESSION_COOKIE and PREVIEW_PREFIX
// from here — so the guard below ran inside the middleware and took every
// matched route down with it, /api/health included. Those two names now live
// in ./routing, which reads no environment and cannot fail, and are only
// re-exported here. Read the note at the top of that file before moving
// anything that touches process.env into it.

/**
 * Base URL of the Payload backend.
 *
 * Every storefront read goes through this — products, catalogue, globals,
 * the dashboard proxy. Falling back to localhost in production is therefore
 * the worst available default: the app boots, passes a health check, and
 * every page renders empty because the fetches resolve to a port with
 * nothing behind it. That failure surfaces as "the site is broken" long
 * after the deploy that caused it, so it is refused here instead.
 *
 * The build phase is exempt: `next build` evaluates this module while
 * collecting pages, and a pipeline that injects environment at runtime
 * rather than build time is a legitimate setup that must not be broken by a
 * boot-time check.
 *
 * The browser is exempt too, and that exemption is load-bearing. This module
 * is reachable from client components — lib/dashboard/storefront-mapping
 * imports it for `mediaRef`, and ColorSection imports that module for its
 * label constants — so it ends up in the client bundle. There, NODE_ENV is
 * "production" like everywhere else in a built app, while CMS_URL is absent
 * by design: it carries no NEXT_PUBLIC_ prefix precisely because the backend
 * origin is not the browser's business. The guard therefore matched on every
 * hydration and threw, which took /dashboard/storefront down with
 * "This page couldn't load" and no server-side log to explain it — the throw
 * was happening in the visitor's tab, not on the server.
 *
 * Checking `typeof window` keeps the check exactly where it has meaning: a
 * server booting without its backend URL still refuses to start.
 */
const isProduction = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const isServer = typeof window === "undefined";

if (isServer && isProduction && !isBuildPhase && !process.env.CMS_URL?.trim()) {
  throw new Error(
    // The example is the compose-network address on purpose. This was
    // "https://api.paradhiver.ma", a hostname that has never had a DNS record
    // — the CMS is deliberately not published, so anyone who followed the
    // suggestion was sent to configure a backend that does not exist.
    "CMS_URL is required in production (e.g. http://backend:3001). " +
      "See frontend/.env.example.",
  );
}

export const CMS_URL = process.env.CMS_URL?.trim() || "http://localhost:3001";

/**
 * Defined in ./routing, re-exported here so every existing importer keeps
 * working. Importing them *from here* re-arms the guard above — which is
 * correct for anything that also reads the CMS, and wrong for the proxy.
 */
export { PREVIEW_PREFIX, SESSION_COOKIE } from "./routing";
