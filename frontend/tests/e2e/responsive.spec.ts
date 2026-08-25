import { expect, test } from "@playwright/test";
import { STOREFRONT_ROUTES, VIEWPORTS, hasHorizontalOverflow } from "./helpers";

/**
 * A page that scrolls sideways on a phone is the most reliable sign that a
 * fixed width, an unbroken string or an oversized control escaped its
 * column — so this is checked at every breakpoint the storefront claims to
 * support rather than only at the two extremes.
 */
test.describe("no horizontal overflow", () => {
  for (const width of VIEWPORTS) {
    test(`storefront fits ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const offenders: string[] = [];

      for (const route of STOREFRONT_ROUTES) {
        await page.goto(route);
        await page.waitForLoadState("networkidle").catch(() => {});
        const { scrollWidth, clientWidth, overflows } = await hasHorizontalOverflow(page);
        if (overflows) offenders.push(`${route}: ${scrollWidth} > ${clientWidth}`);
      }

      expect(offenders, offenders.join("\n")).toEqual([]);
    });
  }
});

test.describe("console health", () => {
  for (const route of STOREFRONT_ROUTES) {
    test(`no console or hydration errors on ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        // Cloudinary/remote image 404s in a local dev database are noise
        // about content, not about the page.
        if (/Failed to load resource/i.test(text)) return;
        errors.push(text);
      });
      page.on("pageerror", (err) => errors.push(String(err)));

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => {});

      const hydration = errors.filter((e) => /hydrat/i.test(e));
      expect(hydration, hydration.join("\n")).toEqual([]);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});
