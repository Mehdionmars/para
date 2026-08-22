import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Unit tests for the backend's pure logic — the money rules above all.
 *
 * Separate from vitest.config.mts on purpose. That suite boots Payload and
 * talks to Postgres, so it cannot run without a database; these run anywhere
 * in under a second, which is what makes them usable as a pre-commit gate on
 * the pricing rules. Anything that genuinely needs a database belongs in
 * tests/int instead.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
  },
})
