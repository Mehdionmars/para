import { expect, test } from "@playwright/test";

/** The phone widths the storefront is expected to hold up at. */
const PHONE_WIDTHS = [320, 360, 375, 390, 414, 430];

/**
 * On a phone the photograph is the reason an overlay card exists, so the
 * copy laid over it must stay a minority of the card and the button must
 * stay the width of its own label.
 */
async function measureCards(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll(".marketing-banner, .overlay-card-tile, .campaign-tile")];
    return cards
      .map((card) => {
        const content = card.querySelector(".overlay-card-content");
        const cta = card.querySelector<HTMLElement>(".overlay-card-cta");
        if (!content) return null;

        const cardBox = card.getBoundingClientRect();
        const contentBox = content.getBoundingClientRect();
        if (cardBox.height === 0) return null;

        let ctaInfo: { width: number; cardWidth: number; bottomGap: number; height: number } | null = null;
        if (cta) {
          const ctaBox = cta.getBoundingClientRect();
          ctaInfo = {
            width: Math.round(ctaBox.width),
            cardWidth: Math.round(cardBox.width),
            bottomGap: Math.round(cardBox.bottom - ctaBox.bottom),
            height: Math.round(ctaBox.height),
          };
        }

        return {
          klass: card.className.split(" ").find((c) => c.includes("card") || c.includes("banner") || c.includes("tile")) || "card",
          coverage: Math.round((contentBox.height / cardBox.height) * 100),
          overflowsCard: contentBox.height > cardBox.height + 1,
          cta: ctaInfo,
        };
      })
      .filter(Boolean);
  });
}

for (const width of PHONE_WIDTHS) {
  test(`overlay cards keep the image dominant at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});

    const cards = await measureCards(page);
    expect(cards.length, "no overlay cards found on the home page").toBeGreaterThan(0);

    for (const card of cards) {
      // The defect this replaced: the copy block was 122% of the card at
      // 320px, i.e. the text spilled straight off the photograph.
      expect(card!.overflowsCard, `${card!.klass}: copy block taller than its card`).toBe(false);

      // The photograph must keep the majority of the card.
      expect(card!.coverage, `${card!.klass}: copy covers ${card!.coverage}% of the card`).toBeLessThanOrEqual(55);

      if (card!.cta) {
        // fit-content, never the full width of the card.
        expect(
          card!.cta.width,
          `${card!.klass}: CTA is ${card!.cta.width}px of a ${card!.cta.cardWidth}px card`,
        ).toBeLessThan(card!.cta.cardWidth * 0.9);

        // Anchored near the bottom edge, reachable by thumb without
        // scrolling the card.
        expect(card!.cta.bottomGap, `${card!.klass}: CTA sits ${card!.cta.bottomGap}px above the card's bottom`).toBeLessThanOrEqual(40);

        expect(card!.cta.height, `${card!.klass}: CTA too short to tap`).toBeGreaterThanOrEqual(40);
      }
    }
  });
}

test("CTA alignment can be moved off the left without touching desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");

  const actions = page.locator(".overlay-card-actions").first();
  await expect(actions).toBeVisible();

  const positionFor = (align: string) =>
    actions.evaluate((el, a) => {
      el.setAttribute("data-cta-align", a);
      const cta = el.querySelector(".overlay-card-cta")!.getBoundingClientRect();
      const row = el.getBoundingClientRect();
      return { left: Math.round(cta.left - row.left), right: Math.round(row.right - cta.right) };
    }, align);

  const left = await positionFor("left");
  const centre = await positionFor("center");
  const right = await positionFor("right");

  expect(left.left, "left-aligned CTA should hug the left edge").toBeLessThan(2);
  expect(Math.abs(centre.left - centre.right), "centred CTA should be evenly spaced").toBeLessThanOrEqual(2);
  expect(right.right, "right-aligned CTA should hug the right edge").toBeLessThan(2);
});

test("trust badges are flush left on a phone and centred on desktop", async ({ page }) => {
  async function iconLefts(width: number) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const bar = page.locator(".trust-bar").first();
    await bar.waitFor({ state: "attached" });
    await bar.scrollIntoViewIfNeeded();
    return page
      .locator(".trust-badge")
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  }

  // One column on a phone: every badge starts at the same x, so the icons
  // form a single left edge instead of drifting with each label's length.
  const phone = await iconLefts(390);
  expect(phone.length, "no trust badges rendered on a phone").toBeGreaterThan(1);
  expect(new Set(phone).size, "badge icons should share one left edge on a phone").toBe(1);

  // Desktop keeps the multi-column row it always had.
  const desktop = await iconLefts(1366);
  expect(desktop.length, "no trust badges rendered on desktop").toBeGreaterThan(1);
  expect(new Set(desktop).size, "desktop badges should still sit in separate columns").toBeGreaterThan(1);
});

test("hero copy is anchored to the bottom on a phone, unchanged on desktop", async ({ page }) => {
  async function read(width: number) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator(".home-hero").first();
    await hero.waitFor();
    return hero.evaluate((h) => {
      const copy = h.querySelector(".home-hero-copy")!.getBoundingClientRect();
      const cta = h.querySelector<HTMLElement>(".home-hero-actions > *");
      const box = h.getBoundingClientRect();
      return {
        gapUnderCopy: Math.round(box.bottom - copy.bottom),
        ctaWidth: cta ? Math.round(cta.getBoundingClientRect().width) : null,
        copyWidth: Math.round(copy.width),
        dots: h.querySelectorAll(".hero-dot-btn").length,
      };
    });
  }

  // The bug this guards: .home-hero-copy-wrap carried align-items:flex-end
  // but was never stretched to the slide, so the rule did nothing and the
  // card sat centred with 208px of image below it.
  const phone = await read(390);
  expect(phone.gapUnderCopy, "hero copy is not sitting on the bottom edge").toBeLessThanOrEqual(40);
  expect(phone.ctaWidth!, "hero CTA should be as wide as its label, not the card").toBeLessThan(phone.copyWidth * 0.75);
  expect(phone.dots, "carousel pagination dots are back").toBe(0);

  // Desktop keeps the copy where it always was: a card floating clear of the
  // bottom edge, not docked to it.
  const desktop = await read(1366);
  expect(desktop.gapUnderCopy, "desktop hero copy moved").toBeGreaterThan(50);
});

/**
 * The hero is the first thing on the page, not the whole of it. If nothing
 * below it breaks the fold, a visitor is given no reason to scroll — which
 * is what a 75vh hero with a 560px floor was doing: 110px of the next
 * section on a 390px phone, and on a 320x568 screen the floor pushed the
 * hero past the bottom of the viewport so nothing showed at all.
 */
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [414, 896],
  [430, 932],
] as const) {
  test(`the section under the hero breaks the fold at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/", { waitUntil: "networkidle" });

    const measured = await page.evaluate(() => {
      const hero = document.querySelector(".home-hero")!.getBoundingClientRect();
      const next = document.querySelector(".mobile-rail-section");
      return {
        heroBottom: Math.round(hero.bottom),
        heroHeight: Math.round(hero.height),
        nextVisible: next ? Math.max(0, Math.round(window.innerHeight - next.getBoundingClientRect().top)) : 0,
        viewport: window.innerHeight,
      };
    });

    expect(measured.heroBottom, "the hero runs past the bottom of the screen").toBeLessThan(measured.viewport);
    expect(measured.nextVisible, "nothing of the next section is visible without scrolling").toBeGreaterThan(40);
  });
}
