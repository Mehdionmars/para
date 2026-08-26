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
 */
const isProduction = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (isProduction && !isBuildPhase && !process.env.CMS_URL?.trim()) {
  throw new Error(
    "CMS_URL is required in production (e.g. https://api.paradhiver.ma). " +
      "See frontend/.env.example.",
  );
}

export const CMS_URL = process.env.CMS_URL?.trim() || "http://localhost:3001";
export const SESSION_COOKIE = "dashboard_token";
