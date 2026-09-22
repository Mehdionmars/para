import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The proxy must load on a deployment that is missing CMS_URL.
 *
 * September 2026, the public domain: proxy.ts imported SESSION_COOKIE and
 * PREVIEW_PREFIX from lib/dashboard/constants, which throws at module scope
 * when CMS_URL is unset in production. The middleware therefore failed to
 * initialise, and every path its matcher covers — "/", every locale, the 404
 * path, and /api/health — answered a bare 500 with no body and no
 * content-type. Only the paths the matcher excludes (anything with a dot,
 * favicon.ico) still served, so the site looked uniformly dead while the build
 * was green and every container was healthy.
 *
 * The guard is not the bug and is asserted below to still be armed. Its reach
 * was: a check that belongs at the edge of the app had been wired ahead of
 * every request into it, including the one probe that could have reported the
 * cause.
 */

const MISCONFIGURED = { CMS_URL: "", NEXT_PHASE: "", NODE_ENV: "production" } as const;

function stubMisconfiguredProduction() {
  for (const [key, value] of Object.entries(MISCONFIGURED)) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("proxy import graph", () => {
  it("loads in production with no CMS_URL", async () => {
    stubMisconfiguredProduction();

    const mod = await import("@/proxy");

    expect(typeof mod.proxy).toBe("function");
  });

  it("gets its routing constants from a module that reads no environment", async () => {
    stubMisconfiguredProduction();

    const routing = await import("@/lib/dashboard/routing");

    expect(routing.SESSION_COOKIE).toBe("dashboard_token");
    expect(routing.PREVIEW_PREFIX).toBe("/preview");
  });

  it("still refuses to load the CMS module in that same configuration", async () => {
    stubMisconfiguredProduction();

    // The point of the fix is the blast radius, never the guard: a server that
    // cannot reach a backend must still fail rather than serve an empty shop.
    await expect(import("@/lib/dashboard/constants")).rejects.toThrow(/CMS_URL is required/);
  });

  it("keeps re-exporting the routing constants for everything else", async () => {
    vi.stubEnv("CMS_URL", "http://backend:3001");
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();

    const constants = await import("@/lib/dashboard/constants");

    expect(constants.SESSION_COOKIE).toBe("dashboard_token");
    expect(constants.PREVIEW_PREFIX).toBe("/preview");
    expect(constants.CMS_URL).toBe("http://backend:3001");
  });
});
