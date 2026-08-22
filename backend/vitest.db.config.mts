import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Database behaviour tests: concurrency and integrity.
 *
 * These need a real PostgreSQL server because they assert on things only the
 * server decides — whether two transactions racing for the last unit can both
 * win, whether a constraint refuses a write. They never touch the application
 * database: each run creates a throwaway one and drops it.
 *
 * Separate from vitest.config.mts (boots Payload), vitest.unit.config.mts (no
 * database at all) and vitest.security.config.mts (role privileges).
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    // Probe databases and row-lock races must not interleave across files.
    fileParallelism: false,
    hookTimeout: 60_000,
    include: ['tests/db/**/*.spec.ts'],
    testTimeout: 60_000,
  },
})
