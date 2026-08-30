// Kept separate from payload.ts (which imports next/headers) so proxy.ts
// (Edge middleware — no next/headers there) can use these without pulling
// server-only code into the Edge bundle.

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
    "CMS_URL is required in production (e.g. https://api.paradhiver.ma). " +
      "See frontend/.env.example.",
  );
}

export const CMS_URL = process.env.CMS_URL?.trim() || "http://localhost:3001";
export const SESSION_COOKIE = "dashboard_token";
