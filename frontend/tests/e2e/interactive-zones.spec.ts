import { expect, test } from "@playwright/test";
import {
  STOREFRONT_ROUTES,
  findNestedInteractives,
  findSmallTargets,
  measureContactLinks,
} from "./helpers";

/**
 * The interactive surface must match the thing the visitor understands as
 * interactive. These tests measure that, rather than asserting on class
 * names, so they keep holding if the styling changes.
 */
test.describe("interactive surface matches its content", () => {
  // A phone number or an email address is read as a word and tapped as a
  // word. When the anchor around it is a block or a flex child it silently
  // becomes the width of its column, and the empty half of the row starts
  // dialling. 32px covers the icon gap and sub-pixel rounding; a stretched
  // link overshoots by hundreds.
  for (const route of ["/contact", "/services"]) {
    test(`tel: and mailto: links are content-width on ${route}`, async ({ page }) => {
      await page.goto(route);
      const all = await measureContactLinks(page);
      expect(all.length, `expected contact links on ${route}`).toBeGreaterThan(0);

      // A link that paints itself a card is a card, and §3 of the design
      // rules allows a card to be interactive edge to edge. What is checked
      // here is the bare contact line.
      const links = all.filter((l) => !l.isCard);
      expect(links.length, `expected at least one bare contact line on ${route}`).toBeGreaterThan(0);

      for (const link of links) {
        expect(link.slack, `${link.href} (“${link.text}”) is ${link.slack}px wider than its text`).toBeLessThanOrEqual(32);
      }
    });
  }

  test("empty space beside the email link does not trigger the link", async ({ page }) => {
    await page.goto("/contact");

    const email = page.locator('a[href^="mailto:"]').last();
    await expect(email).toBeVisible();
    const box = (await email.boundingBox())!;

    // The card the link sits in, so we know there IS empty room to the right
    // of the link — otherwise this test would pass vacuously.
    const card = email.locator("xpath=..");
    const cardBox = (await card.boundingBox())!;
    const emptyToTheRight = cardBox.x + cardBox.width - (box.x + box.width);
    // If this fails, the link has already eaten the row: there is no
    // non-interactive space left beside it to click, which is the defect
    // itself rather than a problem with the fixture.
    expect(
      emptyToTheRight,
      `the mailto link spans the whole row (${Math.round(emptyToTheRight)}px of inert space beside it)`,
    ).toBeGreaterThan(40);

    let navigated = false;
    page.on("request", (r) => {
      if (r.url().startsWith("mailto:")) navigated = true;
    });

    // Click well clear of the link's ink but still on the same row.
    await page.mouse.click(cardBox.x + cardBox.width - 12, box.y + box.height / 2);
    await page.waitForTimeout(400);

    expect(navigated, "clicking empty space fired the mailto link").toBe(false);
    expect(page.url(), "clicking empty space navigated away").toContain("/contact");
  });

  // <a> around <button> is invalid HTML and leaves two focus stops on one
  // control; a control inside a control also makes the outer one's hit area
  // steal or swallow the inner one's clicks.
  for (const route of STOREFRONT_ROUTES) {
    test(`no nested interactive elements on ${route}`, async ({ page }) => {
      await page.goto(route);
      const nested = await findNestedInteractives(page);
      // <label> wrapping its own control is the one legitimate nesting.
      const offenders = nested.filter((n) => n.outer.split(".")[0] !== "LABEL");
      expect(offenders, JSON.stringify(offenders, null, 1)).toEqual([]);
    });
  }
});

test.describe("touch targets on phones", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of ["/", "/catalogue", "/panier", "/contact"]) {
    test(`icon-only controls stay tappable on ${route}`, async ({ page }) => {
      await page.goto(route);
      const small = await findSmallTargets(page, 40);
      expect(small, JSON.stringify(small, null, 1)).toEqual([]);
    });
  }

  test("cart quantity steppers are tappable", async ({ page }) => {
    await page.goto("/panier");
    // The empty cart shows no lines, so put something in it first.
    await page.goto("/catalogue");
    const add = page.getByRole("button", { name: /Ajouter .* au panier/i }).first();
    await add.waitFor({ state: "visible" });
    await add.click();

    await page.goto("/panier");
    const minus = page.getByRole("button", { name: /^Retirer un / }).first();
    await expect(minus).toBeVisible();

    const effective = await minus.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const b = getComputedStyle(el, "::before");
      const px = (v: string) => (v && v.endsWith("px") ? parseFloat(v) : 0);
      return { w: r.width - px(b.left) - px(b.right), h: r.height - px(b.top) - px(b.bottom) };
    });

    expect(effective.h, "stepper hit area too short").toBeGreaterThanOrEqual(40);
    expect(effective.w, "stepper hit area too narrow").toBeGreaterThanOrEqual(36);
  });
});

test.describe("keyboard", () => {
  test("mobile drawer nav items are focusable and activate on Enter", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const item = page.getByRole("link", { name: /Mes favoris/ });
    await expect(item).toBeVisible();

    await item.focus();
    await expect(item).toBeFocused();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/favoris");
    expect(page.url()).toContain("/favoris");
  });

  test("product card add-to-cart does not navigate to the product", async ({ page }) => {
    await page.goto("/catalogue");
    const add = page.getByRole("button", { name: /Ajouter .* au panier/i }).first();
    await add.waitFor({ state: "visible" });
    await add.click();
    await page.waitForTimeout(500);
    // The button sits inside the same card as the product link; if the click
    // propagated to it, we would be on /produit/… instead.
    expect(page.url()).toContain("/catalogue");
  });
});
