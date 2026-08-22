import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the storefront's pure logic — cart line identity, snapshot
 * parsing, totals. Deliberately node-environment and dependency-free: these
 * cover the rules a shopper's money depends on, and they must run in a second
 * without a browser, a database or a rendered component.
 *
 * Anything that needs a real database or a real HTTP round-trip lives in the
 * backend's integration suite instead (backend/tests/int).
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.spec.ts"],
  },
});
