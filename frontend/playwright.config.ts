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
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3002",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next dev --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
