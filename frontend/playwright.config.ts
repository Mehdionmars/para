import { defineConfig, devices } from "@playwright/test";

/**
 * The interactive-surface suite runs against a dev server the developer is
 * usually already running, so `reuseExistingServer` is on and the config
 * starts one only when port 3002 is free. Chromium alone: these tests assert
 * geometry and DOM structure, which do not vary by engine, and a second
 * browser would double the run for no extra signal.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  /* These run against `next dev`, which compiles a route the first time it
     is requested. Six workers each walking ten routes turned that cold
     compile into a thundering herd and the overflow specs timed out on
     page.goto — a busy dev server, not a layout regression. Three workers
     and a longer ceiling keep the suite honest about what it measures. */
  workers: process.env.CI ? 1 : 3,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    trace: "on-first-retry",
    // Resolves both test hostnames to the dev server without a hosts-file
    // entry, so the suite runs on a clean machine.
    launchOptions: {
      args: ["--host-resolver-rules=MAP paradhiver.test 127.0.0.1, MAP admin.paradhiver.test 127.0.0.1"],
    },
  },

  /**
   * Two projects, because the app answers to two hostnames.
   *
   * proxy.ts routes by host: `localhost` and anything starting with `admin.`
   * are the dashboard, everything else is the shop. A single baseURL cannot
   * reach both — pointed at localhost the storefront specs all landed on
   * /dashboard/login and failed for the wrong reason, which is what they were
   * doing before this split.
   */
  projects: [
    {
      name: "storefront",
      testIgnore: /dashboard\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: process.env.E2E_BASE_URL || "http://paradhiver.test:3002" },
    },
    {
      name: "dashboard",
      testMatch: /dashboard\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.E2E_DASHBOARD_BASE_URL || "http://admin.paradhiver.test:3002",
      },
    },
  ],
  webServer: {
    command: "npx next dev --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
