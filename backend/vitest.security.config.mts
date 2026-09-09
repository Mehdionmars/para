import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Database privilege tests.
 *
 * These need a real PostgreSQL server because they assert on things only the
 * server can decide — whether a role may run `COPY ... FROM PROGRAM`, whether a
 * row-level security policy is actually evaluated. They never touch the
 * application database: each run creates a throwaway database, asserts against
 * it, and drops it. If no server is reachable the suite skips rather than
 * fails, so it stays safe to run in CI without a Postgres service.
 *
 * Separate from vitest.config.mts (which boots Payload) and
 * vitest.unit.config.mts (which touches no database at all).
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    // Creating and dropping databases serialises anyway, and parallel runs
    // would race on the probe database name.
    fileParallelism: false,
    hookTimeout: 60_000,
    include: ['tests/security/**/*.spec.ts'],
    testTimeout: 60_000,
  },
})
