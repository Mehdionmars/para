import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Integration tests: real Payload, real Postgres, real HTTP.
 *
 * `fileParallelism: false` is deliberate and not a workaround.
 *
 * Every file here talks to the *same* database and, in several cases, the
 * same seeded products — orderStatus picks "a published product with stock >
 * 20" rather than creating one, productsBulk snapshots and restores real rows,
 * and the checkout suites assert on shared counters. Run in parallel these
 * interfere in ways that surface as a failure in whichever file happened to be
 * asserting at the wrong moment, which is the least debuggable shape a test
 * failure can take: the suite that fails is not the suite that is wrong.
 *
 * The alternative — a database per worker — is a bigger change than the value
 * it buys here. The whole suite runs in about a minute serially.
 *
 * Unit tests (vitest.unit.config.mts) touch nothing shared and still run in
 * parallel.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    include: ['tests/int/**/*.int.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
