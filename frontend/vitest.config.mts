import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for the storefront's pure logic — cart totals, badge rules,
 * chrome appearance CSS, contrast maths. No DOM and no network: everything
 * here is a function of its arguments, which is why the environment is `node`
 * rather than jsdom.
 *
 * `tests/e2e` and `tests/audit` are excluded on purpose: those drive a real
 * browser through Playwright (`npm run test:e2e`) and would hang under vitest.
 *
 * The `@/` alias mirrors tsconfig.json's `paths` by hand rather than through
 * vite-tsconfig-paths, which is not a dependency of this app and is not worth
 * adding for one alias.
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
