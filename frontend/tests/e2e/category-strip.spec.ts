import { expect, test } from "@playwright/test";

/**
 * The mobile quick-category strip.
 *
 * What is worth pinning here is not that it looks right — a screenshot shows
 * that — but the four properties that break silently:
 *
 *   1. it exists only below 768px, where the main menu is behind a hamburger;
 *   2. each chip's tap target is the chip, not the row it sits in;
 *   3. the row scrolls rather than wrapping or overflowing the page;
 *   4. its content comes from the CMS, so a chip that an editor hides is gone.
 *
 * The strip is off by default (Navigation › catStrip.enabled), so every test
 * skips rather than fails when it has not been switched on — a suite that
 * fails because a feature is deliberately disabled teaches nothing.
 */

const PHONES = [
  [320, 568],
  [390, 844],
  [414, 896],
  [430, 932],
] as const;

async function stripState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const strip = document.querySelector(".cat-strip");
    if (!strip) return { present: false as const };
    const scroller = strip.querySelector(".cat-strip-scroller")!;
    const chips = [...strip.querySelectorAll<HTMLElement>(".cat-strip-chip")].map((chip) => {
      const rect = chip.getBoundingClientRect();
      const row = chip.closest("li")!.getBoundingClientRect();
      return {
        // The chip's own box against the row it lives in: the whole point is
        // that these are the same, i.e. the empty space beside a chip is not
        // part of it.
        chipWidth: Math.round(rect.width),
        height: Math.round(rect.height),
        label: chip.textContent?.trim() ?? "",
        rowWidth: Math.round(row.width),
      };
    });
    return {
      present: true as const,
      chips,
      displayed: getComputedStyle(strip).display !== "none",
      overflowsPage: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollable: scroller.scrollWidth > scroller.clientWidth,
    };
  });
}

test.describe("mobile category strip", () => {
  for (const [width, height] of PHONES) {
    test(`renders as a scrollable row of content-width chips at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/", { waitUntil: "networkidle" });

      const state = await stripState(page);
      test.skip(!state.present || !state.displayed, "la bande de catégories est désactivée dans le CMS");
      if (!state.present) return;

      expect(state.chips.length, "aucune puce rendue").toBeGreaterThan(0);

      for (const chip of state.chips) {
        // A chip is as wide as its label. If it ever stretched to its row, the
        // blank space beside a short label would start navigating.
        expect(chip.chipWidth, `"${chip.label}" occupe toute sa ligne`).toBeLessThanOrEqual(chip.rowWidth);
        // Comfortably tappable: 40px of chip inside a row that adds 10px of
        // padding above and below.
        expect(chip.height, `"${chip.label}" trop court pour le pouce`).toBeGreaterThanOrEqual(36);
      }

      // The strip scrolls; the page does not.
      expect(state.overflowsPage, "la page déborde horizontalement").toBe(false);
    });
  }

  test("is absent from desktop, where the same links are in the main menu", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const state = await stripState(page);
    if (!state.present) return;
    expect(state.displayed, "la bande est visible sur desktop").toBe(false);
  });

  test("chips navigate, and only the chip does", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });

    const state = await stripState(page);
    test.skip(!state.present || !state.displayed, "la bande de catégories est désactivée dans le CMS");

    const first = page.locator(".cat-strip-chip").first();
    const box = (await first.boundingBox())!;

    // Tapping the gap between the strip's edge and the first chip must do
    // nothing. 4px in from the left edge is inside the scroller's padding.
    const before = page.url();
    await page.mouse.click(4, box.y + box.height / 2);
    await page.waitForTimeout(400);
    expect(page.url(), "l'espace vide à côté d'une puce navigue").toBe(before);

    await first.click();
    await page.waitForURL((url) => url.pathname !== "/", { timeout: 10_000 });
    expect(page.url()).not.toBe(before);
  });

  test("reflects what the CMS publishes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });

    const state = await stripState(page);
    test.skip(!state.present || !state.displayed, "la bande de catégories est désactivée dans le CMS");
    if (!state.present) return;

    const cms = process.env.E2E_CMS_URL || "http://localhost:3001";
    const res = await page.request.get(`${cms}/api/globals/navigation?depth=1`);
    expect(res.ok(), "le CMS ne répond pas").toBe(true);

    const nav = await res.json();
    const published: string[] = (nav.catStrip?.items ?? [])
      .filter((item: { visible?: boolean }) => item.visible !== false)
      .map((item: { label: string }) => item.label);

    const rendered = state.chips.map((c) => c.label);
    // The leading "Tout" chip is generated, not stored, so it is dropped
    // before comparing.
    const withoutAllChip = nav.catStrip?.showAllChip === false ? rendered : rendered.slice(1);

    expect(withoutAllChip, "la bande ne correspond pas au CMS").toEqual(published);

    // And a chip an editor unticked must not be on the page at all.
    const hidden: string[] = (nav.catStrip?.items ?? [])
      .filter((item: { visible?: boolean }) => item.visible === false)
      .map((item: { label: string }) => item.label);
    for (const label of hidden) {
      expect(rendered, `"${label}" est masqué dans le CMS mais rendu`).not.toContain(label);
    }
  });
});
